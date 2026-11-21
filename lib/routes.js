/* ============================================================
   The JSON API.

   Every route is scoped to the caller's own rows. The single exception is
   a teacher reading their own class, which is checked by looking up the
   class owner rather than trusting anything the client sends.
   ============================================================ */
import { query, available } from './db.js';
import * as auth from './auth.js';
import * as mail from './mail.js';
import * as billing from './billing.js';

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
  /* Writing codes to the log is fine while you test on your own. Once the
     server takes payments, a paying student who cannot receive a code
     cannot get into what they bought, so refuse plainly instead.
     LOG_SIGNIN_CODES=true overrides this for a staging copy. */
  if (!mail.configured() && billing.configured() && process.env.LOG_SIGNIN_CODES !== 'true') {
    throw fail(503, 'Sign-in email is not set up on this server yet, so no code can be sent.');
  }
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

  let owner = null;
  if (wantsClass && code) {
    const cls = (await query('select owner from classes where code = $1', [code])).rows[0];
    if (!cls) throw fail(400, 'No class has that code. Check it with your teacher.');
    owner = cls.owner;
  }
  /* Joining puts a student on the teacher's pending list. Nothing is shared
     either way until the teacher approves: a class code passed around a
     group chat should not hand a stranger the class bank or put them on the
     roster. Re-entering the class you are already in keeps your status, and
     the class's own teacher is approved by definition. */
  await query(
    `update users
        set display_name = coalesce($2, display_name),
            class_status = case
              when not $3 then class_status
              when $4::text is null then 'approved'
              when $4 = class_code then class_status
              when $5::uuid = id then 'approved'
              else 'pending' end,
            class_code   = case when $3 then $4 else class_code end
      where id = $1`,
    [user.id, name === undefined ? null : name, wantsClass, code, owner]
  );
  return { user: await auth.userById(user.id) };
}

/* ---------------- sync ---------------- */
async function pushEvents(user, body) {
  /* One malformed row must not fail the batch: the client would re-queue the
     same batch forever and that student would never sync again. Bad rows are
     dropped here instead. */
  const raw = Array.isArray(body.events) ? body.events.slice(0, 2000) : [];
  const short = (v, n) => (v === undefined || v === null || v === '' ? null : String(v).slice(0, n));
  const list = raw.filter((e) => e && typeof e === 'object' && e.key !== undefined && e.key !== null && String(e.key).length);
  if (!list.length) return { stored: 0 };
  const cols = [[], [], [], [], [], [], [], [], [], [], [], [], []];
  list.forEach((e) => {
    const t = e.t ? new Date(e.t) : null;
    cols[0].push(String(e.key).slice(0, 120));
    cols[1].push(user.id);
    cols[2].push(short(e.attempt, 80));
    cols[3].push(t && !Number.isNaN(t.getTime()) ? t.toISOString() : new Date().toISOString());
    cols[4].push(short(e.qid, 80));
    cols[5].push(short(e.section, 20));
    cols[6].push(short(e.domain, 120));
    cols[7].push(short(e.skill, 120));
    cols[8].push(short(e.difficulty, 4));
    cols[9].push(short(e.strat, 60));
    cols[10].push(short(e.trap, 60));
    cols[11].push(typeof e.correct === 'boolean' ? e.correct : null);
    cols[12].push(Number.isFinite(e.seconds) ? Math.max(0, Math.min(9999, Math.round(e.seconds))) : 0);
  });
  await query(
    `insert into events (key, user_id, attempt, t, qid, section, domain, skill, difficulty, strat, trap, correct, seconds)
     select * from unnest($1::text[], $2::uuid[], $3::text[], $4::timestamptz[], $5::text[], $6::text[],
                          $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::boolean[], $13::int[])
     on conflict (key) do update
       set correct = excluded.correct, seconds = excluded.seconds, trap = excluded.trap
       where events.user_id = excluded.user_id`,
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
     on conflict (id) do update set payload = excluded.payload, finished_at = excluded.finished_at
       where attempts.user_id = excluded.user_id`,
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
  /* A class shares one generated bank, so thirty students do not pay to write
     the same questions thirty times. It stops at the class: the table is
     written by any signed-in user, and serving it to everyone would let one
     account plant content in every other student's bank. The client also
     sanitizes whatever it installs. */
  const myClass = user.class_code && user.class_status === 'approved' ? user.class_code : null;
  const generated = (await query(
    `select g.payload from generated_questions g
       join users a on a.id = g.author
      where g.author = $1
         or ($2::text is not null and a.class_code = $2 and a.class_status = 'approved')
      order by g.created_at desc limit 400`,
    [user.id, myClass]
  )).rows.map((r) => r.payload);
  const naming = (await query(
    `select key as k, t, qid, strat, picked, "right", to_char(daily, 'YYYY-MM-DD') as daily
       from naming_reps where user_id = $1 order by t desc limit 5000`,
    [user.id]
  )).rows;
  return { events, attempts, generated, naming, user };
}

/* ---------------- naming reps ---------------- */
async function pushNaming(user, body) {
  const raw = Array.isArray(body.reps) ? body.reps.slice(0, 2000) : [];
  const short = (v, n) => (v === undefined || v === null || v === '' ? null : String(v).slice(0, n));
  const list = raw.filter((r) => r && typeof r === 'object' && r.k && r.strat && typeof r.right === 'boolean');
  if (!list.length) return { stored: 0 };
  const cols = [[], [], [], [], [], [], [], []];
  list.forEach((r) => {
    const t = r.t ? new Date(r.t) : null;
    cols[0].push(String(r.k).slice(0, 80));
    cols[1].push(user.id);
    cols[2].push(t && !Number.isNaN(t.getTime()) ? t.toISOString() : new Date().toISOString());
    cols[3].push(short(r.qid, 80));
    cols[4].push(String(r.strat).slice(0, 60));
    cols[5].push(short(r.picked, 60));
    cols[6].push(r.right);
    cols[7].push(/^\d{4}-\d{2}-\d{2}$/.test(String(r.daily || '')) ? r.daily : null);
  });
  /* Reps never change once made, so a key already stored is skipped. The
     key is global, so a collision with someone else's row is skipped too
     rather than overwriting it. */
  const out = await query(
    `insert into naming_reps (key, user_id, t, qid, strat, picked, "right", daily)
     select * from unnest($1::text[], $2::uuid[], $3::timestamptz[], $4::text[], $5::text[],
                          $6::text[], $7::boolean[], $8::date[])
     on conflict (key) do nothing`,
    cols
  );
  return { stored: out.rowCount };
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
  await query(
    `update users set role = 'teacher', class_code = $2, class_status = 'approved' where id = $1`,
    [user.id, code]
  );
  return { user: await auth.userById(user.id), class: { code, name } };
}

/* A teacher approves a pending student, or removes anyone from their class.
   The student must be in a class this teacher owns, checked here. */
async function classDecide(user, body) {
  const id = String(body.student_id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw fail(400, 'No student given.');
  const approve = body.approve === true;
  const out = await query(
    approve
      ? `update users set class_status = 'approved'
          where id = $1 and role = 'student'
            and class_code in (select code from classes where owner = $2)`
      : `update users set class_code = null, class_status = 'approved'
          where id = $1 and role = 'student'
            and class_code in (select code from classes where owner = $2)`,
    [id, user.id]
  );
  if (!out.rowCount) throw fail(404, 'That student is not in your class.');
  return { ok: true };
}

async function classRoster(user) {
  const owned = (await query('select code, name from classes where owner = $1', [user.id])).rows;
  if (!owned.length) return { classes: [], roster: [], pending: [], traps: [], confusions: [] };
  const codes = owned.map((c) => c.code);

  const roster = (await query(
    `select u.id            as student_id,
            u.display_name,
            u.email,
            u.class_code,
            count(e.key)::int                              as answered,
            count(e.key) filter (where e.correct)::int      as correct,
            count(distinct e.attempt)::int                 as sessions,
            max(e.t)                                       as last_active,
            (select count(*)::int from naming_reps n where n.user_id = u.id)              as named,
            (select count(*)::int from naming_reps n where n.user_id = u.id and n."right") as named_right,
            (select e2.trap from events e2
              where e2.user_id = u.id and e2.trap is not null
              group by e2.trap order by count(*) desc limit 1) as top_trap
       from users u
       left join events e on e.user_id = u.id
      where u.class_code = any($1) and u.role = 'student' and u.class_status = 'approved'
      group by u.id, u.display_name, u.email, u.class_code
      order by max(e.t) desc nulls last`,
    [codes]
  )).rows;

  const traps = (await query(
    `select e.trap as id, count(*)::int as n
       from events e join users u on u.id = e.user_id
      where u.class_code = any($1) and u.class_status = 'approved' and e.trap is not null
      group by e.trap order by n desc limit 20`,
    [codes]
  )).rows;

  /* Which moves the class reads as which: the recognition version of the
     trap list, and the most useful thing to teach a whole room. */
  const confusions = (await query(
    `select n.strat, n.picked, count(*)::int as n
       from naming_reps n join users u on u.id = n.user_id
      where u.class_code = any($1) and u.class_status = 'approved'
        and not n."right" and n.picked is not null
      group by n.strat, n.picked order by n desc limit 12`,
    [codes]
  )).rows;

  const pending = (await query(
    `select id as student_id, display_name, email, class_code
       from users
      where class_code = any($1) and role = 'student' and class_status = 'pending'
      order by created_at`,
    [codes]
  )).rows;

  return { classes: owned, roster, pending, traps, confusions };
}

/* ---------------- AI usage cap ---------------- */
/* Claims one unit of today's allowance atomically and returns the new count.
   Claiming before the model call, in one statement, is what stops a burst of
   parallel requests from all reading the same old count and all getting
   through. */
export async function claimUsage(userId) {
  const rows = (await query(
    `insert into ai_usage (user_id, day, n) values ($1, current_date, 1)
     on conflict (user_id, day) do update set n = ai_usage.n + 1
     returning n`,
    [userId]
  )).rows;
  return rows[0].n;
}

/* Gives a claimed unit back when the model call failed, so an outage does
   not eat a student's allowance. */
export async function releaseUsage(userId) {
  await query(
    `update ai_usage set n = greatest(0, n - 1) where user_id = $1 and day = current_date`,
    [userId]
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
    case '/api/sync/naming':  return pushNaming(await requireUser(req), body);
    case '/api/generated':    return pushGenerated(await requireUser(req), body);
    case '/api/class/create': return createClass(await requireUser(req), body);
    case '/api/class/roster': return classRoster(await requireUser(req));
    case '/api/class/decide': return classDecide(await requireUser(req), body);
    default: throw fail(404, 'No such endpoint.');
  }
}
