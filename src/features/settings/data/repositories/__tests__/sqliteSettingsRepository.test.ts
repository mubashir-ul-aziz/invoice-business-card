import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteSettingsRepository } from '../sqliteSettingsRepository';

describe('SqliteSettingsRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteSettingsRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteSettingsRepository(db);
  });

  it('falls back to the default fixture before any row has been written', async () => {
    const result = await repo.getSettings();
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value.defaultCurrency).toBe('USD');
  });

  it('rejects an out-of-range tax rate', async () => {
    const result = await repo.updateSettings({ defaultTaxRate: 250 });
    expect(result.isSuccess).toBe(false);
  });

  it('creates the singleton row on first update, then patches it in place on subsequent ones', async () => {
    const first = await repo.updateSettings({ defaultCurrency: 'GBP' });
    expect(first.isSuccess).toBe(true);
    if (first.isSuccess) expect(first.value.defaultCurrency).toBe('GBP');

    const rows = db.all('SELECT id FROM app_settings');
    expect(rows).toHaveLength(1);

    const second = await repo.updateSettings({ defaultTaxRate: 12.5 });
    expect(second.isSuccess).toBe(true);
    if (second.isSuccess) {
      // Previous patch (currency) survives an unrelated later patch.
      expect(second.value.defaultCurrency).toBe('GBP');
      expect(second.value.defaultTaxRate).toBe(12.5);
    }

    const rowsAfter = db.all('SELECT id FROM app_settings');
    expect(rowsAfter).toHaveLength(1);
  });
});
