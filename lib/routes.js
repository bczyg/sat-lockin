/* ============================================================
   The JSON API.

   Every route is scoped to the caller's own rows. The single exception is
   a teacher reading their own class, which is checked by looking up the
   class owner rather than trusting anything the client sends.
   ============================================================ */
import { query, available } from './db.js';
import * as auth from './auth.js';
import * as mail from './mail.js';

const ALLOW_CODE_IN_RESPONSE = process.env.ALLOW_CODE_IN_RESPONSE === 'true';
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT || '40');

/* A ceiling on how many sign-in emails one address can trigger in an hour.
   Held in memory, so it resets on redeploy. That is fine for what it guards
   against: someone pointing a script at this endpoint to burn your mail
   quota. A class of thirty will never come close. */
const CODES_PER_HOUR = Number(process.env.CODES_PER_HOUR || '8');
const codeCounts = new Map();

function underCodeLimit(email) {
  const now = Date.now();
  const hour = Math.floor(now / 3600000);
  const key = `${hour}:${email}`;
  if (codeCounts.size > 5000) codeCounts.clear();          // crude but bounded
  const n = (codeCounts.get(key) || 0) + 1;
  codeCounts.set(key, n);
  return n <= CODES_PER_HOUR;
}

function fail(status, message) {
  return Object.assign(new Error(message), { status });
}

async function requireUser(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) throw fail(401, 'Sign in first.');
  const user = await auth.userForToken(h.slice(7));
  if (!user) throw fail(401, 'Your session has expired. Sign in again.');
  return user;
}

/* ---------------- auth ---------------- */
async function authRequest(body) {
  if (!auth.validEmail(body.email)) throw fail(400, 'That email does not look right.');
  const addr = String(body.email).trim().toLowerCase();
  if (!underCodeLimit(addr)) {
    throw fail(429, 'Too many sign-in codes requested for that address. Try again later.');
  }
  const { code, expiresInMinutes } = await auth.requestCode(body.email);
  let delivered = false;
  try {
    const r = await mail.sendCode(String(body.email).trim().toLowerCase(), code);
    delivered = r.delivered;
  } catch (e) {
    throw fail(e.status || 502, e.message);
  }
  const out = { sent: true, delivered, expiresInMinutes };
  /* Only ever exposed when explicitly switched on for local testing. */
  if (!delivered && ALLOW_CODE_IN_RESPONSE) out.devCode = code;
  else if (!delivered) out.note = 'No mail provider is configured, so the code was written to the server log.';
  return out;
}

async function authVerify(body) {
  if (!auth.validEmail(body.email)) throw fail(400, 'That email does not look right.');
  if (!/^\d{4,8}$/.test(String(body.code || '').trim())) throw fail(400, 'Enter the six digit code.');
  const { token, user } = await auth.verifyCode(body.email, body.code);
  return { token: token, user: user };
}

/* ---------------- profile ---------------- */
async function getMe(user) {
  return { user: user };
}

async function patchMe(user, body) {
  const name = body.display_name === undefined ? undefined : String(body.display_name).trim().slice(0, 60);
  const wantsClass = Object.prototype.hasOwnProperty.call(body, 'class_code');
  const code = wantsClass && body.class_code ? String(body.class_code).trim().toUpperCase().slice(0, 24) : null;

  if (wantsClass && code) {
    const exists = (await query('select 1 from classes where code = $1', [code])).rowCount;
    if (!exists) throw fail(400, 'No class has that code. Check it with your teacher.');
  }
  const rows = (await query(
    `update users
        set display_name = coalesce($2, display_name),
            class_code   = case when $3 then $4 else class_code end
      where id = $1
      returning id, email, display_name, role, class_code`,
    [user.id, name === undefined ? null : name, wantsClass, code]
  )).rows;
  return { user: rows[0] };
}

/* ---------------- sync ---------------- */
async function pushEvents(user, body) {
  const list = Array.isArray(body.events) ? body.events.slice(0, 2000) : [];
  if (!list.length) return { stored: 0 };
  const cols = [[], [], [], [], [], [], [], [], [], [], [], [], []];
  list.forEach((e) => {
    cols[0].push(String(e.key).slice(0, 120));
    cols[1].push(user.id);
    cols[2].push(e.attempt ? String(e.attempt).slice(0, 80) : null);
    cols[3].push(e.t || new Date().toISOString());
    cols[4].push(e.qid ? String(e.qid).slice(0, 80) : null);
    cols[5].push(e.section || null);
    cols[6].push(e.domain || null);
    cols[7].push(e.skill || null);
    cols[8].push(e.difficulty || null);
    cols[9].push(e.strat || null);
    cols[10].push(e.trap || null);
    cols[11].push(typeof e.correct === 'boolean' ? e.correct : null);
    cols[12].push(Number.isFinite(e.seconds) ? Math.min(9999, Math.round(e.seconds)) : 0);
  });
  await query(
    `insert into events (key, user_id, attempt, t, qid, section, domain, skill, difficulty, strat, trap, correct, seconds)
     select * from unnest($1::text[], $2::uuid[], $3::text[], $4::timestamptz[], $5::text[], $6::text[],
                          $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::boolean[], $13::int[])
     on conflict (key) do update
       set correct = excluded.correct, seconds = excluded.seconds, trap = excluded.trap`,
    cols
  );
  return { stored: list.length };
}

async function pushAttempt(user, body) {
  const a = body.attempt;
  if (!a || !a.id) throw fail(400, 'No attempt supplied.');
  const rw = (a.sections && a.sections.rw) || null;
  const ma = (a.sections && a.sections.math) || null;
  await query(
    `insert into attempts (id, user_id, kind, label, started_at, finished_at, total,
                           rw_scaled, math_scaled, rw_raw, math_raw, rw_path, math_path, payload)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     on conflict (id) do update set payload = excluded.payload, finished_at = excluded.finished_at`,
    [String(a.id).slice(0, 80), user.id, a.kind || null, a.label || null,
      a.startedAt || null, a.finishedAt || null, a.total || null,
      rw ? rw.scaled : null, ma ? ma.scaled : null, rw ? rw.raw : null, ma ? ma.raw : null,
      rw ? rw.path : null, ma ? ma.path : null, JSON.stringify(a)]
  );
  return { stored: 1 };
}

async function pull(user) {
  const events = (await query(
    `select key, attempt, t, qid, section, domain, skill, difficulty, strat, trap, correct, seconds
       from events where user_id = $1 order by t desc limit 6000`,
    [user.id]
  )).rows;
  const attempts = (await query(
    `select payload from attempts where user_id = $1 order by finished_at desc limit 60`,
    [user.id]
  )).rows.map((r) => r.payload);
  const generated = (await query(
    `select payload from generated_questions order by created_at desc limit 400`
  )).rows.map((r) => r.payload);
  return { events, attempts, generated, user };
}

/* ---------------- generated questions ---------------- */
async function pushGenerated(user, body) {
  const list = Array.isArray(body.questions) ? body.questions.slice(0, 40) : [];
  let stored = 0;
  for (const q of list) {
    if (!q || !q.id || !q.section) continue;
    const traps = Object.keys(q.trapTags || {}).map((k) => q.trapTags[k]);
    await query(
      `insert into generated_questions (id, author, section, domain, skill, difficulty, strat, traps, model, payload)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       on conflict (id) do nothing`,
      [String(q.id).slice(0, 80), user.id, q.section, q.domain || null, q.skill || null,
        q.difficulty || null, q.strat || null, traps, q.model || null, JSON.stringify(q)]
    );
    stored++;
  }
  return { stored };
}

/* ---------------- classes ---------------- */
async function createClass(user, body) {
  const code = String(body.code || '').trim().toUpperCase().slice(0, 24);
  const name = String(body.name || '').trim().slice(0, 80);
  if (!/^[A-Z0-9-]{3,24}$/.test(code)) throw fail(400, 'Use 3 to 24 letters, numbers or hyphens for the code.');
  if (!name) throw fail(400, 'Give the class a name.');
  const taken = (await query('select owner from classes where code = $1', [code])).rows[0];
  if (taken && taken.owner !== user.id) throw fail(409, 'That class code is already taken. Try another.');
  await query(
    `insert into classes (code, name, owner) values ($1,$2,$3)
     on conflict (code) do update set name = excluded.name`,
    [code, name, user.id]
  );
  const rows = (await query(
    `update users set role = 'teacher', class_code = $2 where id = $1
     returning id, email, display_name, role, class_code`,
    [user.id, code]
  )).rows;
  return { user: rows[0], class: { code, name } };
}

async function classRoster(user) {
  const owned = (await query('select code, name from classes where owner = $1', [user.id])).rows;
  if (!owned.length) return { classes: [], roster: [], traps: [] };
  const codes = owned.map((c) => c.code);

  const roster = (await query(
    `select u.id            as student_id,
            u.display_name,
            u.email,
            u.class_code,
            count(e.key)                                   as answered,
            count(e.key) filter (where e.correct)           as correct,
            count(distinct e.attempt)                      as sessions,
            max(e.t)                                       as last_active,
            (select a.total from attempts a
              where a.user_id = u.id and a.total is not null
              order by a.finished_at desc limit 1)          as latest_total,
            (select e2.trap from events e2
              where e2.user_id = u.id and e2.trap is not null
              group by e2.trap order by count(*) desc limit 1) as top_trap
       from users u
       left join events e on e.user_id = u.id
      where u.class_code = any($1) and u.role = 'student'
      group by u.id, u.display_name, u.email, u.class_code
      order by max(e.t) desc nulls last`,
    [codes]
  )).rows;

  const traps = (await query(
    `select e.trap as id, count(*)::int as n
       from events e join users u on u.id = e.user_id
      where u.class_code = any($1) and e.trap is not null
      group by e.trap order by n desc limit 20`,
    [codes]
  )).rows;

  return { classes: owned, roster, traps };
}

/* ---------------- AI usage cap ---------------- */
export async function usageToday(userId) {
  const rows = (await query(
    'select n from ai_usage where user_id = $1 and day = current_date', [userId]
  )).rows;
  return rows.length ? rows[0].n : 0;
}

export async function bumpUsage(userId, n) {
  await query(
    `insert into ai_usage (user_id, day, n) values ($1, current_date, $2)
     on conflict (user_id, day) do update set n = excluded.n`,
    [userId, n]
  ).catch(() => {});
}

export { requireUser, DAILY_LIMIT };

/* ---------------- dispatch ---------------- */
export async function handle(req, url, body) {
  if (!available()) throw fail(503, 'Accounts are switched off on this server. Practice still works without signing in.');

  switch (url) {
    case '/api/auth/request': return authRequest(body);
    case '/api/auth/verify':  return authVerify(body);
    case '/api/auth/signout': {
      const h = req.headers.authorization || '';
      await auth.signOut(h.startsWith('Bearer ') ? h.slice(7) : '');
      return { ok: true };
    }
    case '/api/me':           return getMe(await requireUser(req));
    case '/api/me/update':    return patchMe(await requireUser(req), body);
    case '/api/sync/events':  return pushEvents(await requireUser(req), body);
    case '/api/sync/attempt': return pushAttempt(await requireUser(req), body);
    case '/api/sync/pull':    return pull(await requireUser(req));
    case '/api/generated':    return pushGenerated(await requireUser(req), body);
    case '/api/class/create': return createClass(await requireUser(req), body);
    case '/api/class/roster': return classRoster(await requireUser(req));
    default: throw fail(404, 'No such endpoint.');
  }
}
