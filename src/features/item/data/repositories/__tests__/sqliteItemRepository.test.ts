import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteItemRepository } from '../sqliteItemRepository';

describe('SqliteItemRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteItemRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteItemRepository(db);
  });

  it('rejects a create with a negative price', async () => {
    const result = await repo.createItem({ name: 'Widget', defaultPrice: -5 });
    expect(result.isSuccess).toBe(false);
  });

  it('creates, lists, fetches, and updates an item', async () => {
    const created = await repo.createItem({ name: 'Widget', defaultPrice: 9.99, sku: 'W-1', taxRate: 8 });
    expect(created.isSuccess).toBe(true);
    if (!created.isSuccess) return;

    const list = await repo.getItems();
    expect(list.isSuccess && list.value).toHaveLength(1);

    const fetched = await repo.getItem(created.value.id);
    expect(fetched.isSuccess && fetched.value.sku).toBe('W-1');

    const updated = await repo.updateItem(created.value.id, { name: 'Widget Pro', defaultPrice: 12.5 });
    expect(updated.isSuccess).toBe(true);
    if (updated.isSuccess) {
      expect(updated.value.name).toBe('Widget Pro');
      expect(updated.value.defaultPrice).toBe(12.5);
    }
  });

  it('preserves optional numeric fields as undefined rather than 0 when omitted', async () => {
    const created = await repo.createItem({ name: 'Service', defaultPrice: 100 });
    expect(created.isSuccess).toBe(true);
    if (!created.isSuccess) return;
    expect(created.value.weight).toBeUndefined();
    expect(created.value.taxRate).toBeUndefined();
  });
});
