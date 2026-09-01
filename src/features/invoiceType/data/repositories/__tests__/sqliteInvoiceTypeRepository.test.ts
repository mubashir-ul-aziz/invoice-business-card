import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteInvoiceTypeRepository } from '../sqliteInvoiceTypeRepository';
import { SqliteBusinessRepository } from '../../../../business/data/repositories/sqliteBusinessRepository';

describe('SqliteInvoiceTypeRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteInvoiceTypeRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteInvoiceTypeRepository(db);
  });

  it('starts empty and with no selected type', async () => {
    const types = await repo.getInvoiceTypes();
    expect(types.isSuccess && types.value).toEqual([]);
    const selected = await repo.getSelectedInvoiceTypeId();
    expect(selected.isSuccess && selected.value).toBeNull();
  });

  it('creates a custom invoice type that always includes the structural fields (itemName, unitPrice)', async () => {
    const result = await repo.createInvoiceType({ name: 'Rental', enabledFields: ['quantity'] });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.value.isSystemDefined).toBe(false);
    expect(result.value.enabledFields).toEqual(expect.arrayContaining(['itemName', 'unitPrice', 'quantity']));
  });

  it('rejects creating a type with a blank name', async () => {
    const result = await repo.createInvoiceType({ name: '  ', enabledFields: [] });
    expect(result.isSuccess).toBe(false);
  });

  it('selectInvoiceType fails for an unknown id, and persists the selection onto the business row when one exists', async () => {
    const missing = await repo.selectInvoiceType('does-not-exist');
    expect(missing.isSuccess).toBe(false);

    const created = await repo.createInvoiceType({ name: 'Custom', enabledFields: [] });
    if (!created.isSuccess) throw new Error('setup failed');

    const businessRepo = new SqliteBusinessRepository(db);
    await businessRepo.createBusiness({
      name: 'Test Co',
      logoInitial: 'TC',
      logoColor: '#000',
      email: 'a@b.com',
      currencyCode: 'USD',
      invoicePrefix: 'INV-',
    });

    const selected = await repo.selectInvoiceType(created.value.id);
    expect(selected.isSuccess && selected.value).toBe(created.value.id);

    const readBack = await repo.getSelectedInvoiceTypeId();
    expect(readBack.isSuccess && readBack.value).toBe(created.value.id);
  });
});
