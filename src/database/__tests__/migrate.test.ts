import { createTestDb } from '../testUtils';
import { runMigrations } from '../migrate';

describe('runMigrations', () => {
  it('creates every table declared in the schema', async () => {
    const db = await createTestDb();
    const tables = db
      .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")
      .map((row) => row.name)
      .sort();

    expect(tables).toEqual(
      [
        '__invora_migrations',
        'app_settings',
        'backup_logs',
        'businesses',
        'customers',
        'invoice_items',
        'invoice_types',
        'invoices',
        'items',
        'payments',
        'social_links',
      ].sort(),
    );
  });

  it('is idempotent — running twice does not error or duplicate the migration record', async () => {
    const db = await createTestDb();
    expect(() => runMigrations(db)).not.toThrow();

    const applied = db.all<{ id: string }>('SELECT id FROM __invora_migrations');
    expect(applied).toHaveLength(1);
    expect(applied[0].id).toBe('0000_init');
  });

  it('creates the expected indexes', async () => {
    const db = await createTestDb();
    const indexes = db
      .all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'")
      .map((row) => row.name)
      .sort();

    expect(indexes).toEqual(
      [
        'customers_name_idx',
        'items_name_idx',
        'items_sku_idx',
        'invoices_customer_id_idx',
        'invoices_status_idx',
        'invoices_due_date_idx',
        'invoice_items_invoice_id_idx',
        'invoice_items_item_id_idx',
        'payments_invoice_id_idx',
        'social_links_business_id_idx',
        'backup_logs_created_at_idx',
      ].sort(),
    );
  });
});
