import { getDb } from './client';
import { runMigrations } from './migrate';
import { seedDatabase } from './seed';

let initialized = false;

/**
 * Opens the SQLite handle, applies every pending migration, and seeds a
 * fresh database (Section 6: "Migrations run on app startup, before any
 * screen mounts"). Safe to call more than once — every step is idempotent,
 * so a second call from a hot-reload or a re-mounted root is a no-op.
 * Repository cache hydration (populating the shared `mock*` fixtures — see
 * `core/utils/syncCache`) happens separately in `src/app/App.tsx`'s boot
 * sequence, by calling each repository's own read method once.
 */
export function initializeDatabase(): void {
  if (initialized) return;
  const db = getDb();
  runMigrations(db);
  seedDatabase(db);
  initialized = true;
}
