import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import { MIGRATIONS, type Migration } from './migrations';

/** Generic over the concrete driver so the same runner works against the real `expo-sqlite` client and the `sql.js` client used in tests. */
export type AnyInvoraDb = BaseSQLiteDatabase<'sync', any, any>;

const MIGRATIONS_TABLE = '__invora_migrations';

/**
 * Safe-migration runner (Section 6, Section 21's "safe migrations"
 * requirement): tracks which migration ids have already run in
 * `__invora_migrations`, and applies only the ones that haven't, in order,
 * inside a single transaction per migration. Re-running this on every app
 * startup against an already-migrated database is a no-op. A prior-version
 * database (some ids already recorded) only has its remaining, newer
 * migrations applied — this is what carries a real device's DB forward
 * across an app update (Section 21).
 *
 * `migrations` defaults to the real, versioned list but is overridable so
 * tests can exercise the "N-1 -> N" incremental-apply path against a
 * synthetic multi-step list without touching production migration files
 * (Phase 21 acceptance criteria: "migration path tested from a prior schema
 * version to current").
 */
export function runMigrations(db: AnyInvoraDb, migrations: Migration[] = MIGRATIONS): void {
  db.run(`CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (id TEXT PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL)`);

  const appliedRows = db.all<{ id: string }>(`SELECT id FROM ${MIGRATIONS_TABLE}`);
  const applied = new Set(appliedRows.map((row) => row.id));

  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;

    db.transaction((tx) => {
      for (const statement of migration.statements) {
        tx.run(statement);
      }
      tx.run(`INSERT INTO ${MIGRATIONS_TABLE} (id, applied_at) VALUES ('${migration.id}', '${new Date().toISOString()}')`);
    });
  }
}
