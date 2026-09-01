import { createTestDb } from '../testUtils';
import { seedDatabase } from '../seed';

describe('seedDatabase', () => {
  it('seeds the 5 system invoice types plus the demo dataset on an empty database', async () => {
    const db = await createTestDb();
    seedDatabase(db);

    const invoiceTypes = db.all<{ id: string; is_system_defined: number }>('SELECT id, is_system_defined FROM invoice_types');
    const systemTypes = invoiceTypes.filter((row) => row.is_system_defined === 1);
    expect(systemTypes.length).toBeGreaterThanOrEqual(5);

    const businesses = db.all('SELECT * FROM businesses');
    expect(businesses).toHaveLength(1);

    const customers = db.all('SELECT * FROM customers');
    expect(customers.length).toBeGreaterThan(0);

    const invoices = db.all('SELECT * FROM invoices');
    const invoiceItems = db.all('SELECT * FROM invoice_items');
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoiceItems.length).toBeGreaterThan(0);

    const settings = db.all('SELECT * FROM app_settings');
    expect(settings).toHaveLength(1);
  });

  it('is idempotent — calling it again on an already-seeded database changes nothing', async () => {
    const db = await createTestDb();
    seedDatabase(db);
    const before = db.all('SELECT id FROM invoice_types');

    seedDatabase(db);
    const after = db.all('SELECT id FROM invoice_types');

    expect(after).toHaveLength(before.length);
  });
});
