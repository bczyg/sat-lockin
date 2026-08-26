#!/usr/bin/env node
/* ============================================================
   Pre-deploy checks.

   Two jobs. First, the question bank has to be structurally sound, because
   a malformed question is invisible until a student hits it mid-test.
   Second, the house style rules are enforced here rather than remembered,
   so they cannot quietly regress: no em dashes in the app's own voice, US
   spelling, and no emoji used as icons.

   Run locally with:  npm run verify
   ============================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const problems = [];
const notes = [];
const fail = (m) => problems.push(m);

/* ---------- 1. every script parses ---------- */
const jsFiles = [
  ...fs.readdirSync(path.join(ROOT, 'js')).map((f) => `js/${f}`),
  ...fs.readdirSync(path.join(ROOT, 'lib')).map((f) => `lib/${f}`),
  'server.js',
  'scripts/verify.js'
].filter((f) => f.endsWith('.js'));

for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, f)], { stdio: 'pipe' });
  } catch (e) {
    fail(`${f} does not parse: ${String(e.stderr || e).split('\n')[0]}`);
  }
}
notes.push(`${jsFiles.length} scripts parse`);

/* ---------- 2. load the banks the way the browser does ---------- */
global.window = global;
global.localStorage = {
  _d: {}, getItem(k) { return this._d[k] ?? null; },
  setItem(k, v) { this._d[k] = v; }, removeItem(k) { delete this._d[k]; }
};
const load = async (f) => import(path.join(ROOT, f));
await load('js/brand.js');
await load('js/config.js');
await load('js/data-rw.js');
await load('js/data-math.js');
await load('js/tags.js');
await load('js/strategies.js');

const bank = [...window.RW_BANK, ...window.MATH_BANK];
notes.push(`${bank.length} questions loaded (${window.RW_BANK.length} RW, ${window.MATH_BANK.length} Math)`);

/* ---------- 3. structural integrity ---------- */
const ids = new Set();
for (const q of bank) {
  const at = `question ${q.id}`;
  if (ids.has(q.id)) fail(`${at}: duplicate id`);
  ids.add(q.id);

  for (const k of ['id', 'section', 'domain', 'skill', 'difficulty', 'type', 'prompt', 'strategy', 'hint', 'steps']) {
    if (!q[k]) fail(`${at}: missing ${k}`);
  }
  if (!['E', 'M', 'H'].includes(q.difficulty)) fail(`${at}: difficulty is ${q.difficulty}`);
  if (!Array.isArray(q.steps) || q.steps.length < 2) fail(`${at}: needs at least 2 steps`);

  const tags = window.tagsFor(q);
  if (!tags.strat) fail(`${at}: no strategy tag`);
  else if (!window.STRATS[tags.strat]) fail(`${at}: unknown strategy "${tags.strat}"`);

  if (q.type === 'mc') {
    if (!Array.isArray(q.choices) || q.choices.length !== 4) fail(`${at}: needs exactly 4 choices`);
    if (typeof q.answer !== 'number' || q.answer < 0 || q.answer > 3) fail(`${at}: answer out of range`);
    const wrong = [0, 1, 2, 3].filter((i) => i !== q.answer);
    for (const i of wrong) {
      if (!q.traps || !q.traps[i]) fail(`${at}: choice ${i} has no explanation`);
      if (!tags.traps[i]) fail(`${at}: choice ${i} has no trap tag`);
      else if (!window.TRAPS[tags.traps[i]]) fail(`${at}: choice ${i} has unknown trap "${tags.traps[i]}"`);
    }
    if (tags.traps[q.answer]) fail(`${at}: the correct choice is tagged as a trap`);
    const seen = new Set();
    for (const c of q.choices) {
      const t = String(c).trim();
      if (!t) fail(`${at}: an empty choice`);
      if (seen.has(t)) fail(`${at}: duplicate choice text`);
      seen.add(t);
    }
  } else if (q.type === 'spr') {
    if (!Array.isArray(q.answers) || !q.answers.length) fail(`${at}: fill-in has no accepted answers`);
    else for (const a of q.answers) {
      if (!/^-?\d*\.?\d+(\/-?\d*\.?\d+)?$/.test(String(a).trim())) {
        fail(`${at}: fill-in answer "${a}" is not a plain number or fraction`);
      }
    }
    if (q.traps && Object.keys(q.traps).length) fail(`${at}: a fill-in should have no traps`);
  } else {
    fail(`${at}: type is "${q.type}"`);
  }
}

/* ---------- 3b. the answer key must not be gameable ----------
   A real form spreads the key roughly evenly. An earlier version of this bank
   keyed 55% of questions to B and never once to D, which a student could have
   exploited to raise their score here without learning anything. */
const keyCount = [0, 0, 0, 0];
const mcItems = bank.filter((q) => q.type === 'mc');
mcItems.forEach((q) => { keyCount[q.answer]++; });
const letters = ['A', 'B', 'C', 'D'];
keyCount.forEach((n, i) => {
  const share = n / mcItems.length;
  if (share < 0.15 || share > 0.35) {
    fail(`answer key is skewed: ${letters[i]} is the key on ${n} of ${mcItems.length} questions ` +
         `(${Math.round(share * 100)}%), outside the 15 to 35 percent band`);
  }
});
notes.push(`answer key spread ${letters.map((l, i) => l + ' ' + keyCount[i]).join(', ')} across ${mcItems.length} items`);

/* Length is the other classic tell: if the correct answer is reliably the
   longest, it can be picked without reading the question. */
let keyLongest = 0;
mcItems.forEach((q) => {
  const lens = q.choices.map((c) => String(c).replace(/<[^>]*>/g, '').trim().length);
  const max = Math.max(...lens);
  if (lens[q.answer] === max && lens.filter((x) => x === max).length === 1) keyLongest++;
});
const longShare = keyLongest / mcItems.length;
if (longShare > 0.40) {
  fail(`the correct answer is the single longest choice on ${Math.round(longShare * 100)}% of ` +
       `questions, which is a tell; chance would be 25%`);
}
notes.push(`correct answer is longest on ${Math.round(longShare * 100)}% of items (chance is 25%)`);

/* ---------- 3c. every trap needs enough questions to practice against ----------
   A "practice this trap" drill with one question in it is not practice. */
const trapCount = {};
Object.keys(window.TRAPS).forEach((t) => { trapCount[t] = 0; });
bank.forEach((q) => {
  const tg = window.tagsFor(q);
  Object.keys(tg.traps).forEach((k) => { trapCount[tg.traps[k]]++; });
});
const orphan = Object.entries(trapCount).filter(([, n]) => n === 0).map(([t]) => t);
if (orphan.length) fail(`traps with no questions at all: ${orphan.join(', ')}`);
const thin = Object.entries(trapCount).filter(([, n]) => n > 0 && n < 4).map(([t, n]) => `${t}(${n})`);
notes.push(`trap coverage: ${Object.keys(trapCount).length} traps, ` +
           `${thin.length} with fewer than 4 questions` + (thin.length ? ` [${thin.join(' ')}]` : ''));

/* ---------- 3d. every strategy needs questions, and every recipe must be sound ----------
   A strategy the app teaches but cannot drill is a promise it does not keep.
   Strategies flagged meta:true are habits that apply to every question in
   their section rather than owning a set, so they are exempt from the count. */
const stratCount = {};
Object.keys(window.STRATS).forEach((k) => { stratCount[k] = 0; });
bank.forEach((q) => {
  const st = window.tagsFor(q).strat;
  if (st !== null && !(st in stratCount)) fail(`question ${q.id} is tagged with unknown strategy ${st}`);
  if (st in stratCount) stratCount[st]++;
});
const untagged = bank.filter((q) => !window.tagsFor(q).strat).map((q) => q.id);
if (untagged.length) fail(`questions with no strategy: ${untagged.join(', ')}`);
const thinStrat = Object.entries(stratCount)
  .filter(([k, n]) => n < 4 && !window.STRATS[k].meta)
  .map(([k, n]) => `${k}(${n})`);
if (thinStrat.length) fail(`strategies with fewer than 4 questions to drill: ${thinStrat.join(', ')}`);
const noRecipe = Object.entries(window.STRATS).filter(([, v]) => !v.gen).map(([k]) => k);
if (noRecipe.length) fail(`strategies with no generation recipe: ${noRecipe.join(', ')}`);
const badRef = [];
Object.entries(window.STRATS).forEach(([k, v]) => {
  (v.gen.traps || []).forEach((t) => { if (!window.TRAPS[t]) badRef.push(`${k} -> ${t}`); });
});
if (badRef.length) fail(`recipes referencing traps that do not exist: ${badRef.join(', ')}`);
const meta = Object.keys(window.STRATS).filter((k) => window.STRATS[k].meta);
notes.push(`${Object.keys(window.STRATS).length} strategies, all with recipes, ` +
           `all drillable (${meta.length} habit${meta.length === 1 ? '' : 's'}: ${meta.join(', ')})`);

/* ---------- 3e. the reference sheet must not claim to provide what it does not ----------
   The digital SAT gives you geometry and volume formulas only. Listing slope
   or the quadratic formula as "provided" is worse than listing nothing. */
const providedLabels = window.STRATEGIES.reference.map((r) => r.label.toLowerCase()).join(' | ');
['slope', 'quadratic', 'distance', 'midpoint', 'arc length', 'sector', 'discriminant', 'vertex']
  .forEach((bad) => {
    if (providedLabels.includes(bad)) {
      fail(`the reference sheet lists "${bad}", which the real test does not provide`);
    }
  });
if (!Array.isArray(window.STRATEGIES.memorize) || window.STRATEGIES.memorize.length < 6) {
  fail('there is no "not on the sheet" list, so students are not told what to memorize');
}
notes.push(`reference sheet: ${window.STRATEGIES.reference.length} provided, ` +
           `${window.STRATEGIES.memorize.length} to memorize`);

/* ---------- 4. every strategy and every trap can actually be drilled ----------
   The app is two catalogs and a daily loop through them. If picking an entry
   from either list cannot assemble a set, that entry is a dead end. */
await load('js/engine.js');

function drillFor(kind, id) {
  const match = kind === 'strat'
  ? (q) => window.tagsFor(q).strat === id
  : (q) => Object.values(window.tagsFor(q).traps || {}).includes(id);
  const pool = bank.filter(match);
  if (!pool.length) return { n: 0 };
  const s = new window.SATP.Session({
    kind: 'drill', section: 'both', count: Math.min(pool.length, 10),
    label: 'check', filter: match, seed: 99
  });
  s.stopTimer();
  const qs = s.mod().questions;
  return { n: qs.length, offTarget: qs.filter((q) => !match(q)).length };
}

let drillable = 0;
for (const id of Object.keys(window.STRATS)) {
  if (window.STRATS[id].meta) continue;
  const r = drillFor('strat', id);
  if (!r.n) { fail(`strategy "${id}" is on the list but no set can be built for it`); continue; }
  if (r.offTarget) fail(`strategy "${id}" drill included ${r.offTarget} questions tagged with another move`);
  drillable++;
}
for (const id of Object.keys(window.TRAPS)) {
  const r = drillFor('trap', id);
  if (!r.n) { fail(`trap "${id}" is on the list but no set can be built for it`); continue; }
  if (r.offTarget) fail(`trap "${id}" drill included ${r.offTarget} questions without that trap`);
  drillable++;
}
notes.push(`${drillable} catalog entries all assemble a practice set`);

/* ---------- 4b. the daily rotation reaches every move ----------
   Daily LockIn promises on the landing page that one pass covers every
   strategy. If a move has no servable question that promise is broken. */
await load('js/daily.js');
{
  const cycle = window.Daily.cycleLength();
  const seenStrat = new Set();
  const seenQ = [];
  let missing = 0;
  for (let i = 0; i < cycle; i++) {
    const key = new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    const pick = window.Daily.pick(key);
    if (!pick) { missing++; continue; }
    seenStrat.add(pick.strat);
    seenQ.push(pick.qid);
    window.Daily.claim(pick);
  }
  if (missing) fail(`${missing} of the ${cycle} days in the rotation could not serve a question`);
  if (seenStrat.size !== cycle) {
    fail(`one rotation covered ${seenStrat.size} of ${cycle} strategies, so a move gets skipped`);
  }
  const dupes = seenQ.length - new Set(seenQ).size;
  if (dupes) fail(`the rotation repeated ${dupes} question(s) inside a single cycle`);
  const stable = window.Daily.pick('2026-01-01').qid === window.Daily.pick('2026-01-01').qid;
  if (!stable) fail('the daily question is not stable for a given date');
  notes.push(`daily rotation: ${cycle} days, ${seenStrat.size} distinct moves, no repeats`);
}

/* ---------- 4c. the calculator page points at questions that exist ----------
   Every trick names bank questions where it is the fastest route. A dead id
   there is a "try it on m0xx" link that opens nothing. */
await load('js/desmos.js');
{
  const ids = new Set(bank.map((q) => q.id));
  let refs = 0, tricks = 0;
  const dead = [];
  for (const g of window.DESMOS.groups) {
    if (!g.tricks || !g.tricks.length) fail(`calculator group "${g.name}" has no tricks`);
    for (const t of g.tricks) {
      tricks++;
      if (!t.type || !t.then) fail(`calculator trick "${t.name}" is missing its keystrokes or outcome`);
      for (const id of (t.qids || [])) {
        refs++;
        if (!ids.has(id)) dead.push(`${t.name} -> ${id}`);
      }
    }
  }
  if (dead.length) fail(`calculator page references questions that do not exist: ${dead.join(', ')}`);
  /* The page is the deep content for one strategy, so that strategy has to
     be real and drillable or the page has nowhere to send anyone. */
  if (!window.STRATS['desmos-first']) fail('the calculator page links to a strategy that does not exist');

  /* The page offers a set built from its own examples, so that set has to
     assemble and must not quietly include anything the page never cited. */
  const cited = [...new Set(window.DESMOS.groups.flatMap((g) => g.tricks.flatMap((t) => t.qids || [])))];
  const set = new window.SATP.Session({
    kind: 'drill', section: 'both', count: Math.min(cited.length, 10),
    label: 'check', seed: 7, filter: (q) => cited.includes(q.id)
  });
  set.stopTimer();
  const served = set.mod().questions.map((q) => q.id);
  if (!served.length) fail('the calculator page offers a practice set that comes back empty');
  const stray = served.filter((id) => !cited.includes(id));
  if (stray.length) fail(`the calculator set served questions the page never cited: ${stray.join(', ')}`);
  notes.push(`calculator page: ${tricks} tricks, ${refs} refs, ${cited.length} questions in its set`);
}

/* ---------- 5. house style ---------- */
/* Em dashes are allowed only inside passages, prompts and answer choices,
   where they are authentic SAT prose. The app's own voice never uses them. */
let voiceDashes = 0;
for (const q of bank) {
  const voice = [q.strategy, q.hint, ...(q.steps || []), ...Object.values(q.traps || {})].join(' ');
  voiceDashes += (voice.match(/—/g) || []).length;
}
for (const t of Object.values(window.TRAPS)) voiceDashes += ((t.tell + t.fix).match(/—/g) || []).length;
for (const st of Object.values(window.STRATS)) voiceDashes += ((st.move + st.why + st.drill).match(/—/g) || []).length;
if (voiceDashes) fail(`${voiceDashes} em dashes in the app's own voice (allowed only in passages and choices)`);
else notes.push('no em dashes in the app voice');

const BRITISH = new RegExp('\\b(' + [
  'practise', 'practising', 'colour', 'colours', 'memorise', 'catalogue', 'neighbourhood',
  'behaviour', 'recognise', 'analyse', 'summarise', 'emphasise', 'centre', 'favourite',
  'travelled', 'labelled', 'cancelled', 'judgement', 'whilst', 'learnt', 'metres',
  'organise', 'sceptical', 'aluminium', 'towards'
].join('|') + ')\\b', 'gi');

/* True emoji and the variation selector that forces emoji presentation. The
   dingbat range is deliberately excluded: the check marks in worked solutions
   are typography, not icons. */
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{FE0F}\u{2600}-\u{26FF}]/gu;

for (const f of [...jsFiles, 'index.html']) {
  if (f === 'scripts/verify.js') continue;      // this file names the words it bans
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const br = src.match(BRITISH);
  if (br) fail(`${f}: British spelling: ${[...new Set(br.map((x) => x.toLowerCase()))].join(', ')}`);
  const em = src.match(EMOJI);
  if (em) fail(`${f}: emoji in source (${[...new Set(em)].join(' ')}), use an inline icon instead`);
}
notes.push('US spelling, and no emoji used as icons');

/* ---------- report ---------- */
console.log('');
for (const n of notes) console.log(`  ok   ${n}`);
if (problems.length) {
  console.log('');
  for (const p of problems) console.log(`  FAIL ${p}`);
  console.log(`\n${problems.length} problem${problems.length === 1 ? '' : 's'} found.\n`);
  process.exit(1);
}
console.log('\nAll checks passed.\n');
