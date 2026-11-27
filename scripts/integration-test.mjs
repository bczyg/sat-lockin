/* ============================================================
   Server integration test: npm run itest

   Starts server.js against a scratch Postgres, drives the API the way the
   app does, and checks the things that matter for real students:
   sign-in limits and races, one account never touching another's rows,
   naming-record sync, purchases from signed Stripe webhooks, the coach
   agent that prepares each paid student's session, the shared pool of
   fresh questions (written, checked blind, sanitized, capped), Bluebook
   misses steering the coach, and CORS.

   It creates accounts (all @example.com, unique per run), so point it at
   a throwaway database, never production. It reads TEST_DATABASE_URL,
   not DATABASE_URL, so it cannot pick up the real one by accident. It also
   empties the shared question pool (pool_questions, pool_usage) first:

     TEST_DATABASE_URL=postgresql://test@localhost:5432/lockin_test npm run itest
   ============================================================ */
import { spawn } from 'node:child_process';
import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { catalog } from '../lib/coach.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = process.env.TEST_DATABASE_URL;
if (!DB) {
  console.error('Set TEST_DATABASE_URL to a scratch Postgres database. See the top of this file.');
  process.exit(2);
}
const PORT = String(18000 + Math.floor(Math.random() * 1000));
const POOL_LIMIT = 1000;
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = 'whsec_itest_' + crypto.randomBytes(8).toString('hex');

/* ---------- a stand-in for the Anthropic API ----------
   The coach is a tool loop, so it is tested as one: the real server code
   talks to this through the real SDK (ANTHROPIC_BASE_URL), and this plays
   Claude's side from a script. Every request is kept so the test can check
   what the server actually sent. Nothing here reaches Anthropic.

   Three callers share it, told apart by their tool: the coach
   (prepare_session, kept in fake.requests), the question writer
   (submit_questions, fake.writer) and the blind checker (submit_verdict,
   fake.verifier). The writer declines unless a test switches it on for one
   move; then it returns three questions: one good (with hostile HTML to be
   stripped), one the checker answers differently, one malformed. */
const FAKE_PORT = Number(PORT) + 1000;
const fake = {
  requests: [], writer: [], verifier: [], gridVerifier: [], gridRun: null, failNext: false,
  writeMove: null, writerDelay: 0, detailMove: 'subject-verb', trapDetail: null
};
const fakeQuestion = (marker, extra = {}) => ({
  domain: 'Standard English Conventions', skill: 'Form, Structure, and Sense', difficulty: 'M',
  passage: `<p>${marker} The committee of local volunteers ______ every spring to plan the harvest fair.</p>`,
  prompt: 'Which choice completes the text so that it conforms to the conventions of Standard English?',
  choices: ['meet', 'meets', 'are meeting', 'have met'], answer: 1,
  strategy: 'Cross out the phrase after the subject, then match the verb to what is left.',
  hint: 'What is left in front of the blank once "of local volunteers" is gone?',
  steps: ['Remove "of local volunteers", which leaves "The committee ______".', '"Committee" is one group, so it takes the singular "meets".'],
  second_method: 'Swap in the pronoun "it" for the committee: "it meets" sounds right, "it meet" does not.',
  wrong_choices: [
    { index: 0, trap_id: 'agreement-by-ear', explanation: 'It agrees with "volunteers", the nearest noun, not the subject.' },
    { index: 2, trap_id: 'agreement-by-ear', explanation: 'Plural "are" again matches "volunteers".' },
    { index: 3, trap_id: 'wrong-tense', explanation: 'Plural "have", and it shifts a yearly habit into the past.' }
  ],
  ...extra
});
// A math multiple choice and a grid-in, for the grid-in run on 'translate'.
const fakeMath = (marker) => ({
  domain: 'Algebra', skill: 'Linear equations in two variables', difficulty: 'E', passage: '',
  prompt: `${marker} A gym charges a $20 joining fee and $15 a month. Which equation gives the cost C after m months?`,
  choices: ['C = 15m + 20', 'C = 20m + 15', 'C = 15m', 'C = 35m'], answer: 0,
  strategy: 'The per-month amount multiplies m; the one-time fee is added once.',
  hint: 'Which number is paid only once?',
  steps: ['The fee is paid once: + 20.', 'Each month adds 15: 15m. So C = 15m + 20.'],
  second_method: 'Check m = 1: the first month costs 20 + 15 = 35, and only C = 15m + 20 gives 35 while also giving 20 at m = 0.',
  wrong_choices: [
    { index: 1, trap_id: 'reversed', explanation: 'You swapped the fee and the monthly charge.' },
    { index: 2, trap_id: 'one-step-short', explanation: 'You dropped the joining fee.' },
    { index: 3, trap_id: 'setup-error', explanation: 'You charged the fee every month.' }
  ]
});
const fakeGrid = (marker, extra = {}) => ({
  domain: 'Algebra', skill: 'Linear equations in one variable', difficulty: 'M',
  prompt: `${marker} A plan charges a $12 fee plus $3 per class. Ana paid $22.50 in all. How many classes did she take?`,
  answers: ['7/2', '3.5'],
  strategy: 'Fee plus rate times classes equals the total; solve for classes.',
  hint: 'Take the fee away from the total first.',
  steps: ['12 + 3c = 22.5', '3c = 10.5, so c = 3.5'],
  second_method: 'Without the fee Ana paid 10.50, and 10.50 / 3 = 3.5.',
  likely_wrong: [{ value: '7.5', trap_id: 'one-step-short', explanation: 'You divided the whole total by 3 and forgot the fee.' }],
  ...extra
});
// What the scripted Claude submits once it fixes its first try: five moves,
// so the server has to fill the last three itself.
const FAKE_MOVES = ['subject-verb', 'subject-verb', 'verb-time', 'boundary-test', 'predict-first'];
// For a Math-only session it first resubmits the reading moves above (to be
// refused for the section), then these.
const FAKE_MATH_MOVES = ['solve-check', 'solve-check', 'translate', 'geometry-toolkit', 'data-inference'];
const fakeMsg = (content, stop) => ({
  id: 'msg_' + crypto.randomBytes(6).toString('hex'), type: 'message', role: 'assistant',
  model: 'claude-sonnet-5-5', content, stop_reason: stop, stop_sequence: null,
  usage: { input_tokens: 900, output_tokens: 120, cache_read_input_tokens: 2400, cache_creation_input_tokens: 0 }
});
const think = (t) => ({ type: 'thinking', thinking: t, signature: 'sig-' + t.length });
const use = (name, input) => ({ type: 'tool_use', id: 'toolu_' + crypto.randomBytes(6).toString('hex'), name, input });
const fakeApi = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const body = JSON.parse(raw || '{}');
    const reply = (status, obj) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); };
    /* The server checks its Anthropic sign-in at startup by listing models. */
    if (req.method === 'GET' && req.url.startsWith('/v1/models')) {
      return reply(200, { data: [{ id: 'claude-sonnet-5-5', type: 'model', display_name: 'Sonnet', created_at: '2026-01-01T00:00:00Z' }], has_more: false, first_id: null, last_id: null });
    }
    const tools = (body.tools || []).map((t) => t.name);
    if (tools.includes('submit_questions')) {
      fake.writer.push(body);
      const move = (/MOVE: (\S+)/.exec(body.messages[0].content) || [])[1];
      if (move !== fake.writeMove) return reply(200, fakeMsg([], 'refusal'));
      if (fake.gridRun) {
        // More of each kind than asked for: the server must keep only what it asked for.
        return reply(200, fakeMsg([think('Two and one.'), use('submit_questions', {
          questions: [fakeMath('MATHQ1'), fakeMath('MATHQ2'), fakeMath('MATHQ3')],
          grid_ins: [fakeGrid(fake.gridRun === 'bad' ? 'BADG' : 'GOODG', fake.gridRun === 'bad' ? { answers: ['1 1/2'] } : {}), fakeGrid('EXTRAG')]
        })], 'tool_use'));
      }
      return setTimeout(() => reply(200, fakeMsg([think('Three questions.'), use('submit_questions', { questions: [
        fakeQuestion('GOODQ <img src=x onerror=alert(1)><script>alert(1)</script>'),
        fakeQuestion('VARYQ'),
        fakeQuestion('BADQ', { prompt: 'Which choice completes the text \u2014 correctly?' })
      ], grid_ins: [] })], 'tool_use')), fake.writerDelay);
    }
    if (tools.includes('submit_grid_verdict')) {
      fake.gridVerifier.push(body);
      return reply(200, fakeMsg([think('Checked.'), use('submit_grid_verdict', {
        answer_value: '3.5', move_id: fake.writeMove, confidence: 'high', difficulty: 'M', problems: []
      })], 'tool_use'));
    }
    if (tools.includes('submit_verdict')) {
      fake.verifier.push(body);
      const text = body.messages[0].content;
      return reply(200, fakeMsg([think('Checked.'), use('submit_verdict', {
        answer_index: /VARYQ/.test(text) ? 2 : /MATHQ/.test(text) ? 0 : 1, move_id: fake.writeMove, confidence: 'high', difficulty: 'M', problems: []
      })], 'tool_use'));
    }
    fake.requests.push({ body, headers: req.headers });
    if (fake.failNext) {
      fake.failNext = false;
      return reply(400, { type: 'error', error: { type: 'invalid_request_error', message: 'scripted failure' } });
    }
    const turn = body.messages.filter((m) => m.role === 'assistant').length;
    if (turn === 0) return reply(200, fakeMsg([think('Start with the overview.'), use('get_student_overview', {})], 'tool_use'));
    if (turn === 1) {
      return reply(200, fakeMsg([think('They mix up two moves.'), use('get_move_detail', { move_id: fake.detailMove }),
        ...(fake.trapDetail ? [use('get_trap_detail', { trap_id: fake.trapDetail })] : [])], 'tool_use'));
    }
    if (turn === 2) {
      // wrong on purpose: an unknown id, and one move four times
      return reply(200, fakeMsg([use('prepare_session', {
        moves: ['not-a-move', 'subject-verb', 'subject-verb', 'subject-verb', 'subject-verb'],
        line: 'Today is about the subject and the verb.'
      })], 'tool_use'));
    }
    const math = /SECTION: math/.test(String(body.messages[0].content));
    if (math && turn >= 4) {
      return reply(200, fakeMsg([think('Math moves only.'), use('prepare_session', {
        moves: FAKE_MATH_MOVES, line: 'Today leans on checking your solutions and translating words into equations.'
      })], 'tool_use'));
    }
    return reply(200, fakeMsg([think('Fix the ids.'), use('prepare_session', {
      moves: FAKE_MOVES,
      line: 'Today leans on subject-verb agreement and verb tense, the two you mix up most.'
    })], 'tool_use'));
  });
});
await new Promise((r) => fakeApi.listen(FAKE_PORT, '127.0.0.1', r));

const server = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: {
    ...process.env, DATABASE_URL: DB, PORT,
    ALLOW_CODE_IN_RESPONSE: 'true', LOG_SIGNIN_CODES: 'true',
    STRIPE_WEBHOOK_SECRET: SECRET, COMP_EMAILS: 'comp@example.com', ADMIN_EMAILS: 'Admin-IT@example.com',
    ALLOWED_ORIGINS: 'https://allowed.example',
    NODE_ENV: 'test', POOL_DAILY_LIMIT: String(POOL_LIMIT),
    ANTHROPIC_API_KEY: 'test-key-not-real', ANTHROPIC_BASE_URL: `http://127.0.0.1:${FAKE_PORT}`
  },
  stdio: ['ignore', 'pipe', 'pipe']
});
let log = '';
server.stdout.on('data', (d) => { log += d; });
server.stderr.on('data', (d) => { log += d; });
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start:\n' + log)), 20000);
  const check = () => { if (/listening on/.test(log)) { clearTimeout(t); resolve(); } else setTimeout(check, 100); };
  check();
});
if (!/database: +connected/.test(log)) {
  server.kill();
  fakeApi.close();
  console.error('The server could not reach TEST_DATABASE_URL:\n' + log);
  process.exit(2);
}
/* The test reads the pool directly, and starts it empty so earlier runs on
   this database cannot leak questions into this one's sessions. */
const pgc = new pg.Client({ connectionString: DB });
await pgc.connect();
await pgc.query('delete from pool_questions');
await pgc.query('delete from pool_usage');
await pgc.query('delete from pool_rejects').catch(() => {});   // absent until the server first applies the schema

let failures = 0;
const ok = (cond, msg) => { console.log((cond ? '  ok   ' : '  FAIL ') + msg); if (!cond) failures++; };

async function post(p, body, token, extra = {}) {
  const r = await fetch(BASE + p, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}), ...extra },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j, headers: r.headers };
}
async function signIn(email) {
  const req = await post('/api/auth/request', { email });
  const v = await post('/api/auth/verify', { email, code: req.body.devCode });
  return { token: v.body.token, user: v.body.user };
}
function stripeHeader(raw, t = Math.floor(Date.now() / 1000), secret = SECRET) {
  const sig = crypto.createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');
  return `t=${t},v1=${sig}`;
}
async function webhook(evt, header) {
  const raw = JSON.stringify(evt);
  return post('/api/billing/webhook', raw, null, { 'stripe-signature': header || stripeHeader(raw) });
}
const run = Date.now().toString(36);
const mail = (n) => `${n}-${run}@example.com`;

try {
  // ---------- sign-in and isolation ----------
  // 1. OTP brute force: 30 parallel wrong guesses must not all be evaluated
  {
    const email = mail('brute');
    const req = await post('/api/auth/request', { email });
    const real = req.body.devCode;
    const wrong = real === '000000' ? '111111' : '000000';
    const res = await Promise.all(Array.from({ length: 30 }, () => post('/api/auth/verify', { email, code: wrong })));
    const mismatches = res.filter((r) => /did not match/.test(r.body?.error || '')).length;
    ok(mismatches <= 6, `parallel wrong guesses evaluated: ${mismatches} (limit 6)`);
    const after = await post('/api/auth/verify', { email, code: real });
    ok(after.status !== 200, 'the real code is dead after the attempt limit');
  }

  // 2. One code, two parallel verifies: only one session
  {
    const email = mail('race');
    const req = await post('/api/auth/request', { email });
    const res = await Promise.all([1, 2, 3].map(() => post('/api/auth/verify', { email, code: req.body.devCode })));
    ok(res.filter((r) => r.status === 200).length === 1, 'a code signs in exactly once under a race');
  }

  const A0 = (await signIn(mail('alice'))).token;
  const B0 = (await signIn(mail('bob'))).token;
  ok(A0 && B0, 'two students signed in');

  // 3. Event keys: B cannot overwrite A's event
  {
    await post('/api/sync/events', { events: [{ key: 'shared-key-' + run, qid: 'm001', correct: true, t: new Date().toISOString() }] }, A0);
    await post('/api/sync/events', { events: [{ key: 'shared-key-' + run, qid: 'm001', correct: false, trap: 'evil' }] }, B0);
    const pa = await post('/api/sync/pull', {}, A0);
    const ev = pa.body.events.find((e) => e.key === 'shared-key-' + run);
    ok(ev && ev.correct === true && ev.trap === null, "B's write did not change A's event");
  }

  // 4. Attempt ids: B cannot overwrite A's attempt
  {
    await post('/api/sync/attempt', { attempt: { id: 'a-1-' + run, label: 'mine', finishedAt: new Date().toISOString() } }, A0);
    await post('/api/sync/attempt', { attempt: { id: 'a-1-' + run, label: 'hijacked', finishedAt: new Date().toISOString() } }, B0);
    const pa = await post('/api/sync/pull', {}, A0);
    ok(pa.body.attempts.some((a) => a.id === 'a-1-' + run && a.label === 'mine'), "B's write did not change A's attempt");
  }

  // 5. A malformed row is dropped, not fatal to the batch
  {
    const r = await post('/api/sync/events', { events: [
      { key: 'good-1-' + run, t: 'not a date', seconds: -5 },
      { qid: 'no key here' },
      null,
      { key: 'good-2-' + run, difficulty: 'XXXXXXXXXX' }
    ] }, A0);
    ok(r.status === 200 && r.body.stored === 2, `mixed batch stored ${r.body?.stored} good rows (status ${r.status})`);
  }

  // 6. A practice answer keeps how many steps were shown before it
  {
    await post('/api/sync/events', { events: [
      { key: 'hint-1-' + run, attempt: 'lockin-x', qid: 'm001', correct: true, seconds: 40, hints: 2, t: new Date().toISOString() },
      { key: 'hint-2-' + run, attempt: 'lockin-x', qid: 'm002', correct: false, hints: 'lots', t: new Date().toISOString() }
    ] }, A0);
    const pa = await post('/api/sync/pull', {}, A0);
    const h1 = pa.body.events.find((e) => e.key === 'hint-1-' + run);
    const h2 = pa.body.events.find((e) => e.key === 'hint-2-' + run);
    ok(h1 && h1.hints === 2 && h2 && h2.hints === null, `hints saved (${h1 && h1.hints}) and a bad value dropped (${h2 && h2.hints})`);
  }

  // 7. Health endpoint leaks nothing sensitive
  {
    const h = await (await fetch(BASE + '/healthz')).json();
    ok(!('mailDetail' in h) && !/error/i.test(String(h.database)), 'healthz carries no sender or raw DB error');
  }

  // ---------- health ----------
  {
    const h = await (await fetch(BASE + '/healthz')).json();
    ok(h.payments === true && h.accounts === true, 'healthz reports payments and accounts');
  }

  // ---------- naming sync ----------
  const A = await signIn(mail('ann'));
  const B = await signIn(mail('ben'));
  ok(A.user && A.user.paid === false, 'a new account is unpaid');
  ok(A.user && !('role' in A.user) && !('class_code' in A.user) && !('class_status' in A.user), 'the user carries no role or class fields');
  {
    const gone = await Promise.all(['/api/class/create', '/api/class/roster', '/api/class/decide', '/api/generated']
      .map((p) => post(p, {}, A.token)));
    ok(gone.every((r) => r.status === 404), 'the class and generated-question endpoints are gone');
    const pulled = await post('/api/sync/pull', {}, A.token);
    ok(Array.isArray(pulled.body.generated) && pulled.body.generated.length === 0, 'pull returns an empty generated list');
    const renamed = await post('/api/me/update', { display_name: 'Ann', class_code: 'ANYTHING' }, A.token);
    ok(renamed.status === 200 && renamed.body.user.display_name === 'Ann' && !('class_code' in renamed.body.user),
      'the profile update renames and ignores a class code');
  }
  {
    const reps = [
      { k: 'k1-' + run, t: '2026-11-20T10:00:00Z', qid: 'rw001', strat: 'boundary-test', picked: 'boundary-test', right: true, daily: '2026-11-20' },
      { k: 'k2-' + run, t: '2026-11-20T10:01:00Z', qid: 'rw002', strat: 'subject-verb', picked: 'verb-time', right: false },
      null, { k: 'bad' }, { k: 'k3-' + run, strat: 'x', right: 'yes' },
    { k: 'k4-' + run, strat: 'not-a-move', picked: null, right: true },
    { k: 'k5-' + run, strat: 'subject-verb', picked: 'not-a-move', right: false }
    ];
    const r1 = await post('/api/sync/naming', { reps }, A.token);
    ok(r1.status === 200 && r1.body.stored === 2, `two good reps stored; malformed rows and unknown moves dropped (${JSON.stringify(r1.body)})`);
    const r2 = await post('/api/sync/naming', { reps: reps.slice(0, 2) }, A.token);
    ok(r2.body.stored === 0, 're-sending the same reps stores nothing new');
    const hijack = await post('/api/sync/naming', { reps: [{ ...reps[1], right: true, picked: 'subject-verb' }] }, B.token);
    ok(hijack.body.stored === 0, "another account cannot overwrite a rep by reusing its key");
    const pull = await post('/api/sync/pull', {}, A.token);
    const n = pull.body.naming || [];
    ok(n.length === 2, 'pull returns the naming reps');
    const d = n.find((r) => r.k === 'k1-' + run);
    ok(d && d.daily === '2026-11-20' && d.right === true, 'the daily date survives the round trip as YYYY-MM-DD');
    const bp = await post('/api/sync/pull', {}, B.token);
    ok((bp.body.naming || []).length === 0, "B does not see A's reps");
  }

  // ---------- purchases ----------
  {
    const bad = await webhook({ type: 'checkout.session.completed', data: { object: {} } }, 't=1,v1=00');
    ok(bad.status === 400, 'a webhook with a bad signature is rejected');
    const raw = JSON.stringify({ type: 'x' });
    const stale = await post('/api/billing/webhook', raw, null, { 'stripe-signature': stripeHeader(raw, Math.floor(Date.now() / 1000) - 3600) });
    ok(stale.status === 400, 'a replayed webhook an hour old is rejected');
    const wrongKey = await post('/api/billing/webhook', raw, null, { 'stripe-signature': stripeHeader(raw, undefined, 'whsec_other') });
    ok(wrongKey.status === 400, 'a webhook signed with another secret is rejected');

    // paid by account id, with a different email typed at checkout
    const evt = { id: 'evt_1', type: 'checkout.session.completed', data: { object: {
      id: 'cs_1' + run, payment_status: 'paid', payment_intent: 'pi_A' + run, client_reference_id: A.user.id,
      customer_details: { email: 'typo@example.com' }, amount_total: 1499, currency: 'usd' } } };
    const w = await webhook(evt);
    ok(w.status === 200, 'a signed checkout event is accepted');
    await webhook(evt);
    const me = await post('/api/me', {}, A.token);
    ok(me.body.user.paid === true, 'the buyer is paid, matched by account id despite a different checkout email');
    const meB = await post('/api/me', {}, B.token);
    ok(meB.body.user.paid === false, 'nobody else became paid');

    // a forged client_reference_id that is not a user falls back to email
    await webhook({ type: 'checkout.session.completed', data: { object: {
      id: 'cs_2' + run, payment_status: 'paid', payment_intent: 'pi_C' + run, client_reference_id: crypto.randomUUID(),
      customer_details: { email: mail('carl').toUpperCase() } } } });
    const C = await signIn(mail('carl'));
    ok(C.user.paid === true, 'pay first, sign in later: matched by email, case-insensitively');

    // unpaid async session does not grant access
    await webhook({ type: 'checkout.session.completed', data: { object: {
      id: 'cs_3' + run, payment_status: 'unpaid', payment_intent: 'pi_D' + run, customer_details: { email: mail('dee') } } } });
    const D = await signIn(mail('dee'));
    ok(D.user.paid === false, 'a checkout still awaiting payment does not grant access');

    // partial refund keeps access, full refund removes it
    await webhook({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_A' + run, refunded: false } } });
    ok((await post('/api/me', {}, A.token)).body.user.paid === true, 'a partial refund keeps access');
    await webhook({ type: 'charge.refunded', data: { object: { payment_intent: 'pi_A' + run, refunded: true } } });
    ok((await post('/api/me', {}, A.token)).body.user.paid === false, 'a full refund ends access');

    const unknown = await webhook({ type: 'customer.created', data: { object: {} } });
    ok(unknown.status === 200, 'an event type we do not handle is acknowledged, so Stripe does not retry it');

    const comp = await signIn(mail('comp').replace(/-.*@/, '@'));
    ok(comp.user.paid === true, 'an address on COMP_EMAILS has access without paying');
  }

  // ---------- CORS ----------
  {
    const pre = await fetch(BASE + '/api/me', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } });
    ok(!pre.headers.get('access-control-allow-origin'), 'an unlisted origin gets no CORS header');
    const good = await fetch(BASE + '/api/me', { method: 'OPTIONS', headers: { origin: 'https://allowed.example' } });
    ok(good.headers.get('access-control-allow-origin') === 'https://allowed.example', 'a listed origin is allowed');
    const same = await fetch(BASE + '/healthz');
    ok(same.status === 200, 'same-origin requests still work with no CORS header');
  }

  // ---------- the coach agent ----------
  {
    const cat = catalog();
    const moveOf = {};
    Object.keys(cat.byStrat).forEach((m) => cat.byStrat[m].forEach((q) => { moveOf[q] = m; }));
    const today = new Date().toISOString().slice(0, 10);
    const paidUser = async (name) => {
      const u = await signIn(mail(name));
      await webhook({ type: 'checkout.session.completed', data: { object: {
        id: 'cs_' + name + run, payment_status: 'paid', payment_intent: 'pi_' + name + run, client_reference_id: u.user.id,
        customer_details: { email: mail(name) } } } });
      return u;
    };

    const free = await signIn(mail('free'));
    const blocked = await post('/api/coach/prepare', { today }, free.token);
    ok(blocked.status === 402 && blocked.body.purchase === true, 'an unpaid account is sent to the purchase, not the coach');
    const blockedToday = await post('/api/coach/today', { today }, free.token);
    ok(blockedToday.status === 402, 'and cannot read a session either');
    const tutor = await post('/api/tutor', { task: 'analyze', prompt: 'hi' }, free.token);
    ok(tutor.status === 402, 'the tutor also needs the purchase once payments are on');
    ok(fake.requests.length === 0, 'and none of them reached the model');

    const P = await paidUser('paid');
    for (const task of ['chat', 'explain', 'generate']) {
      const r = await post('/api/tutor', { task, prompt: 'hi' }, P.token);
      ok(r.status === 400, `the retired tutor task "${task}" is refused`);
    }
    ok(fake.requests.length === 0, 'and never reached the model');

    // P has met two of subject-verb's questions while naming, and two
    // boundary-test questions in practice
    const sv = cat.byStrat['subject-verb'];
    const bt = cat.byStrat['boundary-test'];
    await post('/api/sync/naming', { reps: [
      { k: 'p1-' + run, t: new Date().toISOString(), qid: sv[0], strat: 'subject-verb', picked: 'verb-time', right: false },
      { k: 'p2-' + run, t: new Date().toISOString(), qid: sv[1], strat: 'subject-verb', picked: 'verb-time', right: false }
    ] }, P.token);
    await post('/api/sync/events', { events: [
      { key: 'pe1-' + run, qid: bt[0], strat: 'boundary-test', trap: 'comma-splice', correct: false, t: new Date().toISOString() },
      { key: 'pe2-' + run, qid: bt[1], strat: 'boundary-test', trap: 'comma-splice', correct: false, t: new Date().toISOString() }
    ] }, P.token);
    const seen = new Set([sv[0], sv[1], bt[0], bt[1]]);

    const t0 = await post('/api/coach/today', { today }, P.token);
    ok(t0.status === 200 && t0.body.session === null && t0.body.left === 3, 'before preparing: no session, three left today');

    const r = await post('/api/coach/prepare', { today }, P.token);
    ok(r.status === 200 && r.body.session && r.body.session.id, `the coach returns a saved session (${r.status} ${JSON.stringify(r.body).slice(0, 160)})`);
    const s = r.body.session || { qids: [], moves: [] };
    ok(Object.keys(s).sort().join(',') === 'id,line,moves,qids,questions' && Array.isArray(s.questions) && s.questions.length === 0,
      'the session is exactly { id, qids, moves, line, questions }, with no pool questions yet');
    ok(s.qids.length === 8 && new Set(s.qids).size === 8, '8 questions, no question twice');
    ok(s.moves.length === 8 && s.qids.every((q, i) => moveOf[q] === s.moves[i]), 'every question is a bank question of its move');
    ok(s.qids.every((q) => !seen.has(q)), 'no question the student has already met');
    const count = (m) => s.moves.filter((x) => x === m).length;
    ok(count('subject-verb') === 2 && count('verb-time') >= 1 && count('boundary-test') >= 1 && count('predict-first') >= 1,
      "the coach's moves are all there");
    ok(Object.values(s.moves.reduce((a, m) => ({ ...a, [m]: (a[m] || 0) + 1 }), {})).every((n) => n <= 3),
      'the fill keeps every move to three at most');
    ok(s.line === 'Today leans on subject-verb agreement and verb tense, the two you mix up most.', 'the line is the accepted one');
    ok(r.body.left === 2 && r.body.remaining === 39, 'one session used, and it cost one unit of the AI allowance');

    const reqs = fake.requests.map((x) => x.body);
    ok(reqs.length === 4, `the loop took four model calls: overview, move, rejected, accepted (${reqs.length})`);
    const first = reqs[0] || {};
    ok(first.model === 'claude-sonnet-5-5', 'the coach runs on Sonnet 5.5');
    ok(first.thinking && first.thinking.type === 'adaptive' && first.output_config && first.output_config.effort === 'medium',
      'adaptive thinking with medium effort');
    ok(Array.isArray(first.system) && first.system[0].cache_control && first.cache_control,
      'the shared system prompt is cached, and so is each turn of the loop');
    ok((first.tools || []).length === 4 && first.tools.every((t) => t.strict === true) && !first.tool_choice,
      'four strict tools, and no forced tool choice');
    ok((first.tools || []).some((t) => t.name === 'prepare_session') && !(first.tools || []).some((t) => t.name === 'submit_plan'),
      'the agent submits with prepare_session');
    ok(/MOVES/.test(first.system[0].text) && !first.system[0].text.includes(P.user.email),
      'the system prompt carries the catalog and nothing about the student, so it caches across students');
    ok(!/note/i.test(first.messages[0].content), 'there is no student note in the request');

    const second = reqs[1] || { messages: [] };
    ok(second.messages[1] && second.messages[1].content.some((b) => b.type === 'thinking' && b.signature),
      'thinking blocks are sent back unchanged with the tool call');
    const ov = JSON.parse(((second.messages[2] || {}).content || [{}])[0].content || '{}');
    ok(ov.confusions && ov.confusions.some((c) => c.wanted === 'subject-verb' && c.named_instead === 'verb-time' && c.times === 2 && c.tell_apart),
      'the overview tool hands Claude their confusion, with the tell-apart');
    ok(ov.traps_that_catch_them && ov.traps_that_catch_them.some((t) => t.trap_id === 'comma-splice' && t.times === 2),
      'and the trap that keeps catching them');
    ok(ov.unseen_questions_by_move && ov.unseen_questions_by_move['subject-verb'] === sv.length - 2 &&
      ov.unseen_questions_by_move['boundary-test'] === bt.length - 2,
      'and how many unseen questions each move has left');
    ok(ov.previous_session === null, 'and no previous session yet');
    const md = JSON.parse(((reqs[2] || { messages: [] }).messages[4] || {}).content?.[0]?.content || '{}');
    ok(md.move_id === 'subject-verb' && md.look_alikes && md.look_alikes.some((l) => l.move_id === 'verb-time'),
      'the move tool returns that move with its look-alikes');
    const rejected = ((reqs[3] || { messages: [] }).messages.at(-1) || {}).content?.[0] || {};
    ok(rejected.is_error === true && /not-a-move/.test(rejected.content) && /at most 3/.test(rejected.content),
      'a bad submission (unknown id, too many repeats) goes back to Claude as an error to fix');

    const t1 = await post('/api/coach/today', { today }, P.token);
    ok(t1.body.session && t1.body.session.id === s.id && t1.body.session.qids.join() === s.qids.join() && t1.body.left === 2,
      'today returns the saved session without calling the model');
    ok(fake.requests.length === 4, 'and really made no model call');

    const other = await post('/api/coach/today', { today }, (await signIn(mail('paid2'))).token);
    ok(other.status === 402, "another account cannot read this student's session (and is unpaid besides)");

    fake.failNext = true;
    const failed = await post('/api/coach/prepare', { today }, P.token);
    ok(failed.status === 502, 'when the model call fails the student gets a plain 502');
    const n0 = fake.requests.length;
    const again = await post('/api/coach/prepare', { today }, P.token);
    ok(again.status === 200 && again.body.remaining === 38 && again.body.left === 1,
      'the failed attempt cost nothing: neither allowance nor a session slot');
    const ov2 = JSON.parse(((fake.requests[n0 + 1] || { body: { messages: [] } }).body.messages[2] || {}).content?.[0]?.content || '{}');
    ok(ov2.previous_session && ov2.previous_session.moves.join() === s.moves.join(),
      "the next run's overview shows the previous session's moves");
    await post('/api/coach/prepare', { today }, P.token);
    const capped = await post('/api/coach/prepare', { today }, P.token);
    ok(capped.status === 429, 'the fourth session in a day is refused with 429');
    const t2 = await post('/api/coach/today', { today }, P.token);
    ok(t2.body.left === 0 && t2.body.session && t2.body.session.qids.length === 8, 'today still returns the latest session');

    // A section has its own sessions and its own daily cap
    const mt0 = await post('/api/coach/today', { today, section: 'math' }, P.token);
    ok(mt0.status === 200 && mt0.body.session === null && mt0.body.left === 3,
      'Math has its own sessions: none yet and three left, though the mixed ones are used up');
    const nm0 = fake.requests.length;
    const mr = await post('/api/coach/prepare', { today, section: 'math' }, P.token);
    const ms = mr.body.session || { qids: [], moves: [] };
    const sectionOfMove = (m) => (cat.strats[m] || {}).section;
    ok(mr.status === 200 && ms.section === 'math' && ms.qids.length === 8 && new Set(ms.qids).size === 8,
      `a Math session comes back marked as Math, 8 questions (${mr.status} ${JSON.stringify(mr.body).slice(0, 160)})`);
    ok(ms.moves.every((m) => sectionOfMove(m) === 'math') && ms.qids.every((q, i) => moveOf[q] === ms.moves[i]),
      'every move and every question in it is Math, including the fill');
    ok(['solve-check', 'translate', 'geometry-toolkit', 'data-inference'].every((m) => ms.moves.includes(m)), "the coach's Math moves are all there");
    const mreqs = fake.requests.slice(nm0).map((x) => x.body);
    ok(/SECTION: math/.test(mreqs[0]?.messages?.[0]?.content || ''), 'the request tells Claude the section');
    const mov = JSON.parse(((mreqs[1] || { messages: [] }).messages[2] || {}).content?.[0]?.content || '{}');
    ok(mov.session_section === 'Math' && mov.previous_session === null,
      "the overview names the section, and the previous session is the section's own (none yet)");
    const offSection = ((mreqs[4] || { messages: [] }).messages.at(-1) || {}).content?.[0] || {};
    ok(offSection.is_error === true && /Math only/.test(offSection.content) && /subject-verb/.test(offSection.content),
      'reading moves in a Math session go back to Claude as an error to fix');
    const mt1 = await post('/api/coach/today', { today, section: 'math' }, P.token);
    ok(mt1.body.session && mt1.body.session.id === ms.id && mt1.body.left === 2, "today returns the Math session for Math");
    const rt = await post('/api/coach/today', { today, section: 'rw' }, P.token);
    ok(rt.body.session === null && rt.body.left === 2,
      'nothing for Reading and Writing, and two left: four of the day’s six are used (three mixed, one Math)');
    const mixed = await post('/api/coach/today', { today }, P.token);
    ok(mixed.body.session && mixed.body.session.id !== ms.id && !mixed.body.session.section,
      'a request without a section still gets the mixed session');
    const junk = await post('/api/coach/today', { today, section: 'science' }, P.token);
    ok(junk.status === 200 && junk.body.left === 0 && junk.body.session && !junk.body.session.section,
      'an unknown section is treated as no section');

    // Five of six used; Reading and Math prepared at the same moment get one slot between them
    const fifth = await post('/api/coach/prepare', { today, section: 'math' }, P.token);
    ok(fifth.status === 200 && fifth.body.left === 1, `a fifth session leaves one for the day (${fifth.status} left ${fifth.body.left})`);
    const both = await Promise.all([
      post('/api/coach/prepare', { today, section: 'rw' }, P.token),
      post('/api/coach/prepare', { today, section: 'math' }, P.token)
    ]);
    ok(both.map((x) => x.status).sort().join() === '200,429',
      `two prepares at once with one slot left: one saved, one refused (${both.map((x) => x.status).join(', ')})`);
    ok(both.filter((x) => x.status === 200).every((x) => x.body.left === 0), 'the saved one reports none left, counted under the lock');
    const capRw = await post('/api/coach/today', { today, section: 'rw' }, P.token);
    const capMath = await post('/api/coach/today', { today, section: 'math' }, P.token);
    ok(capRw.body.left === 0 && capMath.body.left === 0, 'and the day stops at six sessions in all');

    // Q has met every subject-verb question: the oldest two come back
    const Q = await paidUser('qpaid');
    const base = Date.now() - 10 * 86400000;
    await post('/api/sync/naming', { reps: sv.map((q, i) => ({
      k: `q${i}-` + run, t: new Date(base + (sv.length - i) * 3600000).toISOString(), qid: q, strat: 'subject-verb', picked: 'subject-verb', right: true
    })) }, Q.token);
    const oldest = sv.slice(-2).sort().join();
    const rq = await post('/api/coach/prepare', { today }, Q.token);
    const svPicked = (rq.body.session || { qids: [], moves: [] }).qids.filter((q, i) => rq.body.session.moves[i] === 'subject-verb');
    ok(rq.status === 200 && svPicked.sort().join() === oldest, 'with nothing unseen, the least recently seen questions are used');

    // ---------- fresh questions: the shared pool ----------
    const drain = () => post('/api/test/pool-drain', {});
    await drain();
    const utc = new Date().toISOString().slice(0, 10);
    const exhaust = (u, tag) => post('/api/sync/naming', { reps: sv.map((q, i) => ({
      k: `${tag}${i}-` + run, t: new Date(base + i * 3600000).toISOString(), qid: q, strat: 'subject-verb', picked: 'subject-verb', right: true
    })) }, u.token);
    const W = await paidUser('wpaid');
    await exhaust(W, 'w');
    fake.writeMove = 'subject-verb';
    fake.writerDelay = 1500;
    const wBefore = fake.writer.length;
    const vBefore = fake.verifier.length;
    const startedAt = Date.now();
    const w1 = await post('/api/coach/prepare', { today }, W.token);
    const took = Date.now() - startedAt;
    const poolAtResponse = (await pgc.query('select count(*)::int as n from pool_questions')).rows[0].n;
    ok(w1.status === 200 && took < fake.writerDelay && poolAtResponse === 0,
      `the prepare response does not wait for the writer (${took}ms, pool ${poolAtResponse})`);
    ok(w1.body.session && Array.isArray(w1.body.session.questions) && w1.body.session.questions.length === 0,
      'a session of bank questions carries an empty questions list');
    await drain();

    const svWrites = fake.writer.slice(wBefore).filter((b) => /MOVE: subject-verb /.test(b.messages[0].content));
    ok(svWrites.length === 1, `the writer ran once for the move the student exhausted (${svWrites.length})`);
    const wr = svWrites[0] || { tools: [], system: [{}], messages: [{ content: '' }] };
    ok(wr.model === 'claude-opus-5-5' && wr.thinking?.type === 'adaptive' && wr.output_config?.effort === 'high' &&
      !wr.tool_choice && wr.tools.length === 1 && wr.tools[0].strict === true && wr.system[0].cache_control,
      'writer: Opus 5.5, adaptive thinking, high effort, one strict tool, no forced choice, cached system prompt');
    ok(/TRAPS/.test(wr.system[0].text || '') && /<example>/.test(wr.messages[0].content) && /Look-alikes/.test(wr.messages[0].content),
      'the writer gets the trap catalog, the look-alikes and real bank examples');
    ok(/all multiple choice\. Leave grid_ins empty/.test(wr.messages[0].content) && !/<grid_example>/.test(wr.messages[0].content) &&
      /at least one E, one M and one H/.test(wr.messages[0].content) && /Solve every question twice/.test(wr.system[0].text || ''),
      'a Reading and Writing move gets no grid-ins, a difficulty spread, and the solve-it-twice rule');
    const vreqs = fake.verifier.slice(vBefore);
    ok(vreqs.length === 2, `two questions reached the blind check, the malformed one never did (${vreqs.length})`);
    const v0 = vreqs[0] || { tools: [{}], messages: [{ content: '' }] };
    ok(v0.model === 'claude-sonnet-5-5' && v0.output_config?.effort === 'medium' && v0.thinking?.type === 'adaptive' &&
      v0.tools[0].name === 'submit_verdict' && v0.tools[0].strict === true && !v0.tool_choice,
      'checker: Sonnet 5.5, adaptive thinking, medium effort, strict tool');
    ok(vreqs.every((v) => {
      const txt = v.messages[0].content;
      const cands = txt.match(/^- [a-z-]+:/gm) || [];
      return cands.length === 4 && /^- subject-verb:/m.test(txt) &&
        !/agreement-by-ear|wrong-tense|nearest noun|Remove "of local|takes the singular|Cross out the phrase/.test(txt) &&
        !/<script|onerror|<img/i.test(txt);
    }), 'the check is blind: four candidate moves, and no key, traps, steps or strategy');

    const rows = (await pgc.query('select id, strat, section, payload, writer_model, verifier_model, verdict from pool_questions')).rows;
    ok(rows.length === 1 && rows[0].strat === 'subject-verb' && /^p[0-9a-f]{10}$/.test(rows[0].id) && rows[0].payload.id === rows[0].id,
      `exactly one of the three passed and was stored (${rows.length})`);
    const pq = (rows[0] || {}).payload || { choices: [], steps: [], tags: { traps: {} }, traps: {} };
    ok(/GOODQ/.test(pq.passage || ''), 'and it is the good one');
    ok(!/<script|onerror|<img|alert\(/i.test(JSON.stringify(pq)), 'sanitized: no script, img or onerror reaches the stored payload');
    ok(pq.section === 'rw' && pq.type === 'mc' && pq.domain && pq.skill && pq.difficulty === 'M' && pq.prompt && pq.choices.length === 4 &&
      pq.answer === 1 && pq.steps.length === 2 && pq.strategy && pq.hint && pq.pool === true &&
      Object.keys(pq.traps).sort().join() === '0,2,3' && pq.tags.strat === 'subject-verb' &&
      Object.keys(pq.tags.traps).sort().join() === '0,2,3' && pq.tags.traps['3'] === 'wrong-tense',
      'the payload has the bank fields and tags');
    ok(rows[0] && rows[0].writer_model === 'claude-opus-5-5' && rows[0].verifier_model === 'claude-sonnet-5-5' &&
      rows[0].verdict.confidence === 'high' && rows[0].verdict.candidates.length === 4,
      'the models and the verdict are recorded with it');
    ok(/\[pool\] subject-verb rejected #\d: verifier answered C, the key is B/.test(log) &&
      /\[pool\] subject-verb rejected #\d: structure: uses an em dash/.test(log) &&
      /\[pool\] subject-verb accepted p[0-9a-f]{10}/.test(log),
      'what was accepted and rejected is logged, with the reasons');
    const usage = (await pgc.query('select attempts, accepted, rejected from pool_usage where day = $1', [utc])).rows[0] || {};
    ok(usage.accepted === 1 && usage.rejected >= 2 && usage.attempts >= 3, `the day's writing is counted in the database (${JSON.stringify(usage)})`);

    // the pool question is served once the bank runs out
    fake.writeMove = null;
    fake.writerDelay = 0;
    const nW = fake.requests.length;
    const w2 = await post('/api/coach/prepare', { today }, W.token);
    const s2 = w2.body.session || { qids: [], moves: [], questions: [] };
    const ovW = JSON.parse(((fake.requests[nW + 1] || { body: { messages: [] } }).body.messages[2] || {}).content?.[0]?.content || '{}');
    ok(ovW.unseen_questions_by_move && ovW.unseen_questions_by_move['subject-verb'] === 1, 'the overview counts unseen pool questions');
    ok(w2.status === 200 && s2.qids.includes(pq.id) && s2.moves[s2.qids.indexOf(pq.id)] === 'subject-verb',
      'with the bank exhausted, the next session serves the pool question');
    ok(Object.keys(s2).sort().join(',') === 'id,line,moves,qids,questions' && s2.questions.length === 1 &&
      s2.questions[0].id === pq.id && s2.questions[0].prompt === pq.prompt && s2.questions[0].tags.strat === 'subject-verb' &&
      s2.questions[0].choices.join() === pq.choices.join(),
      'and its full payload rides along in session.questions');
    const tW = await post('/api/coach/today', { today }, W.token);
    ok(tW.body.session && tW.body.session.id === s2.id && (tW.body.session.questions || []).map((q) => q.id).join() === pq.id,
      'today returns the same questions');
    await drain();

    // ---------- grid-ins: a math move that suits them gets one per batch ----------
    {
      const tq = cat.byStrat['translate'];
      const exhaustT = (u, tag) => post('/api/sync/naming', { reps: tq.map((q, i) => ({
        k: `${tag}${i}-` + run, t: new Date(base + i * 3600000).toISOString(), qid: q, strat: 'translate', picked: 'translate', right: true
      })) }, u.token);
      fake.writeMove = 'translate';

      // 1. a bad grid-in (a mixed number as the key) is rejected and kept for review
      fake.gridRun = 'bad';
      const G1 = await paidUser('grid1');
      await exhaustT(G1, 'g1');
      const nw1 = fake.writer.length;
      const nv1 = fake.verifier.length;
      const ng1 = fake.gridVerifier.length;
      const g1 = await post('/api/coach/prepare', { today, section: 'math' }, G1.token);
      await drain();
      const tw = fake.writer.slice(nw1).find((b) => /MOVE: translate /.test(b.messages[0].content)) || { messages: [{ content: '' }], tools: [{ input_schema: { properties: {} } }] };
      const msg = tw.messages[0].content;
      ok(g1.status === 200 && /Write 2 multiple choice questions and 1 grid-in for this move\./.test(msg) && /<grid_example>\{/.test(msg) && /- As a grid-in: /.test(msg),
        'a math move with an empty pool asks for 2 multiple choice and 1 grid-in, with a bank grid-in as the example');
      ok(tw.tools.length === 1 && tw.tools[0].strict === true && tw.tools[0].input_schema.properties.grid_ins &&
        tw.tools[0].input_schema.required.includes('grid_ins'), 'still one strict tool, now with grid_ins');
      ok(fake.verifier.length - nv1 === 2, `only the 2 multiple choice asked for were checked, the third was dropped (${fake.verifier.length - nv1})`);
      ok(fake.gridVerifier.length === ng1, 'the bad grid-in never reached the checker');
      const rej = (await pgc.query(`select kind, payload, reasons from pool_rejects where strat = 'translate' and kind = 'spr'`)).rows;
      ok(rej.length === 1 && /not an integer, a fraction or a decimal/.test(JSON.stringify(rej[0].reasons)) && /BADG/.test(rej[0].payload.prompt),
        'the rejected grid-in is kept in pool_rejects with its reason and its text');
      ok(/\[pool\] translate rejected #3 \(grid-in\): structure: the first answer "1 1\/2"/.test(log), 'and logged as a grid-in');
      const afterBad = (await pgc.query(`select payload->>'type' as t from pool_questions where strat = 'translate'`)).rows;
      ok(afterBad.length === 2 && afterBad.every((r) => r.t === 'mc'), `two multiple choice kept, no grid-in (${afterBad.map((r) => r.t)})`);

      // 2. the pool still has no grid-in, so the next batch asks again, and a good one is kept
      fake.gridRun = 'good';
      const G2 = await paidUser('grid2');
      await exhaustT(G2, 'g2');
      const ng2 = fake.gridVerifier.length;
      await post('/api/coach/prepare', { today, section: 'math' }, G2.token);
      await drain();
      const gv = fake.gridVerifier.slice(ng2);
      ok(gv.length === 1, `one grid-in was checked, the extra one was dropped (${gv.length})`);
      const gvt = (gv[0] || { messages: [{ content: '' }], tools: [{}], system: [{}] });
      ok(gvt.tools[0].name === 'submit_grid_verdict' && gvt.tools[0].strict === true && /answer_value/.test(gvt.system[0].text || ''),
        'grid-ins go to the grid-in checker');
      ok(/\[The student types a number/.test(gvt.messages[0].content) && /GOODG/.test(gvt.messages[0].content) &&
        !/7\/2|7\.5|forgot the fee|Without the fee|Take the fee away/.test(gvt.messages[0].content),
        'the grid-in check is blind: no key, wrong answers, steps, hint or second method');
      const spr = (await pgc.query(`select payload, verdict from pool_questions where strat = 'translate' and payload->>'type' = 'spr'`)).rows;
      const sp = (spr[0] || {}).payload || {};
      ok(spr.length === 1 && /GOODG/.test(sp.prompt) && sp.answers.join() === '7/2,3.5' && !sp.choices &&
        sp.wrong_answers.length === 1 && sp.wrong_answers[0].value === '7.5' && sp.wrong_answers[0].trap === 'one-step-short' &&
        Object.keys(sp.traps).length === 0 && sp.tags.strat === 'translate' && sp.tags.traps.w0 === 'one-step-short',
        'the good grid-in is stored as type spr with its answers and likely wrong answers');
      ok(spr[0] && spr[0].verdict.answer_value === '3.5' && /10\.50/.test(spr[0].verdict.second_method) && !JSON.stringify(sp).includes('Without the fee'),
        'the checker typed 3.5 for a 7/2 key and it counted; the second method is kept with the verdict, not the question');
      const u2 = (await pgc.query('select grid_asked, grid_kept from pool_usage where day = $1', [utc])).rows[0] || {};
      ok(u2.grid_asked === 2 && u2.grid_kept === 1, `grid-ins asked and kept are counted (${JSON.stringify(u2)})`);
      // (The 25% cut-off itself is unit-tested in scripts/writer-test.mjs.)
      fake.gridRun = null;
      fake.writeMove = null;
    }

    // POOL_DAILY_LIMIT: once today's count is spent, nothing more is written
    await pgc.query(`insert into pool_usage (day, attempts) values ($1, $2)
                     on conflict (day) do update set attempts = excluded.attempts`, [utc, POOL_LIMIT]);
    fake.writeMove = 'subject-verb';
    const X = await paidUser('xpaid');
    await exhaust(X, 'x');
    const wBeforeX = fake.writer.length;
    const rx = await post('/api/coach/prepare', { today }, X.token);
    await drain();
    ok(rx.status === 200 && fake.writer.length === wBeforeX, 'at POOL_DAILY_LIMIT the writer is not called');
    ok(new RegExp(`subject-verb skipped: today's POOL_DAILY_LIMIT of ${POOL_LIMIT} is used`).test(log), 'and the skip is logged');
    ok((await pgc.query(`select count(*)::int as n from pool_questions where strat = 'subject-verb'`)).rows[0].n === 1, 'and the pool did not grow');
    fake.writeMove = null;

    // ---------- Bluebook misses steer the coach ----------
    const Y = await paidUser('ypaid');
    await post('/api/sync/events', { events: [0, 1, 2].map((i) => ({
      key: `bb${i}-` + run, attempt: 'log-x' + run, t: new Date(Date.now() - i * 86400000).toISOString(), qid: null,
      section: 'rw', strat: 'pronoun-check', trap: 'agreement-by-ear', correct: false
    })) }, Y.token);
    fake.detailMove = 'pronoun-check';
    fake.trapDetail = 'agreement-by-ear';
    const nY = fake.requests.length;
    const ry = await post('/api/coach/prepare', { today }, Y.token);
    fake.detailMove = 'subject-verb';
    fake.trapDetail = null;
    const yreqs = fake.requests.slice(nY).map((x) => x.body);
    ok(/strongest signal/.test(yreqs[0]?.system?.[0]?.text || '') && /Bluebook/.test(yreqs[0]?.system?.[0]?.text || ''),
      'the system prompt tells the coach Bluebook misses are the strongest signal');
    const ovY = JSON.parse((yreqs[1]?.messages?.[2]?.content?.[0]?.content) || '{}');
    const bb = ovY.bluebook_misses || { by_move: [], by_trap: [] };
    ok(bb.last_30_days === 3 && bb.all_time === 3 && bb.most_recent &&
      bb.by_move.some((m) => m.move_id === 'pronoun-check' && m.times === 3) &&
      bb.by_trap.some((t) => t.trap_id === 'agreement-by-ear' && t.times === 3),
      'the overview Claude receives carries the Bluebook misses by move and by trap');
    const detY = yreqs[2]?.messages?.[4]?.content || [];
    const mdY = JSON.parse(detY[0]?.content || '{}');
    const tdY = JSON.parse(detY[1]?.content || '{}');
    ok(mdY.move_id === 'pronoun-check' && mdY.bluebook_misses && mdY.bluebook_misses.all_time === 3 && mdY.bluebook_misses.last_30_days === 3,
      'move detail carries its Bluebook count');
    ok(tdY.trap_id === 'agreement-by-ear' && tdY.on_bluebook && tdY.on_bluebook.all_time === 3, 'and so does trap detail');
    const ys = ry.body.session || { moves: [] };
    ok(ry.status === 200 && !FAKE_MOVES.includes('pronoun-check') && ys.moves.includes('pronoun-check'),
      'the server fill reaches for the move missed on Bluebook first');

    // ---------- student feedback ----------
    {
      const fb = (u, body) => post('/api/feedback', body, u.token);
      const t = (s = 0) => new Date(Date.now() + s * 1000).toISOString();
      const fillers = cat.bank.slice(0, 25).map((q) => q.id);
      /* A student who has answered `count` different questions, plus each of
         `also`, which the coach served them (served: false skips that). */
      const answer = (u, name, qids, from = 0) => post('/api/sync/events', { events: qids.map((q, i) => ({
        key: `fb-${name}-${from + i}-` + run, attempt: 'lockin-fb' + name, t: t(-100 + from + i), qid: q, correct: true
      })) }, u.token);
      const serve = (u, qids) => pgc.query(
        `insert into coach_plans (user_id, day, plan) values ($1, current_date, $2)`, [u.user.id, JSON.stringify({ qids, moves: [], line: '' })]);
      const voter = async (name, count = 20, also = [], served = true) => {
        const u = await signIn(mail(name));
        await answer(u, name, [...fillers.slice(0, count), ...also]);
        if (served && also.length) await serve(u, also);
        return u;
      };
      const pid = pq.id;
      const row = async (u, qid) => (await pgc.query('select rating, reason from question_feedback where user_id = $1 and qid = $2', [u.user.id, qid])).rows[0];
      const retired = async (qid) => !!(await pgc.query('select retired_at from pool_questions where id = $1', [qid])).rows[0]?.retired_at;

      // saving
      const F1 = await voter('fb1', 20);
      let r = await fb(F1, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t() }] });
      ok(r.status === 200 && r.body.questions[pid] === 'retry' && !(await row(F1, pid)),
        'a vote on a question the student has not answered (as far as the server knows) is held for retry, not saved');
      await post('/api/sync/events', { events: [{ key: 'fb-fb1-target-' + run, attempt: 'lockin-fbx', t: t(), qid: pid, correct: false }] }, F1.token);
      await serve(F1, [pid]);
      r = await fb(F1, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(1) }, { qid: 'nope', rating: 1, t: t() }, { qid: fillers[0], rating: 2, t: t() }] });
      ok(r.body.questions[pid] === 'saved' && r.body.questions.nope === 'dropped' && r.body.questions[fillers[0]] === 'dropped',
        'once answered it saves; an unknown question or a bad rating is dropped');
      r = await fb(F1, { questions: [{ qid: pid, rating: 1, t: t(-50) }] });
      const kept = await row(F1, pid);
      ok(r.body.questions[pid] === 'saved' && kept.rating === -1 && kept.reason === 'wrong', 'an older resend never undoes a newer tap');
      await fb(F1, { questions: [{ qid: fillers[1], rating: 1, reason: 'wrong', t: t(2) }] });
      ok((await row(F1, fillers[1])).reason === null, 'a reason is kept only on a thumbs down');
      await fb(F1, { questions: [{ qid: fillers[1], rating: 0, t: t(3) }] });
      ok((await row(F1, fillers[1])).rating === 0, 'tapping again clears the vote');
      ok((await post('/api/feedback', { questions: [] })).status === 401, 'feedback needs a signed-in student');
      const nb = await post('/api/feedback', 'null', F1.token);
      ok(nb.status === 200 && Object.keys(nb.body.questions).length === 0, 'an empty or null body is an empty request, not an error');
      const both = await Promise.all([
        fb(F1, { questions: [{ qid: fillers[3], rating: 1, t: t(10) }] }),
        fb(F1, { questions: [{ qid: fillers[4], rating: -1, t: t(10) }] })
      ]);
      ok(both.every((x) => x.status === 200) && (await row(F1, fillers[3])).rating === 1 && (await row(F1, fillers[4])).rating === -1,
        'two saves from the same student at once both go through, one after the other');

      // a device clock running an hour fast cannot lock a vote against a later tap
      await fb(F1, { questions: [{ qid: fillers[2], rating: 1, t: t(3600) }] });
      await new Promise((res) => setTimeout(res, 1100));
      await fb(F1, { questions: [{ qid: fillers[2], rating: -1, t: t() }] });
      ok((await row(F1, fillers[2])).rating === -1, 'a vote stamped in the future is capped at now, so a later tap still wins');

      // retiring: "answer looks wrong" from 3 qualified students
      const unserved = await voter('fbunserved', 20, [pid], false);
      await fb(unserved, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(4) }] });
      const lightweight = await voter('fblight', 5, [pid]);
      await fb(lightweight, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(4) }] });
      const F2 = await voter('fb2', 20, [pid]);
      await fb(F2, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(4) }] });
      ok(!(await retired(pid)), 'two qualified reports, one from a student with only a handful of answers and one from a student never served it: not retired');
      const F3 = await voter('fb3', 20, [pid]);
      await fb(F3, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(4) }] });
      ok(await retired(pid), 'the third qualified "answer looks wrong" retires the pool question');
      ok(((await post('/api/sync/pull', {}, F1.token)).body.retired_pool || []).includes(pid),
        'the next sync tells every device it is retired, so the app stops picking it');
      ok(/\[feedback\] retired p[0-9a-f]{10}: 3 said the answer looks wrong/.test(log), 'and the retirement is logged');

      // a retired question is never served anew, but a prepared session still loads
      const tW2 = await post('/api/coach/today', { today }, W.token);
      ok((tW2.body.session?.questions || []).some((q) => q.id === pid), 'a session prepared before the retirement still carries its payload');
      const Z = await paidUser('zpaid');
      await exhaust(Z, 'z');
      const rz = await post('/api/coach/prepare', { today }, Z.token);
      await drain();
      ok(rz.status === 200 && !rz.body.session.qids.includes(pid), 'a new session never gets the retired question');

      // votes cast before their students qualified count once they do
      const lateQ = (await pgc.query(`select id from pool_questions where strat = 'translate' and retired_at is null order by id desc limit 1`)).rows[0].id;
      const late = [];
      for (let i = 0; i < 3; i++) {
        const u = await voter('fblate' + i, 10, [lateQ]);
        await fb(u, { questions: [{ qid: lateQ, rating: -1, reason: 'wrong', t: t(6) }] });
        late.push(u);
      }
      ok(!(await retired(lateQ)), 'three reports from students with only 10 answers each: not yet');
      for (let i = 0; i < 3; i++) await answer(late[i], 'fblate' + i, fillers.slice(10, 20), 10);
      const sw = await post('/api/test/feedback-sweep', {});
      ok(sw.status === 200 && (await retired(lateQ)), 'once they reach 20 answers, the sweep retires it with no new vote');

      // the net rule: plain thumbs down count, "too easy" never does
      const tqs = (await pgc.query(`select id from pool_questions where strat = 'translate' and retired_at is null order by id`)).rows.map((x) => x.id);
      const [easyQ, netQ] = tqs.filter((q) => q !== lateQ);
      for (let i = 0; i < 5; i++) {
        const u = await voter('fbe' + i, 20, [easyQ]);
        await fb(u, { questions: [{ qid: easyQ, rating: -1, reason: 'easy', t: t(5) }] });
      }
      ok(!(await retired(easyQ)), 'five "too easy" votes never retire a question');
      for (let i = 0; i < 3; i++) {
        const u = await voter('fbc' + i, 20, [easyQ]);
        await fb(u, { questions: [{ qid: easyQ, rating: -1, reason: 'confusing', t: t(5) }] });
      }
      ok(!(await retired(easyQ)), 'three "confusing" plus five "too easy": net -3 from only 3 ratings that count, so not retired');
      const votes = [-1, -1, -1, -1, 1];
      for (let i = 0; i < votes.length; i++) {
        const u = await voter('fbn' + i, 20, [netQ]);
        await fb(u, { questions: [{ qid: netQ, rating: votes[i], t: t(5) }] });
        if (i === 3) ok(!(await retired(netQ)), 'four thumbs down alone are under the five-rating minimum');
      }
      ok(await retired(netQ), 'the fifth rating makes five that net -3 (four down, one up): retired');
      // "answer looks wrong" counts -1 in the net as well
      const wrongNet = tqs.filter((q) => q !== lateQ)[2];
      const wv = [['wrong'], ['wrong'], ['confusing'], ['confusing'], [null, 1]];
      for (let i = 0; i < wv.length; i++) {
        const u = await voter('fbw' + i, 20, [wrongNet]);
        await fb(u, { questions: [{ qid: wrongNet, rating: wv[i][1] || -1, reason: wv[i][0], t: t(5) }] });
      }
      ok(await retired(wrongNet), 'two "wrong", two "confusing" and one thumbs up net -3: retired');

      // move votes: only for a session the student played
      const M = await voter('fbm', 20);
      const played = ['s1', 's2', ...Array.from({ length: 12 }, (_, i) => 'm' + i)];
      r = await fb(M, { moves: [{ session: 'ghost', strat: 'translate', t: t() }] });
      ok(r.body.moves.ghost === 'retry' && !(await pgc.query('select 1 from move_feedback where user_id = $1', [M.user.id])).rowCount,
        'a move vote for a session with no answers behind it is not saved');
      await post('/api/sync/events', { events: [...played.map((sid, i) => ({
        key: `fbm-play-${sid}-` + run, attempt: 'lockin-' + sid, t: t(-10 + i), qid: fillers[i % fillers.length], strat: 'translate', correct: true
      })), { key: 'fbm-play-s1b-' + run, attempt: 'lockin-s1', t: t(-1), qid: fillers[20], strat: 'solve-check', correct: true }] }, M.token);
      r = await fb(M, { moves: [{ session: 's1', strat: 'geometry-toolkit', t: t() }] });
      ok(r.body.moves.s1 === 'retry' && !(await pgc.query('select 1 from move_feedback where user_id = $1', [M.user.id])).rowCount,
        'a move vote for a move not (yet) in the session is held for retry and not saved');
      r = await fb(M, { moves: [{ session: 's1', strat: 'translate', t: t() }, { session: 's2', strat: 'made-up', t: t() }] });
      ok(r.body.moves.s1 === 'saved' && r.body.moves.s2 === 'dropped', 'a move vote saves; an unknown move is dropped');
      await fb(M, { moves: [{ session: 's1', strat: 'solve-check', t: t(1) }] });
      ok((await pgc.query('select strat from move_feedback where user_id = $1', [M.user.id])).rows.map((x) => x.strat).join() === 'solve-check',
        'one vote per session; a newer tap changes it');
      const many = await fb(M, { moves: Array.from({ length: 12 }, (_, i) => ({ session: 'm' + i, strat: 'translate', t: t(2) })) });
      ok(Object.values(many.body.moves).filter((x) => x === 'retry').length === 3, 'at most 10 move votes a day');
      await fb(M, { moves: [{ session: 's1', strat: '', t: t(3) }] });
      ok(!(await pgc.query('select 1 from move_feedback where user_id = $1 and session_id = $2', [M.user.id, 's1'])).rowCount, 'an empty move clears the vote');

      // the admin page: ADMIN_EMAILS only, totals only
      ok((await post('/api/admin/feedback', {}, W.token)).status === 403, 'a paid student who is not an admin is refused');
      ok((await post('/api/admin/feedback', {}, (await signIn('comp@example.com')).token)).status === 403, 'a comped account is not an admin either');
      const A = await signIn('admin-it@example.com');
      const rep = await post('/api/admin/feedback', {}, A.token);
      const rq = (rep.body.questions || []).find((q) => q.qid === pid);
      ok(/^\d{4}-\d{2}-\d{2}$/.test((rep.body.writer[0] || {}).day) && rep.body.writer[0].day === utc, 'writer days are plain dates, not shifted by time zone');
      ok(rep.status === 200 && rq && rq.source === 'pool' && rq.retired === true && rq.wrong >= 3 && rq.move === 'subject-verb',
        'the admin report lists the rated question with its counts and its retirement');
      ok((rep.body.retired || []).some((q) => q.qid === pid) && rep.body.writer.length >= 1 && rep.body.rejects.length >= 1 &&
        rep.body.moves.some((m) => m.move === 'translate' && m.helped >= 1), 'and the retired list, the writer numbers, the rejection reasons and the move votes');
      const flat = JSON.stringify(rep.body);
      ok(!/@/.test(flat) && !flat.includes(F1.user.id) && !flat.includes(M.user.id), 'it never includes an email or a user id');

      // restore: old votes stop counting
      ok((await post('/api/admin/restore', { qid: pid }, W.token)).status === 403, 'only an admin can restore');
      const rs = await post('/api/admin/restore', { qid: pid }, A.token);
      ok(rs.status === 200 && !(await retired(pid)), 'restore brings the question back');
      const rep2 = await post('/api/admin/feedback', {}, A.token);
      ok(!(rep2.body.questions || []).some((q) => q.qid === pid), 'and its old votes no longer show on the admin page');
      await fb(F2, { questions: [{ qid: pid, rating: -1, reason: 'wrong', t: t(30) }] });
      ok(!(await retired(pid)), 'one new report after a restore does not retire it again: the old reports no longer count');
      ok((await post('/api/admin/restore', { qid: pid }, A.token)).status === 404, 'restoring a question that is not retired is a 404');
    }

    const h = await (await fetch(BASE + '/healthz')).json();
    ok(h.coach === true, 'healthz reports the coach');
  }

} catch (e) {
  failures++;
  console.error('  FAIL the test itself crashed:', e);
} finally {
  server.kill();
  fakeApi.close();
  await pgc.end().catch(() => {});
}
if (failures) console.error('\nserver log:\n' + log);
console.log(failures ? `\n${failures} FAILED` : '\nall integration checks passed');
process.exit(failures ? 1 : 0);
