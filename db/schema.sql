-- ============================================================
-- SAT LockIn, database schema (plain PostgreSQL)
--
-- Runs on Railway's Postgres plugin, or any Postgres. The server applies
-- this automatically on boot, so there is no manual migration step: add
-- the Postgres plugin, redeploy, done.
--
-- Access control lives in the server, not in the database. Every query is
-- scoped by the session's user id, and there is no cross-user read.
--
-- What is stored: an email (needed to log in), a display name, and answer
-- data. No date of birth, no address, no free text about a student.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- people ----------
-- UNUSED, kept for old data: users.role, users.class_code and
-- users.class_status (set below) belonged to the class and teacher view,
-- which is gone. Nothing reads or writes them now. They are not dropped
-- because live databases still hold rows in them.
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
-- UNUSED, kept for old data. Classes and teachers were removed from the
-- app; nothing reads or writes this table now.
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
-- steps the student opened before answering a practice question
alter table events add column if not exists hints int;
create index if not exists events_user_idx  on events (user_id, t desc);
create index if not exists events_trap_idx  on events (user_id, trap);
create index if not exists events_strat_idx on events (user_id, strat);

-- ---------- questions written by Claude ----------
-- UNUSED, kept for old data. The app no longer generates or stores
-- questions; nothing reads or writes this table now.
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

-- ---------- class membership (UNUSED, kept for old data) ----------
-- Once the teacher's approval state for a class join. Classes are gone;
-- nothing reads or writes this column now.
alter table users add column if not exists class_status text not null default 'approved';

-- ---------- naming reps: one row per "name the move" answer ----------
-- The recognition record. Keyed by a client-made id so re-sync is
-- idempotent and two devices merge without double counting. `daily` is
-- set when the rep was that day's Daily LockIn question, which is how the
-- streak follows a student to another device.
create table if not exists naming_reps (
  key      text primary key,
  user_id  uuid not null references users (id) on delete cascade,
  t        timestamptz not null,
  qid      text,
  strat    text not null,
  picked   text,
  "right"  boolean not null,
  daily    date
);
create index if not exists naming_user_idx on naming_reps (user_id, t desc);

-- ---------- purchases ----------
-- Written only by the payment provider's signed webhook. Matched to an
-- account by user id when checkout carried one, and otherwise by email, so
-- someone can pay first and sign in later with the same address.
create table if not exists purchases (
  ref         text primary key,              -- the provider's payment id
  provider    text not null,
  email       text,
  user_id     uuid references users (id) on delete set null,
  amount      int,
  currency    text,
  created_at  timestamptz not null default now(),
  revoked_at  timestamptz                    -- set on a full refund
);
create index if not exists purchases_email_idx on purchases (lower(email));
create index if not exists purchases_user_idx on purchases (user_id);

-- ---------- the coach's sessions ----------
-- One row per session the coach agent prepares. `plan` holds
-- { id, qids: [8], moves: [8], line, questions, section? } (section is
-- 'rw' or 'math' when the student picked one); older rows hold the retired
-- step-based plan shape and are ignored. `day` is the student's own date,
-- so it lines up with their Daily LockIn. A few per day at most (the server
-- caps it), kept so the coach can see the last session and vary the next.
create table if not exists coach_plans (
  id          bigserial primary key,
  user_id     uuid not null references users (id) on delete cascade,
  day         date not null,
  plan        jsonb not null,
  model       text,
  turns       int,
  created_at  timestamptz not null default now()
);
create index if not exists coach_user_day_idx on coach_plans (user_id, day desc);

-- ---------- the shared pool of fresh questions ----------
-- Questions Claude wrote for one move when a student ran low on unseen
-- ones, each checked blind by a second model before it is stored (see
-- lib/writer.js). Shared by every student. `payload` is the full question
-- in the bank's shape plus `tags: {strat, traps: {index: trapId}}`, with
-- every text field already sanitized on the server; the app renders it as
-- HTML. `verdict` is what the checking model returned.
create table if not exists pool_questions (
  id              text primary key,
  strat           text not null,
  section         text,
  payload         jsonb not null,
  writer_model    text,
  verifier_model  text,
  verdict         jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists pool_strat_idx on pool_questions (strat);

-- ---------- server-wide daily cap on question writing ----------
-- One row per UTC day. `attempts` counts questions asked of the writer and
-- is what POOL_DAILY_LIMIT caps; it lives here so a restart does not reset
-- it. `accepted` and `rejected` are for keeping an eye on quality.
create table if not exists pool_usage (
  day       date primary key,
  attempts  int not null default 0,
  accepted  int not null default 0,
  rejected  int not null default 0
);
