/* ============================================================
   Postgres access.

   One pool, created from DATABASE_URL, which render.yaml wires to the
   database's internal URL. The schema is applied on boot, so there is no
   separate migration step to forget.

   If DATABASE_URL is absent the whole module reports unavailable and the
   server serves the offline app only. That is a supported way to run.
   ============================================================ */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

let pool = null;
let ready = false;
let initError = null;

export function configured() {
  return !!process.env.DATABASE_URL;
}

export function available() {
  return ready;
}

export function lastError() {
  return initError ? String(initError.message || initError) : null;
}

export async function init() {
  if (!configured()) return false;
  if (ready) return true;
  try {
    const { default: pg } = await import('pg');
    /* On Render, use the Internal Database URL: it stays on Render's private
       network and needs no TLS. When TLS is asked for (an external URL, or
       PGSSL=true), the server's certificate is verified, so nothing in the
       middle can pose as the database. PGSSL_NO_VERIFY=true turns the check
       off for a provider with a private certificate authority; avoid it. */
    const needsSSL = /\bsslmode=(require|verify-ca|verify-full)\b/.test(process.env.DATABASE_URL) ||
      process.env.PGSSL === 'true';
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSSL ? { rejectUnauthorized: process.env.PGSSL_NO_VERIFY !== 'true' } : undefined,
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    /* An idle client dropped by the server (a Postgres restart, a network
       blip) emits 'error' on the pool. Unhandled, that kills the process. */
    pool.on('error', (err) => { console.error('database pool error:', err.message); });
    /* The schema is applied on boot so that attaching a database is the whole
       setup. Every statement is "if not exists", so this is safe to repeat.
       Set SKIP_DB_INIT=true if you would rather apply it from CI instead, in
       which case the app needs no DDL rights at runtime. */
    if (process.env.SKIP_DB_INIT === 'true') {
      await pool.query('select 1');
    } else {
      const sql = await fs.readFile(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
      await pool.query(sql);
    }
    ready = true;
    initError = null;
    return true;
  } catch (e) {
    initError = e;
    ready = false;
    return false;
  }
}

export function query(text, params) {
  if (!ready) return Promise.reject(new Error('The database is not available.'));
  return pool.query(text, params);
}

/* Runs fn(q) inside one transaction on one connection, where q has the
   same shape as query(). Commits if fn resolves, rolls back if it throws. */
export async function transaction(fn) {
  if (!ready) throw new Error('The database is not available.');
  const client = await pool.connect();
  let broken = null;   // a connection left mid-transaction must not go back to the pool
  try {
    await client.query('begin');
    const out = await fn((text, params) => client.query(text, params));
    await client.query('commit');
    return out;
  } catch (e) {
    try { await client.query('rollback'); } catch (rb) { broken = rb; }
    throw e;
  } finally {
    client.release(broken || undefined);
  }
}

export async function close() {
  if (pool) await pool.end();
}
