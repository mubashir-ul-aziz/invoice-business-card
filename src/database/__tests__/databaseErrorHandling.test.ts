import { createTestDb } from '../testUtils';
import { AnyInvoraDb } from '../migrate';
import { SqliteBusinessRepository } from '../../features/business/data/repositories/sqliteBusinessRepository';
import { SqliteItemRepository } from '../../features/item/data/repositories/sqliteItemRepository';

/**
 * Phase 21: every repository call is expected to surface a lower-level
 * query/driver failure as a typed `DatabaseFailure` inside a `Result`
 * (Section 31) rather than throwing out of the async method — that's what
 * lets `src/app/App.tsx`'s boot sequence and every list-store's `load()`
 * show the shared `ErrorState`/retry UI instead of crashing. Simulated here
 * with a `select()` that throws, standing in for a real driver error (full
 * disk, a genuinely corrupt db file, etc.) without needing to actually
 * corrupt a database file in a test.
 */
function withBrokenSelect(db: AnyInvoraDb): AnyInvoraDb {
  return new Proxy(db, {
    get(target, prop, receiver) {
      if (prop === 'select') {
        return () => {
          throw new Error('simulated driver failure');
        };
      }
      return Reflect.get(target, prop, receiver);
    },
  }) as AnyInvoraDb;
}

describe('repository database-error handling (Section 21/31)', () => {
  it('maps a query failure to a DatabaseFailure Result instead of throwing', async () => {
    const db = await createTestDb();
    const repo = new SqliteBusinessRepository(withBrokenSelect(db));

    const result = await repo.getBusiness();

    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) {
      expect(result.error.kind).toBe('database');
      expect(result.error.message.length).toBeGreaterThan(0);
    }
  });

  it('never rejects the returned promise — a failing read is always a resolved Result', async () => {
    const db = await createTestDb();
    const repo = new SqliteItemRepository(withBrokenSelect(db));

    await expect(repo.getItems()).resolves.toMatchObject({ isSuccess: false });
  });
});
