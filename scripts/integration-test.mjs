/* ============================================================
   Server integration test: npm run itest

   Starts server.js against a scratch Postgres, drives the API the way the
   app does, and checks the things that matter for real students:
   sign-in limits and races, one account never touching another's rows,
   naming-record sync, purchases from signed Stripe webhooks, class
   approval, and CORS.

   It creates accounts (all @example.com, unique per run), so point it at
   a throwaway database, never production. It reads TEST_DATABASE_URL,
   not DATABASE_URL, so it cannot pick up the real one by accident:

     TEST_DATABASE_URL=postgresql://test@localhost:5432/lockin_test npm run itest
   ============================================================ */
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = process.env.TEST_DATABASE_URL;
if (!DB) {
  console.error('Set TEST_DATABASE_URL to a scratch Postgres database. See the top of this file.');
  process.exit(2);
}
const PORT = String(18000 + Math.floor(Math.random() * 1000));
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = 'whsec_itest_' + crypto.randomBytes(8).toString('hex');

const server = spawn(process.execPath, ['server.js'], {
  cwd: ROOT,
  env: {
    ...process.env, DATABASE_URL: DB, PORT,
    ALLOW_CODE_IN_RESPONSE: 'true', LOG_SIGNIN_CODES: 'true',
    STRIPE_WEBHOOK_SECRET: SECRET, COMP_EMAILS: 'comp@example.com',
    ALLOWED_ORIGINS: 'https://allowed.example', ANTHROPIC_API_KEY: ''
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
  console.error('The server could not reach TEST_DATABASE_URL:\n' + log);
  process.exit(2);
}

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

  // 6. Generated questions stay inside a class
  {
    const evil = { id: 'gen-evil-' + run, section: 'math', strat: 'translate', prompt: '<img src=x onerror=alert(1)>' };
    await post('/api/generated', { questions: [evil] }, B0);
    let pa = await post('/api/sync/pull', {}, A0);
    ok(!pa.body.generated.some((q) => q.id === 'gen-evil-' + run), 'a stranger\'s generated question is not served');
    const pb = await post('/api/sync/pull', {}, B0);
    ok(pb.body.generated.some((q) => q.id === 'gen-evil-' + run), 'the author still gets their own');
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
  ok(A.user && A.user.paid === false && A.user.class_status === 'approved', 'a new account is unpaid, with no pending class');
  {
    const reps = [
      { k: 'k1-' + run, t: '2026-11-20T10:00:00Z', qid: 'rw001', strat: 'boundary-test', picked: 'boundary-test', right: true, daily: '2026-11-20' },
      { k: 'k2-' + run, t: '2026-11-20T10:01:00Z', qid: 'rw002', strat: 'subject-verb', picked: 'verb-tense', right: false },
      null, { k: 'bad' }, { k: 'k3-' + run, strat: 'x', right: 'yes' }
    ];
    const r1 = await post('/api/sync/naming', { reps }, A.token);
    ok(r1.status === 200 && r1.body.stored === 2, `two good reps stored, bad rows dropped (${JSON.stringify(r1.body)})`);
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

  // ---------- class approval ----------
  {
    const T = await signIn(mail('teach'));
    const code = ('C' + run).toUpperCase().slice(0, 12);
    const mk = await post('/api/class/create', { name: 'Test class', code }, T.token);
    ok(mk.status === 200 && mk.body.user.class_status === 'approved', 'the teacher is approved in their own class');

    const S = await signIn(mail('stu'));
    const join = await post('/api/me/update', { class_code: code }, S.token);
    ok(join.body.user.class_status === 'pending', 'a student who joins is pending');

    // T's generated question; S must not see it while pending
    await post('/api/generated', { questions: [{ id: 'gen-' + run, section: 'rw', strat: 'boundary-test' }] }, T.token);
    let sp = await post('/api/sync/pull', {}, S.token);
    ok(!(sp.body.generated || []).some((q) => q.id === 'gen-' + run), 'a pending student does not get the class bank');

    // S's own generated question must not reach T while pending
    await post('/api/generated', { questions: [{ id: 'evil-' + run, section: 'rw' }] }, S.token);
    let tp = await post('/api/sync/pull', {}, T.token);
    ok(!(tp.body.generated || []).some((q) => q.id === 'evil-' + run), 'a pending student cannot plant questions in the class bank');

    let r = await post('/api/class/roster', {}, T.token);
    ok(r.body.pending.length === 1 && r.body.roster.length === 0, 'the student shows as pending, not on the roster');

    const stranger = await signIn(mail('other-teacher'));
    await post('/api/class/create', { name: 'Other', code: code + 'X' }, stranger.token);
    const steal = await post('/api/class/decide', { student_id: S.user.id, approve: true }, stranger.token);
    ok(steal.status === 404, "another teacher cannot approve someone into a class they do not own");

    const appr = await post('/api/class/decide', { student_id: S.user.id, approve: true }, T.token);
    ok(appr.status === 200, 'the teacher approves');
    sp = await post('/api/sync/pull', {}, S.token);
    ok((sp.body.generated || []).some((q) => q.id === 'gen-' + run), 'once approved the student gets the class bank');

    await post('/api/sync/naming', { reps: [
      { k: 'c1-' + run, t: new Date().toISOString(), qid: 'rw9', strat: 'subject-verb', picked: 'verb-tense', right: false },
      { k: 'c2-' + run, t: new Date().toISOString(), qid: 'rw8', strat: 'subject-verb', picked: 'subject-verb', right: true }
    ] }, S.token);
    r = await post('/api/class/roster', {}, T.token);
    const row = r.body.roster.find((x) => x.student_id === S.user.id);
    ok(row && row.named === 2 && row.named_right === 1, 'the roster shows the naming record');
    ok(r.body.confusions.some((c) => c.strat === 'subject-verb' && c.picked === 'verb-tense'), 'the class confusions list the pair');

    const again = await post('/api/me/update', { class_code: code }, S.token);
    ok(again.body.user.class_status === 'approved', 're-entering the same code keeps approval');
    const name = await post('/api/me/update', { display_name: 'Sam' }, S.token);
    ok(name.body.user.class_status === 'approved' && name.body.user.class_code === code, 'renaming leaves class membership alone');

    const rm = await post('/api/class/decide', { student_id: S.user.id, approve: false }, T.token);
    const after = await post('/api/me', {}, S.token);
    ok(rm.status === 200 && after.body.user.class_code === null, 'the teacher can remove a student');
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

} catch (e) {
  failures++;
  console.error('  FAIL the test itself crashed:', e);
} finally {
  server.kill();
}
if (failures) console.error('\nserver log:\n' + log);
console.log(failures ? `\n${failures} FAILED` : '\nall integration checks passed');
process.exit(failures ? 1 : 0);
