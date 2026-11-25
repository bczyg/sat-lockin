/* ============================================================
   The coach: an agent that prepares one student's next session.

   It works behind the scenes. The student never sees a plan; they press
   Start and get the questions the coach picked. A session is eight
   questions where the student names the move each question wants, then
   works it.

   It is a tool loop, not a chat. Claude gets the catalog in its system
   prompt and three read-only tools over this student's own synced record
   (an overview, one move in depth, one trap in depth). It looks at what it
   needs, then calls prepare_session with the moves to drill and one short
   line to the student. The server then picks the concrete questions from
   the bank plus the shared pool of verified fresh questions (lib/writer.js):
   unseen ones first, never the same question twice.

   Misses a student pasted in from an official practice test (Bluebook)
   are events whose attempt starts with 'log-'. They are the strongest
   signal the coach has, so the overview reports them on their own and the
   server's fill reaches for those moves first.

   Guardrails, because the session drives the app:
   - Tools only read, and only this student's rows.
   - Every move id is checked against the catalog and the bank. A bad
     submission goes back to Claude as a tool error so it can fix it,
     rather than reaching the student.
   - The loop is capped, and the whole session costs one unit of the
     student's daily AI allowance.
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { query } from './db.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TURNS = 8;
export const SESSION_SIZE = 8;
const MIN_MOVES = 4;
const MAX_SAME_MOVE = 3;
const MAX_LINE = 100;
const PLAIN_ENGLISH_IDS = new Set(['subject-verb']);

/* ---------------- the catalog, loaded from the app's own files ----------------
   The same js/tags.js and question banks the browser runs, evaluated in a
   sandbox, so the server and the app can never disagree about an id. */
let CAT = null;
export function catalog() {
  if (CAT) return CAT;
  const ctx = {};
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of ['js/data-rw.js', 'js/data-math.js', 'js/tags.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  const bank = [...(ctx.RW_BANK || []), ...(ctx.MATH_BANK || [])];
  const byStrat = {};
  const byTrap = {};
  bank.forEach((q) => {
    const t = ctx.tagsFor(q);
    if (t.strat) (byStrat[t.strat] = byStrat[t.strat] || []).push(q.id);
    Object.values(t.traps || {}).forEach((id) => {
      (byTrap[id] = byTrap[id] || []);
      if (!byTrap[id].includes(q.id)) byTrap[id].push(q.id);
    });
  });
  CAT = { strats: ctx.STRATS, traps: ctx.TRAPS, vs: ctx.STRAT_VS || {}, bank, byStrat, byTrap, tagsFor: ctx.tagsFor };
  return CAT;
}

export function stratName(id) { const s = catalog().strats[id]; return s ? s.name : id; }
export function trapName(id) { const t = catalog().traps[id]; return t ? t.name : id; }
export function tellApart(a, b) { const v = catalog().vs; return v[[a, b].sort().join('|')] || null; }
export function lookAlikes(id) {
  return Object.keys(catalog().vs).map((k) => k.split('|'))
    .filter((p) => p.includes(id)).map((p) => (p[0] === id ? p[1] : p[0]));
}
/* A move can be drilled only if it is a real question type with worked
   questions behind it; "read the choices down the column" is a habit, not
   a question type. */
export function nameable(id) {
  const c = catalog();
  const s = Object.prototype.hasOwnProperty.call(c.strats, id) ? c.strats[id] : null;
  return !!(s && !s.meta && (c.byStrat[id] || []).length);
}
export function nameableMoves() { return Object.keys(catalog().strats).filter(nameable); }

/* ---------------- the system prompt ----------------
   Identical for every student, so it caches across all of them. Anything
   about this student comes through tools. */
let SYSTEM = null;
function systemPrompt() {
  if (SYSTEM) return SYSTEM;
  const c = catalog();
  const moves = nameableMoves()
    .map((id) => `  ${id} [${c.strats[id].section}] ${c.strats[id].name}`).join('\n');
  const traps = Object.keys(c.traps).map((id) => `  ${id}: ${c.traps[id].name}`).join('\n');
  SYSTEM = `You are the coach inside SAT LockIn, a study app built on one idea: the last stretch of SAT prep is recognizing which move a question wants, then executing it. It is not a question bank to grind.

You work behind the scenes. Your job is to choose the moves for this student's next session. A session is ${SESSION_SIZE} questions. On each one the student first names the move the question wants, then works it. The app picks the actual questions for the moves you choose, favoring ones the student has not seen. Nobody reads anything you write except the one line you submit.

How to work:
- Start with get_student_overview. Look deeper with get_move_detail or get_trap_detail only where it changes your choice. One or two lookups is usually plenty.
- Then call prepare_session. Always end by calling it.

Choosing the moves:
- Give ${MIN_MOVES} to ${SESSION_SIZE} move ids, one per question, in any order. If you give fewer than ${SESSION_SIZE}, the app fills the rest with moves the student has never met or names least reliably.
- A move may repeat, but no more than ${MAX_SAME_MOVE} times in one session.
- Misses from official practice tests are the strongest signal you have. bluebook_misses in the overview lists the moves and traps behind questions the student got wrong on a real Bluebook test and pasted in. A move missed there should usually be in the session, often twice.
- Then weight the session toward the moves this student confuses with each other or names least reliably. When they keep naming one move as another, include both so they practice telling them apart.
- Mix in one or two moves they have never met.
- Now and then include a move they name reliably, for confidence.
- Unseen counts include a shared pool of fresh questions, and a move that runs low gets new ones written for it. A low count is a small reason to wait on a move, never a reason to skip one they need.
- Do not repeat the previous session's mix exactly. Vary it.
- A brand-new student with little or no record gets a broad mix across both sections.
- Use only move ids from the list below. Never invent one.

The line:
- One short sentence to the student, under ${MAX_LINE} characters, saying what today's session leans on and why.
- Warm and plain. Name moves by their names, never their ids. No em dashes, no exclamation marks.
- Example: "Today leans on transitions and subject-verb agreement, the two you mix up most."
- If the session includes moves they missed on Bluebook, the line may say so, for example "Two of these come from your Bluebook test: pronouns and transitions."

MOVES (id [section] name):
${moves}

TRAPS (id: name), for reading the record:
${traps}`;
  return SYSTEM;
}

/* ---------------- tools ---------------- */
const TOOLS = [
  {
    name: 'get_student_overview',
    description: "The student's whole record in one view: activity, Daily LockIn, naming accuracy, the moves they confuse, the traps that catch them, their misses on official Bluebook practice tests, their weakest moves in practice, how many unseen questions each move has left, and the previous session's moves. Call this first.",
    input_schema: { type: 'object', properties: {}, additionalProperties: false },
    strict: true
  },
  {
    name: 'get_move_detail',
    description: 'One move in depth for this student: how often they name it, what they mistake it for and what they mistake for it, how they do on its questions in practice, how often they missed it on Bluebook, which traps catch them there, its look-alikes with the tell-apart, and how many of its questions they have not seen.',
    input_schema: {
      type: 'object',
      properties: { move_id: { type: 'string', description: 'A move id from the catalog.' } },
      required: ['move_id'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'get_trap_detail',
    description: 'One trap in depth for this student: how often and how recently it caught them, including on Bluebook, on which moves, and how many bank questions carry it.',
    input_schema: {
      type: 'object',
      properties: { trap_id: { type: 'string', description: 'A trap id from the catalog.' } },
      required: ['trap_id'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'prepare_session',
    description: `Submit the next session. This ends your turn. moves: ${MIN_MOVES} to ${SESSION_SIZE} move ids, one per question, at most ${MAX_SAME_MOVE} of the same. line: one short sentence to the student. If something is invalid you will get an error explaining why; fix it and call prepare_session again.`,
    input_schema: {
      type: 'object',
      properties: {
        moves: { type: 'array', items: { type: 'string' }, description: 'Move ids, one per question.' },
        line: { type: 'string', description: 'One short sentence to the student.' }
      },
      required: ['moves', 'line'],
      additionalProperties: false
    },
    strict: true
  }
];

const pct = (r, n) => (n ? Math.round((100 * r) / n) : null);

/* Every question this student has met, in practice or in a naming round,
   with when they last met it. */
async function seenQids(userId) {
  const rows = (await query(
    `select qid, max(t) as last from (
       select qid, t from events where user_id = $1 and qid is not null
       union all
       select qid, t from naming_reps where user_id = $1 and qid is not null
     ) s group by qid`, [userId])).rows;
  const m = new Map();
  rows.forEach((r) => m.set(r.qid, r.last ? new Date(r.last).getTime() : 0));
  return m;
}

/* The shared pool's ids by move: fresh questions Claude wrote and a second
   model checked (lib/writer.js). Ids only; the payloads are fetched for
   the few a session actually uses. */
export async function poolIndex() {
  const rows = (await query('select id, strat from pool_questions')).rows;
  const by = {};
  rows.forEach((r) => { (by[r.strat] = by[r.strat] || []).push(r.id); });
  return by;
}
function questionsFor(move, pool) {
  return [...(catalog().byStrat[move] || []), ...(pool[move] || [])];
}

/* How many questions of each move, bank and pool together, this student
   has not met, leaving out `exclude` (a session about to be served). */
export async function unseenCounts(userId, moves, exclude = []) {
  const [seen, pool] = await Promise.all([seenQids(userId), poolIndex()]);
  const skip = new Set(exclude);
  const out = {};
  moves.forEach((m) => { out[m] = questionsFor(m, pool).filter((q) => !seen.has(q) && !skip.has(q)).length; });
  return out;
}

/* Misses pasted in from an official practice test. Store.logMisses writes
   them as events with attempt 'log-...', no qid, the move the question
   wanted and the trap that caught the student. */
const BLUEBOOK = `attempt like 'log-%'`;
async function bluebookMisses(userId) {
  const [tot, byMove, byTrap] = await Promise.all([
    query(`select count(*)::int as all_time,
                  count(*) filter (where t > now() - interval '30 days')::int as last_30_days,
                  max(t) as most_recent
             from events where user_id = $1 and ${BLUEBOOK}`, [userId]),
    query(`select strat, count(*)::int as n, max(t) as last from events
            where user_id = $1 and ${BLUEBOOK} and strat is not null and t > now() - interval '30 days'
            group by strat order by n desc, last desc limit 10`, [userId]),
    query(`select trap, count(*)::int as n, max(t) as last from events
            where user_id = $1 and ${BLUEBOOK} and trap is not null and t > now() - interval '30 days'
            group by trap order by n desc, last desc limit 10`, [userId])
  ]);
  const t = tot.rows[0];
  return {
    last_30_days: t.last_30_days,
    all_time: t.all_time,
    most_recent: t.most_recent,
    by_move: byMove.rows.map((x) => ({ move_id: x.strat, name: stratName(x.strat), times: x.n, last: x.last })),
    by_trap: byTrap.rows.map((x) => ({ trap_id: x.trap, name: trapName(x.trap), times: x.n, last: x.last }))
  };
}

/* Moves missed on Bluebook in the last 30 days, with counts, for the fill. */
async function bluebookMoves(userId) {
  const rows = (await query(
    `select strat, count(*)::int as n from events
      where user_id = $1 and ${BLUEBOOK} and strat is not null and t > now() - interval '30 days'
      group by strat`, [userId])).rows;
  return new Map(rows.map((r) => [r.strat, r.n]));
}

async function overview(userId, today) {
  const ev = (await query(
    `select count(*)::int as n, count(*) filter (where correct)::int as r,
            min(t) as first, count(distinct date(t))::int as days
       from events where user_id = $1`, [userId])).rows[0];
  const nm = (await query(
    `select strat, count(*)::int as n, count(*) filter (where "right")::int as r, max(t) as last
       from naming_reps where user_id = $1 group by strat`, [userId])).rows;
  const conf = (await query(
    `select strat, picked, count(*)::int as n from naming_reps
      where user_id = $1 and not "right" and picked is not null
      group by strat, picked order by n desc limit 6`, [userId])).rows;
  const traps = (await query(
    `select trap, count(*)::int as n, max(t) as last from events
      where user_id = $1 and trap is not null
      group by trap order by n desc limit 6`, [userId])).rows;
  const weak = (await query(
    `select strat, count(*)::int as n, count(*) filter (where correct)::int as r from events
      where user_id = $1 and strat is not null
      group by strat having count(*) >= 3
      order by (count(*) filter (where correct))::float / count(*) asc limit 5`, [userId])).rows;
  const daily = (await query(
    `select to_char(daily, 'YYYY-MM-DD') as d, bool_or("right") as r from naming_reps
      where user_id = $1 and daily is not null and daily > $2::date - 14
      group by daily order by daily desc`, [userId, today])).rows;
  const recent = (await query(
    `select (select count(*)::int from events where user_id = $1 and t > now() - interval '7 days') as answered,
            (select count(*)::int from naming_reps where user_id = $1 and t > now() - interval '7 days') as named`,
    [userId])).rows[0];
  /* The latest session in the new shape. Rows from the old step-based
     planner have no moves and are skipped. */
  const last = (await query(
    `select plan, to_char(day, 'YYYY-MM-DD') as day from coach_plans
      where user_id = $1 and jsonb_typeof(plan->'moves') = 'array'
      order by created_at desc limit 1`, [userId])).rows[0];
  const [seen, pool, bluebook] = await Promise.all([seenQids(userId), poolIndex(), bluebookMisses(userId)]);

  const allMoves = nameableMoves();
  const seenMoves = new Set(nm.map((r) => r.strat));
  const named = nm.reduce((a, r) => ({ n: a.n + r.n, r: a.r + r.r }), { n: 0, r: 0 });
  const solid = nm.filter((r) => r.n >= 3 && r.r / r.n >= 0.8).map((r) => stratName(r.strat));
  const shaky = nm.filter((r) => r.n >= 2).sort((a, b) => a.r / a.n - b.r / b.n).slice(0, 5)
    .map((r) => ({ move_id: r.strat, name: stratName(r.strat), named_right: `${r.r}/${r.n}` }));
  const unseen = {};
  allMoves.forEach((id) => { unseen[id] = questionsFor(id, pool).filter((q) => !seen.has(q)).length; });

  return {
    today,
    daily_lockin: {
      done_today: daily.some((d) => d.d === today),
      days_done_last_14: daily.length,
      named_right_last_14: daily.filter((d) => d.r).length
    },
    activity: {
      questions_answered: ev.n,
      practice_accuracy_pct: pct(ev.r, ev.n),
      active_days: ev.days,
      first_active: ev.first,
      last_7_days: recent
    },
    naming: {
      total_named: named.n,
      named_right_pct: pct(named.r, named.n),
      moves_met: `${allMoves.filter((id) => seenMoves.has(id)).length} of ${allMoves.length}`,
      moves_never_met: allMoves.filter((id) => !seenMoves.has(id)),
      named_reliably: solid,
      least_reliable: shaky
    },
    confusions: conf.map((x) => ({
      wanted: x.strat, wanted_name: stratName(x.strat),
      named_instead: x.picked, named_instead_name: stratName(x.picked),
      times: x.n, tell_apart: tellApart(x.strat, x.picked)
    })),
    traps_that_catch_them: traps.map((x) => ({ trap_id: x.trap, name: trapName(x.trap), times: x.n, last: x.last })),
    bluebook_misses: bluebook,
    weakest_moves_in_practice: weak.map((x) => ({ move_id: x.strat, name: stratName(x.strat), right: `${x.r}/${x.n}` })),
    unseen_questions_by_move: unseen,
    previous_session: last ? { day: last.day, moves: last.plan.moves } : null
  };
}

async function moveDetail(userId, id) {
  const c = catalog();
  const s = Object.prototype.hasOwnProperty.call(c.strats, id) ? c.strats[id] : null;
  if (!s) return { error: `No move has the id "${id}". Use an id from the catalog.` };
  const named = (await query(
    `select count(*)::int as n, count(*) filter (where "right")::int as r, max(t) as last
       from naming_reps where user_id = $1 and strat = $2`, [userId, id])).rows[0];
  const asWhat = (await query(
    `select picked, count(*)::int as n from naming_reps
      where user_id = $1 and strat = $2 and not "right" and picked is not null
      group by picked order by n desc`, [userId, id])).rows;
  const forWhat = (await query(
    `select strat, count(*)::int as n from naming_reps
      where user_id = $1 and picked = $2 and not "right"
      group by strat order by n desc`, [userId, id])).rows;
  const prac = (await query(
    `select count(*)::int as n, count(*) filter (where correct)::int as r
       from events where user_id = $1 and strat = $2`, [userId, id])).rows[0];
  const traps = (await query(
    `select trap, count(*)::int as n from events
      where user_id = $1 and strat = $2 and trap is not null
      group by trap order by n desc`, [userId, id])).rows;
  const bb = (await query(
    `select count(*)::int as all_time,
            count(*) filter (where t > now() - interval '30 days')::int as last_30_days, max(t) as last
       from events where user_id = $1 and ${BLUEBOOK} and strat = $2`, [userId, id])).rows[0];
  const bankIds = c.byStrat[id] || [];
  const poolIds = (await poolIndex())[id] || [];
  const qids = [...bankIds, ...poolIds];
  const seen = new Set((await query(
    `select qid from events where user_id = $1 and qid = any($2)
     union select qid from naming_reps where user_id = $1 and qid = any($2)`, [userId, qids])).rows.map((r) => r.qid));
  return {
    move_id: id, name: s.name, section: s.section,
    cues: s.cues || [],
    naming: { named: named.n, named_right: named.r, last: named.last },
    they_named_it_as: asWhat.map((x) => ({ move_id: x.picked, name: stratName(x.picked), times: x.n })),
    they_named_this_when_it_was: forWhat.map((x) => ({ move_id: x.strat, name: stratName(x.strat), times: x.n })),
    practice: { answered: prac.n, right: prac.r },
    bluebook_misses: bb,
    traps_on_its_questions: traps.map((x) => ({ trap_id: x.trap, name: trapName(x.trap), times: x.n })),
    look_alikes: lookAlikes(id).map((o) => ({ move_id: o, name: stratName(o), tell_apart: tellApart(id, o) })),
    bank: { questions: bankIds.length, pool_questions: poolIds.length, not_yet_seen: qids.filter((q) => !seen.has(q)).length },
    can_be_drilled: nameable(id)
  };
}

async function trapDetail(userId, id) {
  const c = catalog();
  const t = Object.prototype.hasOwnProperty.call(c.traps, id) ? c.traps[id] : null;
  if (!t) return { error: `No trap has the id "${id}". Use an id from the catalog.` };
  const caught = (await query(
    `select count(*)::int as n, max(t) as last,
            count(*) filter (where t > now() - interval '14 days')::int as last_14_days
       from events where user_id = $1 and trap = $2`, [userId, id])).rows[0];
  const bb = (await query(
    `select count(*)::int as all_time,
            count(*) filter (where t > now() - interval '30 days')::int as last_30_days, max(t) as last
       from events where user_id = $1 and ${BLUEBOOK} and trap = $2`, [userId, id])).rows[0];
  const on = (await query(
    `select strat, count(*)::int as n from events
      where user_id = $1 and trap = $2 and strat is not null
      group by strat order by n desc limit 5`, [userId, id])).rows;
  return {
    trap_id: id, name: t.name, how_to_spot: t.tell || null, how_to_beat: t.fix || null,
    caught: caught,
    on_bluebook: bb,
    on_moves: on.map((x) => ({ move_id: x.strat, name: stratName(x.strat), times: x.n })),
    bank_questions_carrying_it: (c.byTrap[id] || []).length
  };
}

/* ---------------- checking a submission ---------------- */
export function checkSession(p) {
  const c = catalog();
  const problems = [];
  if (!p || typeof p !== 'object') return { problems: ['The submission is empty.'] };
  const moves = Array.isArray(p.moves) ? p.moves.map((m) => String(m)) : [];
  const line = String(p.line || '').trim().replace(/\s+/g, ' ');

  if (moves.length < MIN_MOVES || moves.length > SESSION_SIZE) {
    problems.push(`Give ${MIN_MOVES} to ${SESSION_SIZE} moves; you gave ${moves.length}.`);
  }
  const bad = [...new Set(moves.filter((m) => !nameable(m)))];
  if (bad.length) problems.push(`Not a move that can be drilled: ${bad.map((b) => `"${b}"`).join(', ')}. Use move ids from the catalog.`);
  const counts = {};
  moves.forEach((m) => { counts[m] = (counts[m] || 0) + 1; });
  const over = Object.keys(counts).filter((m) => counts[m] > MAX_SAME_MOVE);
  if (over.length) problems.push(`Use a move at most ${MAX_SAME_MOVE} times; ${over.map((m) => `"${m}" appears ${counts[m]} times`).join(', ')}.`);

  if (!line) problems.push('line is empty.');
  if (line.length >= MAX_LINE) problems.push(`line must be under ${MAX_LINE} characters; it is ${line.length}.`);
  if (/—/.test(line)) problems.push('Do not use em dashes in line.');
  /* Move ids that read as plain English ("subject-verb agreement") are
     allowed; trap ids are not checked for the same reason ("one-sided"). */
  const ids = Object.keys(c.strats).filter((id) => /[-_]/.test(id) && !PLAIN_ENGLISH_IDS.has(id));
  const leaked = ids.filter((id) => new RegExp(`(^|[^a-z0-9-])${id.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&')}($|[^a-z0-9-])`, 'i').test(line));
  if (leaked.length) problems.push(`line uses ids (${leaked.join(', ')}). Use the names a student would read.`);

  if (problems.length) return { problems };
  return { moves, line };
}

/* ---------------- choosing the questions ----------------
   For each move, a question the student has not seen, from the bank or the
   shared pool. When both have unseen ones, the two take turns, so the pool
   is used as much as the bank. Failing that, the question they saw longest
   ago. Never the same question twice. Then fill to SESSION_SIZE with the
   moves they missed on Bluebook, then the moves they have never met or
   name least reliably. */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Full payloads of the pool questions among qids, in qids order. The client
   has no copy of these and installs them from the session. */
export async function poolPayloads(qids) {
  const ids = (qids || []).filter((q) => typeof q === 'string' && q.startsWith('p'));
  if (!ids.length) return [];
  const rows = (await query('select id, payload from pool_questions where id = any($1)', [ids])).rows;
  const by = new Map(rows.map((r) => [r.id, r.payload]));
  return ids.filter((q) => by.has(q)).map((q) => by.get(q));
}

export async function pickQuestions(userId, moves) {
  const c = catalog();
  const [seen, pool] = await Promise.all([seenQids(userId), poolIndex()]);
  const used = new Set();
  const perMove = {};
  const fromBank = {};
  const fromPool = {};
  const picked = [];

  const take = (move) => {
    if ((perMove[move] || 0) >= MAX_SAME_MOVE) return false;
    const bank = (c.byStrat[move] || []).filter((q) => !used.has(q));
    const extra = (pool[move] || []).filter((q) => !used.has(q));
    if (!bank.length && !extra.length) return false;
    const freshBank = bank.filter((q) => !seen.has(q));
    const freshPool = extra.filter((q) => !seen.has(q));
    let qid;
    if (freshBank.length || freshPool.length) {
      let usePool;
      if (freshBank.length && freshPool.length) {
        const b = fromBank[move] || 0;
        const p = fromPool[move] || 0;
        usePool = b === p ? Math.random() < 0.5 : p < b;
      } else usePool = !freshBank.length;
      qid = shuffle(usePool ? freshPool : freshBank)[0];
      if (usePool) fromPool[move] = (fromPool[move] || 0) + 1;
      else fromBank[move] = (fromBank[move] || 0) + 1;
    } else {
      qid = [...bank, ...extra].sort((a, b) => seen.get(a) - seen.get(b))[0];
    }
    used.add(qid);
    perMove[move] = (perMove[move] || 0) + 1;
    picked.push({ qid, move });
    return true;
  };

  moves.forEach((m) => { if (picked.length < SESSION_SIZE && nameable(m)) take(m); });

  if (picked.length < SESSION_SIZE) {
    const [stats, bluebook] = await Promise.all([
      query(
        `select strat, count(*)::int as n, count(*) filter (where "right")::int as r
           from naming_reps where user_id = $1 group by strat`, [userId]).then((r) => r.rows),
      bluebookMoves(userId)
    ]);
    const byMove = new Map(stats.map((s) => [s.strat, s]));
    /* Missed on Bluebook first (most missed first), then never met (in
       random order, so two fills differ), then the lowest naming accuracy. */
    const ranked = shuffle(nameableMoves()).sort((a, b) => {
      const ba = bluebook.get(a) || 0; const bb = bluebook.get(b) || 0;
      if (ba !== bb) return bb - ba;
      const x = byMove.get(a); const y = byMove.get(b);
      if (!x || !y) return (x ? 1 : 0) - (y ? 1 : 0);
      return x.r / x.n - y.r / y.n || x.n - y.n;
    });
    /* One pass per round, so the fill spreads across moves before any
       move gets a second question. */
    let added = true;
    while (picked.length < SESSION_SIZE && added) {
      added = false;
      for (const m of ranked) {
        if (picked.length >= SESSION_SIZE) break;
        if (take(m)) added = true;
      }
    }
  }

  /* Shuffled, so the order gives nothing away about the move. */
  shuffle(picked);
  const qids = picked.map((p) => p.qid);
  return { qids, moves: picked.map((p) => p.move), questions: await poolPayloads(qids) };
}

/* ---------------- the loop ---------------- */
async function runTool(name, input, ctx) {
  try {
    if (name === 'get_student_overview') return await overview(ctx.userId, ctx.today);
    if (name === 'get_move_detail') return await moveDetail(ctx.userId, String(input.move_id || ''));
    if (name === 'get_trap_detail') return await trapDetail(ctx.userId, String(input.trap_id || ''));
    return { error: `Unknown tool ${name}.` };
  } catch (e) {
    console.error('[coach] tool failed', name, e?.message);
    return { error: 'That lookup failed. Choose from what you already have.' };
  }
}

/* client: an Anthropic client. Returns { session: {qids, moves, line, questions},
   turns, usage } or throws with a status. */
export async function prepare({ client, model, userId, today }) {
  const ctx = { userId, today };
  const messages = [{
    role: 'user',
    content: `Prepare this student's next session (their date is ${today}). Look at their record with your tools, then call prepare_session.`
  }];
  const usage = { input: 0, output: 0, cache_read: 0, cache_write: 0 };
  let nudged = false;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const res = await client.messages.create({
      model,
      max_tokens: 6000,
      /* The catalog prompt and the tools are the same for every student,
         so they cache across all of them; the automatic breakpoint then
         caches each turn of this loop for the next one. */
      system: [{ type: 'text', text: systemPrompt(), cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages,
      cache_control: { type: 'ephemeral' },
      thinking: { type: 'adaptive' },
      output_config: { effort: 'medium' }
    });
    usage.input += res.usage?.input_tokens || 0;
    usage.output += res.usage?.output_tokens || 0;
    usage.cache_read += res.usage?.cache_read_input_tokens || 0;
    usage.cache_write += res.usage?.cache_creation_input_tokens || 0;

    if (res.stop_reason === 'refusal') throw Object.assign(new Error('The coach could not prepare a session.'), { status: 502 });

    /* Thinking blocks go back exactly as they came, with the rest of the
       turn, or the next request is rejected. */
    messages.push({ role: 'assistant', content: res.content });
    const calls = res.content.filter((b) => b.type === 'tool_use');

    if (!calls.length) {
      if (res.stop_reason === 'max_tokens' || nudged) break;
      nudged = true;
      messages.push({ role: 'user', content: 'Call prepare_session now with the next session.' });
      continue;
    }

    const results = [];
    let done = null;
    for (const call of calls) {
      if (call.name === 'prepare_session') {
        const checked = checkSession(call.input);
        if (!checked.problems) { done = checked; results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Session accepted.' }); }
        else {
          results.push({
            type: 'tool_result', tool_use_id: call.id, is_error: true,
            content: 'The session was not accepted:\n- ' + checked.problems.join('\n- ') + '\nFix these and call prepare_session again.'
          });
        }
      } else {
        const out = await runTool(call.name, call.input || {}, ctx);
        results.push({ type: 'tool_result', tool_use_id: call.id, content: JSON.stringify(out) });
      }
    }
    if (done) {
      const q = await pickQuestions(userId, done.moves);
      if (q.qids.length < SESSION_SIZE) throw Object.assign(new Error('Not enough questions to fill a session.'), { status: 502 });
      return { session: { qids: q.qids, moves: q.moves, line: done.line, questions: q.questions }, turns: turn, usage };
    }
    messages.push({ role: 'user', content: results });
  }
  throw Object.assign(new Error('The coach did not finish a session. Try again in a moment.'), { status: 502 });
}

/* ---------------- storage ---------------- */
export const PLANS_PER_DAY = 3;

/* Every row written today, newest first, in either the old plan shape or
   the session shape. All of them count toward PLANS_PER_DAY. */
export async function plansToday(userId, today) {
  return (await query(
    `select id, plan, created_at from coach_plans where user_id = $1 and day = $2 order by created_at desc`,
    [userId, today])).rows;
}

/* The newest session-shaped row of today, as the client sees it. */
export function latestSession(rows) {
  const row = rows.find((r) => r.plan && Array.isArray(r.plan.qids) && Array.isArray(r.plan.moves));
  if (!row) return null;
  return {
    id: String(row.id), qids: row.plan.qids, moves: row.plan.moves, line: row.plan.line || '',
    questions: Array.isArray(row.plan.questions) ? row.plan.questions : []
  };
}

/* Stores { id, qids, moves, line, questions }, with the row's own id
   written into the json in the same statement. `questions` holds the full
   payloads of the pool questions in qids (bank questions are already in
   the app), copied so the session still works if the pool changes. */
export async function saveSession(userId, today, s, meta) {
  const body = { qids: s.qids, moves: s.moves, line: s.line, questions: s.questions || [] };
  const row = (await query(
    `insert into coach_plans (id, user_id, day, plan, model, turns)
     select v.id, $1, $2, $3::jsonb || jsonb_build_object('id', v.id::text), $4, $5
       from (select nextval(pg_get_serial_sequence('coach_plans', 'id')) as id) v
     returning id`,
    [userId, today, JSON.stringify(body), meta.model || null, meta.turns || null])).rows[0];
  return { id: String(row.id), ...body };
}

/* The student's own date, so "today" matches their Daily LockIn, but never
   more than a day away from the server's. */
export function studentDay(raw) {
  const now = new Date();
  const s = String(raw || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T12:00:00Z');
    if (!Number.isNaN(d.getTime()) && Math.abs(d - now) < 36 * 3600 * 1000) return s;
  }
  return now.toISOString().slice(0, 10);
}
