// Imported from the `/driver` subpath rather than the `drizzle-orm/expo-sqlite`
// barrel — the barrel also re-exports `useLiveQuery` (`query.js`), which pulls
// in `expo-sqlite` (and, transitively, `expo-asset`) purely for its React hook
// wiring. This module doesn't use that hook, and importing it eagerly would
// mean any file importing a `Sqlite*Repository` for its class (tests included)
// loads the native `expo-sqlite` binding whether or not `getDb()` ever runs.
import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite/driver';
import type { SQLiteDatabase } from 'expo-sqlite';
import * as schema from './schema';

/** Type alias every repository imports — swapping the driver later never leaks past this file. */
export type Database = ExpoSQLiteDatabase<typeof schema>;

const DB_FILE_NAME = 'invora.db';

let sqliteHandle: SQLiteDatabase | null = null;
let db: Database | null = null;

/**
 * Opens (or returns the already-open) `expo-sqlite` handle wrapped by
 * Drizzle (Section 6). Lazily created on first *call* rather than at module
 * import time — `expo-sqlite` itself is `require()`-d inside this function
 * body, not imported at the top of the file, so merely importing this
 * module (e.g. transitively, via a `Sqlite*Repository`'s default
 * constructor parameter) never touches the native module. That's what lets
 * repository tests construct a repository against an injected `sql.js` test
 * database (`database/testUtils.ts`) without ever loading `expo-sqlite`.
 */
export function getDb(): Database {
  if (!db) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { openDatabaseSync } = require('expo-sqlite') as typeof import('expo-sqlite');
    sqliteHandle = openDatabaseSync(DB_FILE_NAME, { enableChangeListener: false });
    // SQLite defaults foreign-key enforcement OFF per connection — Section 7's
    // FK constraints (cascade/set null/restrict) only take effect once this
    // pragma is on.
    sqliteHandle.execSync('PRAGMA foreign_keys = ON;');
    db = drizzle(sqliteHandle, { schema });
  }
  return db;
}

/** Test/dev-only escape hatch to force a fresh handle (e.g. between Jest test files). */
export function resetDbForTests(): void {
  sqliteHandle = null;
  db = null;
}
