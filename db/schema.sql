-- ============================================================
-- SAT LockIn, database schema (plain PostgreSQL)
--
-- Runs on Railway's Postgres plugin, or any Postgres. The server applies
-- this automatically on boot, so there is no manual migration step: add
-- the Postgres plugin, redeploy, done.
--
-- Access control lives in the server, not in the database. Every query is
-- scoped by the session's user id, and the only cross-user read is a
-- teacher looking at their own class.
--
-- What is stored: an email (needed to log in), a display name, and answer
-- data. No date of birth, no address, no free text about a student.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- people ----------
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  display_name  text,
  role          text not null default 'student' check (role in ('student', 'teacher')),
  class_code    text,
  created_at    timestamptz not null default now(),
  last_seen     timestamptz
);
create unique index if not exists users_email_key on users (lower(email));
create index if not exists users_class_idx on users (class_code);

-- ---------- sign in with a one-time code ----------
-- Only the hash of the code is stored, and it expires. `attempts` stops
-- someone brute forcing six digits.
create table if not exists login_codes (
  email       text primary key,
  code_hash   text not null,
  expires_at  timestamptz not null,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists login_codes_expiry_idx on login_codes (expires_at);

-- ---------- sessions ----------
-- Only the hash of the token is stored, so a database leak cannot be
-- replayed as a login.
create table if not exists sessions (
  token_hash  text primary key,
  user_id     uuid not null references users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null
);
create index if not exists sessions_user_idx on sessions (user_id);
-- the boot-time sweep deletes expired rows, so give it an index to use
create index if not exists sessions_expiry_idx on sessions (expires_at);

-- ---------- classes ----------
create table if not exists classes (
  code        text primary key,
  name        text not null,
  owner       uuid not null references users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------- attempts: one row per test or practice set ----------
create table if not exists attempts (
  id           text primary key,
  user_id      uuid not null references users (id) on delete cascade,
  kind         text,
  label        text,
  started_at   timestamptz,
  finished_at  timestamptz,
  total        int,
  rw_scaled    int,
  math_scaled  int,
  rw_raw       int,
  math_raw     int,
  rw_path      text,
  math_path    text,
  payload      jsonb,
  created_at   timestamptz not null default now()
);
create index if not exists attempts_user_idx on attempts (user_id, finished_at desc);

-- ---------- events: one row per answered question ----------
-- This is the table the whole diagnosis is built from.
create table if not exists events (
  key         text primary key,        -- attemptId|questionId, so re-sync is idempotent
  user_id     uuid not null references users (id) on delete cascade,
  attempt     text,
  t           timestamptz,
  qid         text,
  section     text,
  domain      text,
  skill       text,
  difficulty  text,
  strat       text,                    -- the strategy the question tests
  trap        text,                    -- the trap she fell for, if she did
  correct     boolean,
  seconds     int,
  created_at  timestamptz not null default now()
);
create index if not exists events_user_idx  on events (user_id, t desc);
create index if not exists events_trap_idx  on events (user_id, trap);
create index if not exists events_strat_idx on events (user_id, strat);

-- ---------- questions written by Claude ----------
-- Shared, so a class of thirty grows one bank instead of each student
-- paying to regenerate the same material. Holds no personal data.
create table if not exists generated_questions (
  id          text primary key,
  author      uuid references users (id) on delete set null,
  section     text not null,
  domain      text,
  skill       text,
  difficulty  text,
  strat       text,
  traps       text[],
  model       text,
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists genq_skill_idx on generated_questions (section, skill);
create index if not exists genq_strat_idx on generated_questions (strat);

-- ---------- per-student daily cap on AI requests ----------
create table if not exists ai_usage (
  user_id  uuid not null references users (id) on delete cascade,
  day      date not null default current_date,
  n        int  not null default 0,
  primary key (user_id, day)
);
