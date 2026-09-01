/**
 * Test-only database factory. Builds a fresh, fully-migrated in-memory
 * database on the `sql.js` driver (pure WASM, no native compilation) so
 * repository/CRUD tests run under plain Jest/Node without touching the real
 * `expo-sqlite` native module (Section 35 — "repository layer: tests
 * against an in-memory/test SQLite database").
 *
 * Not imported by any app code — `src/app/di/providers.ts` always
 * constructs repositories against the real `expo-sqlite` client.
 */
import initSqlJs from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema';
import { runMigrations, type AnyInvoraDb } from './migrate';

export async function createTestDb(): Promise<AnyInvoraDb> {
  const SQL = await initSqlJs();
  const sqlJsDb = new SQL.Database();
  const db = drizzle(sqlJsDb, { schema }) as unknown as AnyInvoraDb;
  // Mirrors `client.ts` — SQLite disables FK enforcement per-connection by
  // default, and the schema's cascade/set-null/restrict behavior (Section 7)
  // only takes effect once this pragma is on.
  db.run('PRAGMA foreign_keys = ON;');
  runMigrations(db);
  return db;
}
