/* ============================================================
   Unit checks for the question writer's structural checks, no database
   and no model calls:
     node scripts/writer-test.mjs

   The writer grades grid-ins with the app's own grader, and the grader is
   one-way (".6667" typed matches "2/3", "2/3" typed does not match
   ".6667"), so most of these pin down which forms are accepted as a key.
   ============================================================ */
import { buildQuestion, buildGridIn, planBatch, sameValue } from '../lib/writer.js';
import { catalog } from '../lib/coach.js';

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) failures++; };
const has = (r, re) => !!(r.problems && r.problems.some((p) => re.test(p)));

const grid = (extra = {}) => ({
  domain: 'Algebra', skill: 'Linear equations in one variable', difficulty: 'M',
  prompt: 'A plan charges a $12 fee plus $3 per class. Ana paid $22.50. How many classes did she take?',
  answers: ['7/2', '3.5'],
  strategy: 'Write fee plus rate times classes equals total, then solve.',
  hint: 'Take the fee away from the total first.',
  steps: ['12 + 3c = 22.5', '3c = 10.5, so c = 3.5'],
  second_method: 'Divide 22.50 by 3 and remove the 4 classes the fee would buy: 7.5 - 4 = 3.5.',
  likely_wrong: [
    { value: '7.5', trap_id: 'one-step-short', explanation: 'You divided the total by 3 and forgot the fee.' },
    { value: '11.5', trap_id: 'operation-swap', explanation: 'You added the fee instead of taking it away.' }
  ],
  ...extra
});
const MOVE = 'translate';

// ---------- a good grid-in ----------
{
  const r = buildGridIn(grid(), MOVE);
  ok(!r.problems, 'a well formed grid-in passes' + (r.problems ? ': ' + r.problems.join('; ') : ''));
  const p = r.payload || {};
  ok(p.type === 'spr' && p.section === 'math' && p.answers.join() === '7/2,3.5' && !('choices' in p) &&
    Object.keys(p.traps).length === 0 && p.tags.strat === MOVE && p.pool === true &&
    JSON.stringify(p.tags.traps) === JSON.stringify({ w0: 'one-step-short', w1: 'operation-swap' }),
    'payload: type spr, answers, no choices; the likely wrong answers’ traps tagged w0, w1 (never choice indexes)');
  ok(p.wrong_answers && p.wrong_answers.length === 2 && p.wrong_answers[0].value === '7.5' && p.wrong_answers[0].trap === 'one-step-short',
    'payload keeps the likely wrong answers with their traps');
  ok(!JSON.stringify(p).includes('Divide 22.50') && r.audit && /Divide 22\.50/.test(r.audit.second_method),
    'second_method goes to the audit, never into what students get');
}

// ---------- the key ----------
ok(has(buildGridIn(grid({ answers: ['.6667'] }), MOVE), /rounded 2\/3/), 'a rounded decimal key (.6667) is refused: give 2/3');
ok(has(buildGridIn(grid({ answers: ['-.3333'] }), MOVE), /rounded -1\/3/), 'and a negative one (-.3333)');
ok(!buildGridIn(grid({ answers: ['2/3', '.6667', '.6666'] }), MOVE).problems,
  'the exact fraction first, then its rounded and cut-off forms, is accepted');
ok(has(buildGridIn(grid({ answers: ['1 1/2'] }), MOVE), /not an integer, a fraction or a decimal/), 'a mixed number key is refused');
ok(has(buildGridIn(grid({ answers: ['x = 3'] }), MOVE), /not an integer/), 'a key with words is refused');
ok(has(buildGridIn(grid({ answers: ['123456'] }), MOVE), /longer than a grid-in allows/), 'six digits are too long for the grid');
ok(!buildGridIn(grid({ answers: ['-12345'] }), MOVE).problems?.some((x) => /longer/.test(x)),
  'a negative answer may use a sixth character for its sign');
ok(has(buildGridIn(grid({ answers: ['7/2', '3.4'] }), MOVE), /"3\.4" does not equal "7\/2"/), 'an extra form must equal the key');
ok(has(buildGridIn(grid({ answers: [] }), MOVE), /has no answer/), 'no answer is refused');
ok(has(buildGridIn(grid({ answers: ['1', '1.0', '1.00', '1.000'] }), MOVE), /at most 3/), 'more than three forms is refused');
ok(has(buildGridIn(grid({ answers: ['7/2', '7/2'] }), MOVE), /listed twice/), 'a repeated form is refused');

// ---------- exact decimals are not mistaken for rounded fractions ----------
for (const k of ['0.123', '1.234', '2.718', '0.125', '0.67', '12.5', '0.05', '0.143', '0.429', '0.091']) {
  ok(!has(buildGridIn(grid({ answers: [k] }), MOVE), /rounded/), `an exact key ${k} is accepted`);
}
for (const [k, f] of [['.667', '2/3'], ['.666', '2/3'], ['.1667', '1/6'], ['1.333', '4/3'], ['.1429', '1/7'], ['.8333', '5/6'], ['.111', '1/9'], ['.0909', '1/11']]) {
  ok(has(buildGridIn(grid({ answers: [k] }), MOVE), new RegExp('rounded ' + f.replace('/', '\/'))), `${k} is refused as a rounded ${f}`);
}
ok(has(buildGridIn(grid({ answers: ['7/2', '3.5%'] }), MOVE), /"3.5%" is not an integer/), 'an extra form with % is refused');

// ---------- likely wrong answers ----------
ok(has(buildGridIn(grid({ likely_wrong: [] }), MOVE), /has no likely wrong answers/), 'at least one likely wrong answer is required');
ok(has(buildGridIn(grid({ likely_wrong: [{ value: '3.5', trap_id: 'arith-slip', explanation: 'x' }] }), MOVE), /equals the key/),
  'a likely wrong answer equal to the key is refused');
ok(has(buildGridIn(grid({ answers: ['2/3'], likely_wrong: [{ value: '.6667', trap_id: 'arith-slip', explanation: 'x' }] }), MOVE), /equals the key/),
  'including a rounded form of the key (both directions are checked)');
ok(has(buildGridIn(grid({ likely_wrong: [{ value: '50%', trap_id: 'arith-slip', explanation: 'x' }] }), MOVE), /"50%" is not an integer/) &&
  has(buildGridIn(grid({ likely_wrong: [{ value: '123456', trap_id: 'arith-slip', explanation: 'x' }] }), MOVE), /longer than a grid-in allows/),
  'a likely wrong value must also fit the grid (no %, at most 5 characters)');
ok(has(buildGridIn(grid({ likely_wrong: [{ value: 'seven', trap_id: 'arith-slip', explanation: 'x' }] }), MOVE), /not an integer/),
  'a likely wrong answer that is not a number is refused');
ok(has(buildGridIn(grid({ likely_wrong: [{ value: '9', trap_id: 'made-up', explanation: 'x' }] }), MOVE), /unknown trap/),
  'an unknown trap is refused');
ok(has(buildGridIn(grid({ likely_wrong: [{ value: '9', trap_id: 'arith-slip', explanation: 'x' }, { value: '9.0', trap_id: 'arith-slip', explanation: 'y' }] }), MOVE), /listed twice/),
  'the same wrong value twice is refused');

// ---------- shared rules ----------
ok(has(buildGridIn(grid({ second_method: '' }), MOVE), /second_method is empty/), 'second_method is required');
ok(has(buildGridIn(grid({ prompt: 'Use the figure below to find x.' }), MOVE), /figure/), 'a figure reference is refused');
ok(has(buildGridIn(grid({ hint: 'Take the fee away — first.' }), MOVE), /em dash/), 'an em dash is refused');
ok(has(buildGridIn(grid(), 'subject-verb'), /math moves only/), 'grid-ins are refused for Reading and Writing moves');
{
  const r = buildGridIn(grid({ prompt: 'How many? <script>alert(1)</script><img src=x onerror=alert(1)>' }), MOVE);
  ok(r.payload && !/<script|onerror|<img/i.test(JSON.stringify(r.payload)), 'grid-in text is sanitized');
  const w = buildGridIn(grid({ likely_wrong: [{ value: '7.5', trap_id: 'one-step-short', explanation: 'You <img src=x onerror=alert(1)>forgot.' }] }), MOVE);
  ok(w.payload && !/onerror|<img/.test(w.payload.wrong_answers[0].explanation), 'and so are the wrong-answer explanations');
}

// ---------- multiple choice still works, and now needs second_method ----------
{
  const mc = {
    domain: 'Algebra', skill: 'Linear functions', difficulty: 'E', passage: '',
    prompt: 'If 2x + 3 = 11, what is x?', choices: ['3', '4', '5', '7'], answer: 1,
    strategy: 'Undo the operations in reverse order.', hint: 'Subtract 3 first.',
    steps: ['2x = 8', 'x = 4'], second_method: 'Try each choice: only 4 gives 2(4) + 3 = 11.',
    wrong_choices: [
      { index: 0, trap_id: 'arith-slip', explanation: 'An arithmetic slip.' },
      { index: 2, trap_id: 'sign-slip', explanation: 'You added 3.' },
      { index: 3, trap_id: 'operation-swap', explanation: 'You added 3 and halved.' }
    ]
  };
  const r = buildQuestion(mc, 'solve-check');
  ok(!r.problems && r.payload.type === 'mc' && r.audit.second_method && !JSON.stringify(r.payload).includes('Try each choice'),
    'a multiple choice question passes, with second_method kept out of the payload');
  ok(has(buildQuestion({ ...mc, second_method: '' }, 'solve-check'), /second_method is empty/), 'and it also needs second_method');
}

// ---------- how a batch is split ----------
const sprMoves = Object.keys(catalog().strats).filter((id) => catalog().strats[id].gen && catalog().strats[id].gen.spr === true);
ok(sprMoves.length === 11 && sprMoves.every((id) => catalog().strats[id].section === 'math'), `11 math moves take grid-ins (${sprMoves.length})`);
const eq = (a, b) => a.mc === b.mc && a.grid === b.grid;
ok(eq(planBatch(MOVE, 3), { mc: 2, grid: 1 }), 'an empty pool: 2 multiple choice and 1 grid-in');
ok(eq(planBatch(MOVE, 3, { n: 4, grid: 1 }), { mc: 3, grid: 0 }), 'at 25% grid-ins already: none this time');
ok(eq(planBatch(MOVE, 3, { n: 8, grid: 1 }), { mc: 2, grid: 1 }), 'under 25%: one more');
ok(eq(planBatch(MOVE, 1), { mc: 1, grid: 0 }), 'a batch of one is always multiple choice');
ok(eq(planBatch(MOVE, 2), { mc: 1, grid: 1 }), 'a batch of two can take one grid-in');
ok(eq(planBatch('subject-verb', 3), { mc: 3, grid: 0 }), 'Reading and Writing never gets grid-ins');
ok(eq(planBatch('choice-tactics', 3), { mc: 3, grid: 0 }), 'nor does a math move marked multiple choice only');

// ---------- the shared grader ----------
ok(sameValue('2/3', '.6667') && sameValue('.6667', '2/3') && sameValue('3.5', '7/2') && !sameValue('3.4', '7/2'),
  'sameValue compares in both directions');

console.log(failures ? `\n${failures} FAILED` : '\nall writer checks passed');
process.exit(failures ? 1 : 0);
