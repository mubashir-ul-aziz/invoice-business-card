import { createTestDb } from '../testUtils';
import { runMigrations } from '../migrate';
import type { Migration } from '../migrations';
import { MIGRATION_0000_INIT } from '../migrations/0000_init';

/**
 * Phase 21 hardening: proves the two guarantees Section 21's acceptance
 * criteria calls out beyond simple idempotency —
 *   1. a database that already has some migrations applied only has the
 *      *remaining* ones applied on the next run (the real "prior schema
 *      version -> current" path an app update exercises on a user's device);
 *   2. a migration that fails partway through never leaves partial schema
 *      changes behind, and is retried in full next launch — SQLite's own
 *      transactional guarantee (Section 6), exercised here rather than
 *      assumed.
 *
 * Uses a synthetic second migration rather than a real one, since the app
 * is still on its first schema version (0000_init) — this keeps the
 * incremental-apply *logic* under test now, ready for the day a real
 * 0001_* migration lands.
 */
describe('runMigrations — incremental path and crash-safety', () => {
  it('only applies newer migrations to a database already migrated to a prior version', async () => {
    const db = await createTestDb(); // already at 0000_init only

    const noteMigration: Migration = {
      id: '0001_add_customer_note_flag',
      statements: ['ALTER TABLE customers ADD COLUMN is_vip INTEGER NOT NULL DEFAULT 0'],
    };

    // Seed one row under the old schema so we can confirm it survives the upgrade untouched.
    const now = new Date().toISOString();
    db.run(`INSERT INTO customers (id, name, created_at, updated_at) VALUES ('cust-1', 'Acme', '${now}', '${now}')`);

    runMigrations(db, [MIGRATION_0000_INIT, noteMigration]);

    const applied = db.all<{ id: string }>('SELECT id FROM __invora_migrations ORDER BY id');
    expect(applied.map((r) => r.id)).toEqual(['0000_init', '0001_add_customer_note_flag']);

    const [row] = db.all<{ id: string; name: string; is_vip: number }>(
      "SELECT id, name, is_vip FROM customers WHERE id = 'cust-1'",
    );
    expect(row.name).toBe('Acme'); // pre-existing data untouched
    expect(row.is_vip).toBe(0); // new column applied with its default

    // Running again (e.g. next app launch) is a no-op — nothing re-applied, nothing thrown.
    expect(() => runMigrations(db, [MIGRATION_0000_INIT, noteMigration])).not.toThrow();
    const appliedAgain = db.all<{ id: string }>('SELECT id FROM __invora_migrations');
    expect(appliedAgain).toHaveLength(2);
  });

  it('rolls back a migration that fails partway through, leaving no partial schema change and no recorded id', async () => {
    const db = await createTestDb();

    const brokenMigration: Migration = {
      id: '0001_broken',
      statements: [
        'ALTER TABLE customers ADD COLUMN loyalty_points INTEGER NOT NULL DEFAULT 0',
        'ALTER TABLE this_table_does_not_exist ADD COLUMN nope INTEGER', // fails
      ],
    };

    expect(() => runMigrations(db, [MIGRATION_0000_INIT, brokenMigration])).toThrow();

    // Not recorded as applied — next launch will retry it in full.
    const applied = db.all<{ id: string }>('SELECT id FROM __invora_migrations');
    expect(applied.map((r) => r.id)).toEqual(['0000_init']);

    // The first statement's column change was rolled back along with the second's failure —
    // SQLite's transaction guarantee (Section 6/21), not partial application.
    const columns = db.all<{ name: string }>('PRAGMA table_info(customers)');
    expect(columns.some((c) => c.name === 'loyalty_points')).toBe(false);

    // The database is still fully usable afterwards — a failed migration attempt doesn't corrupt it.
    const now = new Date().toISOString();
    expect(() =>
      db.run(`INSERT INTO customers (id, name, created_at, updated_at) VALUES ('cust-2', 'Beta', '${now}', '${now}')`),
    ).not.toThrow();
  });
});
