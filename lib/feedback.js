/* ============================================================
   Student feedback: a thumbs up or down on a question they answered (with
   an optional reason), and which move helped most in a session.

   Two things use it:
   - A pool question (written by AI) that qualified students report as
     broken is retired: never served in a new session, still returned for
     a session already prepared, and reversible from the admin page. Bank
     questions are never retired automatically, only listed.
   - The admin page (admin.html, for ADMIN_EMAILS only) shows totals:
     never who said what.

   A vote counts toward retiring only from a student the server served
   that question to, who answered it and has answered at least
   VOTER_MIN_ANSWERS different questions, so a throwaway account cannot
   retire anything. "Too easy" and "Too hard"
   are difficulty data and never count toward retiring; every other thumbs
   down (no reason, confusing, answer looks wrong) counts -1 in the net.
   ============================================================ */
import { query } from './db.js';
import { catalog, nameable } from './coach.js';

export const REASONS = ['wrong', 'confusing', 'easy', 'hard'];
export const VOTER_MIN_ANSWERS = 20;
export const RETIRE_WRONG = 3;          // "Answer looks wrong" from this many qualified students
export const RETIRE_MIN_RATINGS = 5;    // or at least this many ratings ...
export const RETIRE_NET = -3;           // ... netting this or worse
const DAILY_QUESTION_VOTES = 300;
const DAILY_MOVE_VOTES = 10;
const MAX_BATCH = 100;

const ADMINS = new Set(
  String(process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
);
export function isAdmin(user) { return !!(user && user.email && ADMINS.has(String(user.email).toLowerCase())); }

function fail(status, message) { return Object.assign(new Error(message), { status }); }
const isTime = (v) => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());

/* Is this a question students can be served: a bank id, or a pool id? */
async function knownQids(ids) {
  const bank = new Set(catalog().bank.map((q) => q.id));
  const pool = ids.filter((q) => !bank.has(q) && /^p[0-9a-f]{10}$/.test(q));
  const found = new Set(pool.length ? (await query('select id from pool_questions where id = any($1)', [pool])).rows.map((r) => r.id) : []);
  return new Set(ids.filter((q) => bank.has(q) || found.has(q)));
}

/* ---------------- saving ----------------
   Body: { questions: [{ qid, rating: 1 | -1 | 0, reason, t }],
           moves: [{ session, strat, t }] }
   rating 0 clears a vote; strat '' clears a move vote. Each item comes back
   as saved, retry (send it again later: the answer has not synced yet, or
   today's cap is reached) or dropped (it will never be accepted). */
/* One save at a time per student (the service runs as one instance), so
   two tabs flushing at once cannot both read the same daily count. */
const saving = new Map();
export function save(user, body) {
  const prev = saving.get(user.id) || Promise.resolve();
  const next = prev.catch(() => {}).then(() => saveNow(user, body));
  saving.set(user.id, next);
  next.catch(() => {}).then(() => { if (saving.get(user.id) === next) saving.delete(user.id); });
  return next;
}
async function saveNow(user, body) {
  body = body && typeof body === 'object' ? body : {};
  const qs = (Array.isArray(body.questions) ? body.questions : []).slice(0, MAX_BATCH);
  const ms = (Array.isArray(body.moves) ? body.moves : []).slice(0, MAX_BATCH);
  const out = { questions: {}, moves: {} };

  const qids = [...new Set(qs.map((x) => (x && typeof x.qid === 'string' ? x.qid.slice(0, 40) : '')).filter(Boolean))];
  const known = await knownQids(qids);
  const answered = new Set(qids.length ? (await query(
    'select distinct qid from events where user_id = $1 and qid = any($2)', [user.id, qids])).rows.map((r) => r.qid) : []);
  let usedToday = (await query(
    `select count(*)::int as n from question_feedback where user_id = $1 and updated_at > now() - interval '1 day'`, [user.id])).rows[0].n;
  const touched = new Set();

  for (const x of qs) {
    const qid = x && typeof x.qid === 'string' ? x.qid.slice(0, 40) : '';
    if (!qid) continue;
    const rating = x.rating === 1 || x.rating === -1 || x.rating === 0 ? x.rating : null;
    const reason = rating === -1 && REASONS.includes(x.reason) ? x.reason : null;
    if (rating === null || !isTime(x.t) || !known.has(qid)) { out.questions[qid] = 'dropped'; continue; }
    if (!answered.has(qid)) { out.questions[qid] = 'retry'; continue; }
    if (usedToday >= DAILY_QUESTION_VOTES) { out.questions[qid] = 'retry'; continue; }
    /* Only a newer tap wins, so a resend or an out-of-order clear can never
       undo a later choice. A device clock running fast is capped at the
       server's now, so it cannot lock a vote against later changes. */
    const r = await query(
      `insert into question_feedback (user_id, qid, rating, reason, client_t)
       values ($1, $2, $3, $4, least($5::timestamptz, now()))
       on conflict (user_id, qid) do update
         set rating = excluded.rating, reason = excluded.reason, client_t = excluded.client_t, updated_at = now()
         where question_feedback.client_t < excluded.client_t`,
      [user.id, qid, rating, reason, new Date(x.t).toISOString()]);
    if (r.rowCount) { usedToday++; touched.add(qid); }
    out.questions[qid] = 'saved';
  }

  /* A move vote is for a session the student really played (its answers
     are saved as events with attempt 'lockin-<session id>'), and for a move
     that was in it. */
  const sids = [...new Set(ms.map((x) => (x && typeof x.session === 'string' ? x.session.slice(0, 40) : '')).filter(Boolean))];
  const played = new Map(sids.length ? (await query(
    `select substr(attempt, 8) as sid, array_agg(distinct strat) as strats
       from events where user_id = $1 and attempt = any($2) group by attempt`,
    [user.id, sids.map((s) => 'lockin-' + s)])).rows.map((r) => [r.sid, new Set(r.strats)]) : []);
  let movesToday = (await query(
    `select count(*)::int as n from move_feedback where user_id = $1 and updated_at > now() - interval '1 day'`, [user.id])).rows[0].n;
  for (const x of ms) {
    const sid = x && typeof x.session === 'string' ? x.session.slice(0, 40) : '';
    if (!sid) continue;
    const strat = typeof x.strat === 'string' ? x.strat : null;
    if (strat === null || (strat !== '' && !nameable(strat)) || !isTime(x.t)) { out.moves[sid] = 'dropped'; continue; }
    if (strat === '') {
      await query('delete from move_feedback where user_id = $1 and session_id = $2 and client_t < least($3::timestamptz, now())', [user.id, sid, new Date(x.t).toISOString()]);
      out.moves[sid] = 'saved';
      continue;
    }
    if (!played.has(sid)) { out.moves[sid] = 'retry'; continue; }
    /* Retry, not dropped: the answer for that move may simply not have
       synced yet. Nothing is saved either way until it has. */
    if (!played.get(sid).has(strat)) { out.moves[sid] = 'retry'; continue; }
    if (movesToday >= DAILY_MOVE_VOTES) { out.moves[sid] = 'retry'; continue; }
    const r = await query(
      `insert into move_feedback (user_id, session_id, strat, client_t)
       values ($1, $2, $3, least($4::timestamptz, now()))
       on conflict (user_id, session_id) do update
         set strat = excluded.strat, client_t = excluded.client_t, updated_at = now()
         where move_feedback.client_t < excluded.client_t`,
      [user.id, sid, strat, new Date(x.t).toISOString()]);
    if (r.rowCount) movesToday++;
    out.moves[sid] = 'saved';
  }

  for (const qid of touched) if (qid.startsWith('p')) await maybeRetire(qid);
  maybeSweep();
  return out;
}

/* ---------------- retiring ---------------- */
/* Votes that count: from students the server actually served the question
   to (it is in one of their coach sessions, the only way a pool question
   reaches anyone), who answered it, and who have answered at least
   VOTER_MIN_ANSWERS different questions. Answers are reported by the app,
   so the served check is what a throwaway account cannot fake. Votes from
   before a restore do not count: you looked at the question and kept it. */
const QUALIFIED = `
  from question_feedback f
 where f.qid = $1 and f.rating <> 0
   and exists (select 1 from coach_plans cp where cp.user_id = f.user_id and cp.plan->'qids' ? f.qid)
   and exists (select 1 from events e where e.user_id = f.user_id and e.qid = f.qid)
   and (select count(distinct e.qid) from events e where e.user_id = f.user_id and e.qid is not null) >= ${VOTER_MIN_ANSWERS}
   and f.updated_at > coalesce((select restored_at from pool_questions where id = $1), '-infinity')`;

export async function tally(qid) {
  const r = (await query(
    `select count(*) filter (where f.rating = -1 and f.reason = 'wrong')::int as wrong,
            count(*) filter (where not (f.rating = -1 and coalesce(f.reason, '') in ('easy', 'hard')))::int as ratings,
            coalesce(sum(case when f.rating = 1 then 1
                              when f.rating = -1 and (f.reason is null or f.reason in ('wrong', 'confusing')) then -1
                              else 0 end), 0)::int as net
     ${QUALIFIED}`, [qid])).rows[0];
  return r;
}
export function shouldRetire(t) {
  return t.wrong >= RETIRE_WRONG || (t.ratings >= RETIRE_MIN_RATINGS && t.net <= RETIRE_NET);
}
async function maybeRetire(qid) {
  try {
    const t = await tally(qid);
    if (!shouldRetire(t)) return false;
    const r = await query('update pool_questions set retired_at = now() where id = $1 and retired_at is null', [qid]);
    if (r.rowCount) console.log(`[feedback] retired ${qid}: ${t.wrong} said the answer looks wrong, net ${t.net} from ${t.ratings} ratings`);
    return r.rowCount > 0;
  } catch (e) {
    console.error('[feedback] retire check failed:', e?.message);
    return false;
  }
}

/* A vote can qualify after it was cast (its student reaches
   VOTER_MIN_ANSWERS later), so live pool questions with enough votes to
   matter are re-checked now and then: after a save at most every 10
   minutes, and hourly from server.js. */
const SWEEP_EVERY = 10 * 60 * 1000;
let lastSweep = 0;
export async function sweep() {
  lastSweep = Date.now();
  try {
    const rows = (await query(
      `select f.qid from question_feedback f join pool_questions p on p.id = f.qid
        where p.retired_at is null and f.rating = -1
          and (f.reason is null or f.reason in ('wrong', 'confusing'))
          and f.updated_at > coalesce(p.restored_at, '-infinity')
        group by f.qid
       having count(*) filter (where f.reason = 'wrong') >= $1 or count(*) >= $2
        order by max(f.updated_at) desc
        limit 500`, [RETIRE_WRONG, Math.abs(RETIRE_NET)])).rows;
    let n = 0;
    for (const r of rows) if (await maybeRetire(r.qid)) n++;
    return n;
  } catch (e) {
    console.error('[feedback] sweep failed:', e?.message);
    return 0;
  }
}
function maybeSweep() { if (Date.now() - lastSweep > SWEEP_EVERY) sweep(); }

/* ---------------- the admin page ----------------
   Totals only. No email, no user id, nothing that says who voted. */
const plain = (s) => String(s || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;|&#\d+;/gi, ' ').replace(/\s+/g, ' ').trim();

export async function report() {
  const c = catalog();
  const bankById = new Map(c.bank.map((q) => [q.id, q]));
  const nameOf = (m) => (m && c.strats[m] ? c.strats[m].name : m || null);
  const moveOf = {};
  Object.keys(c.byStrat).forEach((m) => c.byStrat[m].forEach((q) => { moveOf[q] = m; }));

  const rated = (await query(
    /* For a restored pool question, only votes since the restore: the
       earlier ones no longer count, so they should not show either. */
    `select f.qid,
            count(*) filter (where f.rating = 1)::int as up,
            count(*) filter (where f.rating = -1)::int as down,
            count(*) filter (where f.rating = -1 and f.reason = 'wrong')::int as wrong,
            count(*) filter (where f.rating = -1 and f.reason = 'confusing')::int as confusing,
            count(*) filter (where f.rating = -1 and f.reason = 'easy')::int as easy,
            count(*) filter (where f.rating = -1 and f.reason = 'hard')::int as hard
       from question_feedback f left join pool_questions p on p.id = f.qid
      where f.rating <> 0 and f.updated_at > coalesce(p.restored_at, '-infinity')
      group by f.qid
      order by count(*) filter (where f.rating = -1) - count(*) filter (where f.rating = 1) desc, count(*) desc
      limit 200`)).rows;
  const poolIds = rated.map((r) => r.qid).filter((q) => !bankById.has(q));
  const pool = new Map(poolIds.length ? (await query(
    'select id, strat, payload, retired_at from pool_questions where id = any($1)', [poolIds])).rows.map((r) => [r.id, r]) : []);
  const questions = rated.map((r) => {
    const b = bankById.get(r.qid);
    const p = pool.get(r.qid);
    const q = b || (p && p.payload) || {};
    return {
      qid: r.qid, source: b ? 'bank' : 'pool', move: b ? (moveOf[r.qid] || null) : (p ? p.strat : null),
      move_name: nameOf(b ? moveOf[r.qid] : p && p.strat),
      type: q.type || 'mc', text: plain((q.passage ? q.passage + ' ' : '') + (q.prompt || '')).slice(0, 220),
      retired: !!(p && p.retired_at),
      up: r.up, down: r.down, wrong: r.wrong, confusing: r.confusing, easy: r.easy, hard: r.hard
    };
  });

  const retired = (await query(
    `select id, strat, payload, retired_at from pool_questions where retired_at is not null order by retired_at desc limit 100`)).rows
    .map((r) => ({ qid: r.id, move: r.strat, move_name: nameOf(r.strat), type: r.payload.type || 'mc',
      text: plain((r.payload.passage ? r.payload.passage + ' ' : '') + r.payload.prompt).slice(0, 220), retired_at: r.retired_at }));

  const moves = (await query(
    `select strat, count(*)::int as helped from move_feedback group by strat order by helped desc`)).rows
    .map((r) => ({ move: r.strat, name: c.strats[r.strat] ? c.strats[r.strat].name : r.strat, helped: r.helped }));

  const writer = (await query(
    `select to_char(day, 'YYYY-MM-DD') as day, attempts, accepted, rejected, grid_asked, grid_kept
       from pool_usage order by pool_usage.day desc limit 14`)).rows;
  const rejects = (await query(
    `select strat, kind, reasons->>0 as reason, count(*)::int as n
       from pool_rejects where created_at > now() - interval '30 days'
      group by strat, kind, reasons->>0 order by n desc limit 40`)).rows.map((r) => ({ ...r, move_name: nameOf(r.strat) }));
  const poolSize = (await query(
    `select strat, count(*) filter (where retired_at is null)::int as live,
            count(*) filter (where retired_at is null and payload->>'type' = 'spr')::int as grid,
            count(*) filter (where retired_at is not null)::int as retired
       from pool_questions group by strat order by strat`)).rows.map((r) => ({ ...r, move_name: nameOf(r.strat) }));

  return { questions, retired, moves, writer, rejects, pool: poolSize,
    rules: { voterMinAnswers: VOTER_MIN_ANSWERS, retireWrong: RETIRE_WRONG, retireMinRatings: RETIRE_MIN_RATINGS, retireNet: RETIRE_NET } };
}

export async function restore(qid) {
  if (typeof qid !== 'string' || !/^p[0-9a-f]{10}$/.test(qid)) throw fail(400, 'That is not a pool question.');
  const r = await query('update pool_questions set retired_at = null, restored_at = now() where id = $1 and retired_at is not null', [qid]);
  if (!r.rowCount) throw fail(404, 'No retired question has that id.');
  console.log(`[feedback] restored ${qid}`);
  return { restored: qid };
}
