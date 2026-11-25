/* ============================================================
   Checks that the server signs in to Anthropic with workload identity
   federation (OIDC), the way it runs on Render, and never with a stored key.

   No database and no real Anthropic: a fake API on a local port plays the
   token endpoint and the Messages API, and a temp file plays the token
   Render mounts for the service. Run with:  npm run oidctest
   ============================================================ */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const ok = (c, m) => { console.log((c ? '  ok   ' : '  FAIL ') + m); if (!c) failures++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- a fake Anthropic: token exchange, models, messages ---------- */
const seen = { exchanges: [], messages: [], models: [] };
let minted = 0;
const api = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const reply = (s, o) => { res.writeHead(s, { 'content-type': 'application/json' }); res.end(JSON.stringify(o)); };
    const body = raw ? JSON.parse(raw) : {};
    if (req.method === 'POST' && req.url.startsWith('/v1/oauth/token')) {
      seen.exchanges.push({ body, headers: req.headers });
      if (body.assertion === 'bad.jwt.token') return reply(401, { type: 'error', error: { type: 'authentication_error', message: 'Authentication failed' } });
      minted++;
      /* A short lifetime, so the SDK exchanges again on every call and the
         test can watch it pick up a rotated token file. */
      return reply(200, { access_token: 'sk-ant-oat01-minted-' + minted, token_type: 'Bearer', expires_in: 100, scope: 'workspace:developer' });
    }
    if (req.method === 'GET' && req.url.startsWith('/v1/models')) {
      seen.models.push({ headers: req.headers });
      return reply(200, { data: [{ id: 'claude-sonnet-5-5', type: 'model', display_name: 'Sonnet', created_at: '2026-01-01T00:00:00Z' }], has_more: false, first_id: null, last_id: null });
    }
    if (req.method === 'POST' && req.url.startsWith('/v1/messages')) {
      seen.messages.push({ body, headers: req.headers });
      return reply(200, {
        id: 'msg_1', type: 'message', role: 'assistant', model: body.model, stop_reason: 'end_turn', stop_sequence: null,
        content: [{ type: 'text', text: '{"ok": false, "reason": "test"}' }],
        usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
      });
    }
    reply(404, { type: 'error', error: { type: 'not_found_error', message: req.url } });
  });
});
await new Promise((r) => api.listen(0, '127.0.0.1', r));
const API = `http://127.0.0.1:${api.address().port}`;

/* ---------- the "Render" token file ---------- */
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lockin-oidc-'));
const tokenFile = path.join(dir, 'token');
fs.writeFileSync(tokenFile, 'header.first-jwt.sig');

async function boot(env) {
  const port = 20000 + Math.floor(Math.random() * 20000);
  const base = { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, PORT: String(port), ANTHROPIC_BASE_URL: API, ALLOW_ANON_TUTOR: 'true' };
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...base, ...env } });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/healthz`); if (r.ok) break; } catch {}
    await wait(100);
  }
  return { url: `http://127.0.0.1:${port}`, child, log: () => log };
}
const ask = (s) => fetch(s.url + '/api/tutor', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ task: 'analyze', prompt: 'A pasted question long enough to classify.', context: 'catalog', model: 'claude-sonnet-5-5' })
});
const FED = {
  ANTHROPIC_FEDERATION_RULE_ID: 'fdrl_test',
  ANTHROPIC_ORGANIZATION_ID: '00000000-0000-0000-0000-000000000000',
  ANTHROPIC_SERVICE_ACCOUNT_ID: 'svac_test',
  ANTHROPIC_WORKSPACE_ID: 'wrkspc_test',
  ANTHROPIC_IDENTITY_TOKEN_FILE: tokenFile
};

try {
  /* 1. Federation, with a stray API key left in the environment. */
  const s = await boot({ ...FED, ANTHROPIC_API_KEY: 'sk-ant-api03-should-never-be-used' });
  const h = await (await fetch(s.url + '/healthz')).json();
  ok(h.tutor === true && h.aiAuth === 'oidc', 'healthz reports the AI on, signed in by OIDC');
  await wait(800);
  ok(/ai check:\s+ok \(oidc\)/.test(s.log()), 'the startup check exchanges the token and reaches the API');
  ok(/ANTHROPIC_API_KEY is set but ignored/.test(s.log()), 'a leftover API key is reported and ignored');

  const r = await ask(s);
  ok(r.status === 200, 'a pasted-question call succeeds (' + r.status + ')');
  const ex = seen.exchanges[0] || { body: {}, headers: {} };
  ok(ex.body.grant_type === 'urn:ietf:params:oauth:grant-type:jwt-bearer' && ex.body.assertion === 'header.first-jwt.sig',
    'the exchange sends the host token as a JWT bearer assertion');
  ok(ex.body.federation_rule_id === 'fdrl_test' && ex.body.organization_id === FED.ANTHROPIC_ORGANIZATION_ID,
    'with the federation rule and organization');
  const m = seen.messages[seen.messages.length - 1] || { headers: {} };
  ok(/^Bearer sk-ant-oat01-minted-/.test(m.headers.authorization || ''), 'the model call carries the short-lived minted token');
  ok(!m.headers['x-api-key'] && !/api03/.test(JSON.stringify(seen.messages.map((x) => x.headers))), 'and the stored API key is never sent');

  /* 2. The host rotates the token file; the next exchange uses the new one. */
  fs.writeFileSync(tokenFile, 'header.rotated-jwt.sig');
  /* Near expiry the SDK refreshes in the background, so give it a moment. */
  for (let i = 0; i < 10 && !seen.exchanges.some((e) => e.body.assertion === 'header.rotated-jwt.sig'); i++) {
    await ask(s); await wait(200);
  }
  ok(seen.exchanges.some((e) => e.body.assertion === 'header.rotated-jwt.sig'), 'a rotated token file is picked up without a restart');
  s.child.kill();

  /* 3. Federation asked for, but the host never provided the token. */
  const { ANTHROPIC_IDENTITY_TOKEN_FILE, ...noFile } = FED;
  const s2 = await boot({ ...noFile, ANTHROPIC_API_KEY: 'sk-ant-api03-should-never-be-used' });
  const h2 = await (await fetch(s2.url + '/healthz')).json();
  ok(h2.tutor === false && h2.aiAuth === null, 'incomplete federation turns the AI off rather than falling back to a key');
  ok(/Missing: ANTHROPIC_IDENTITY_TOKEN_FILE/.test(s2.log()), 'and the log says exactly what is missing');
  ok((await ask(s2)).status === 503, 'the tutor answers 503, not a crash');
  s2.child.kill();

  /* 4. Anthropic rejects the token. */
  fs.writeFileSync(tokenFile, 'bad.jwt.token');
  const s3 = await boot(FED);
  await wait(800);
  ok(/ai check:\s+FAILED \(oidc\)/.test(s3.log()), 'a rejected token shows up at startup in the deploy log');
  ok((await ask(s3)).status === 503, 'and students get a calm 503');
  s3.child.kill();

  /* 5. Local development with a key and no federation still works. */
  const s4 = await boot({ ANTHROPIC_API_KEY: 'sk-ant-api03-local-dev' });
  const h4 = await (await fetch(s4.url + '/healthz')).json();
  ok(h4.aiAuth === 'api_key', 'with no federation, a local API key still works for development');
  s4.child.kill();
} catch (e) {
  failures++;
  console.error('  FAIL the test itself crashed:', e);
} finally {
  api.close();
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(failures ? `\n${failures} FAILED` : '\nall OIDC checks passed');
process.exit(failures ? 1 : 0);
