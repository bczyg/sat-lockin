/* ============================================================
   Postgres access.

   One pool, created from DATABASE_URL, which Railway sets for you when you
   add the Postgres plugin. The schema is applied on boot, so there is no
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
    const needsSSL = /\bsslmode=require\b/.test(process.env.DATABASE_URL) ||
      process.env.PGSSL === 'true';
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: needsSSL ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.PG_POOL_MAX || 5),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    const sql = await fs.readFile(path.join(ROOT, 'db', 'schema.sql'), 'utf8');
    await pool.query(sql);
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

export async function close() {
  if (pool) await pool.end();
}
