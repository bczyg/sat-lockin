/* ============================================================
   Sign in with a one-time emailed code.

   No passwords, deliberately: nothing to reset, nothing to leak, and one
   less thing for a sixteen year old to forget. The flow is

     POST /api/auth/request  { email }        -> emails a 6 digit code
     POST /api/auth/verify   { email, code }  -> returns a session token

   What is stored is a hash of the code and a hash of the token, never the
   values themselves, so a database dump cannot be replayed as a login.
   ============================================================ */
import crypto from 'node:crypto';
import { query } from './db.js';

const CODE_TTL_MIN = 20;
const SESSION_TTL_DAYS = 60;
const MAX_CODE_ATTEMPTS = 6;

const sha = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
const norm = (email) => String(email || '').trim().toLowerCase();

export function validEmail(email) {
  const e = norm(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254;
}

/* A 6 digit code from a cryptographic source, not Math.random. */
function newCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

const RESEND_GAP_SECONDS = 45;

export async function requestCode(email) {
  const e = norm(email);

  /* Asking again immediately is either an impatient student or someone using
     this endpoint to send mail at your expense. One code per 45 seconds per
     address covers both without getting in a real user's way. */
  const recent = (await query(
    `select extract(epoch from (now() - created_at))::int as age
       from login_codes where email = $1`,
    [e]
  )).rows[0];
  if (recent && recent.age < RESEND_GAP_SECONDS) {
    throw Object.assign(
      new Error(`A code was just sent. Wait ${RESEND_GAP_SECONDS - recent.age} seconds and try again.`),
      { status: 429 }
    );
  }

  const code = newCode();
  await query(
    `insert into login_codes (email, code_hash, expires_at, attempts)
     values ($1, $2, now() + ($3 || ' minutes')::interval, 0)
     on conflict (email) do update
       set code_hash = excluded.code_hash,
           expires_at = excluded.expires_at,
           attempts = 0,
           created_at = now()`,
    [e, sha(code), String(CODE_TTL_MIN)]
  );
  return { code, expiresInMinutes: CODE_TTL_MIN };
}

export async function verifyCode(email, code) {
  const e = norm(email);
  const rows = (await query(
    `select code_hash, attempts, expires_at < now() as expired from login_codes where email = $1`,
    [e]
  )).rows;
  if (!rows.length) throw Object.assign(new Error('Ask for a new code.'), { status: 400 });
  const row = rows[0];
  if (row.expired) {
    await query('delete from login_codes where email = $1', [e]);
    throw Object.assign(new Error('That code has expired. Ask for a new one.'), { status: 400 });
  }
  if (row.attempts >= MAX_CODE_ATTEMPTS) {
    await query('delete from login_codes where email = $1', [e]);
    throw Object.assign(new Error('Too many tries. Ask for a new code.'), { status: 429 });
  }

  const given = Buffer.from(sha(String(code).trim()));
  const stored = Buffer.from(row.code_hash);
  const ok = given.length === stored.length && crypto.timingSafeEqual(given, stored);
  if (!ok) {
    await query('update login_codes set attempts = attempts + 1 where email = $1', [e]);
    throw Object.assign(new Error('That code did not match.'), { status: 400 });
  }

  await query('delete from login_codes where email = $1', [e]);

  const user = (await query(
    `insert into users (email, display_name)
     values ($1, $2)
     on conflict (lower(email)) do update set last_seen = now()
     returning id, email, display_name, role, class_code`,
    [e, e.split('@')[0]]
  )).rows[0];

  const token = crypto.randomBytes(32).toString('base64url');
  await query(
    `insert into sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + ($3 || ' days')::interval)`,
    [sha(token), user.id, String(SESSION_TTL_DAYS)]
  );
  return { token, user, expiresInDays: SESSION_TTL_DAYS };
}

/* Returns the user for a bearer token, or null. */
export async function userForToken(token) {
  if (!token) return null;
  const rows = (await query(
    `select u.id, u.email, u.display_name, u.role, u.class_code
       from sessions s join users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [sha(token)]
  )).rows;
  if (!rows.length) return null;
  query('update users set last_seen = now() where id = $1', [rows[0].id]).catch(() => {});
  return rows[0];
}

export async function signOut(token) {
  if (!token) return;
  await query('delete from sessions where token_hash = $1', [sha(token)]).catch(() => {});
}

/* Housekeeping, cheap enough to run on boot and once a day. */
export async function sweep() {
  await query('delete from sessions where expires_at < now()').catch(() => {});
  await query('delete from login_codes where expires_at < now()').catch(() => {});
}
