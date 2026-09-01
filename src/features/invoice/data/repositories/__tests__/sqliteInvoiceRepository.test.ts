import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteInvoiceRepository } from '../sqliteInvoiceRepository';
import { SqliteBusinessRepository } from '../../../../business/data/repositories/sqliteBusinessRepository';
import { SqliteCustomerRepository } from '../../../../customer/data/repositories/sqliteCustomerRepository';
import { SqliteInvoiceTypeRepository } from '../../../../invoiceType/data/repositories/sqliteInvoiceTypeRepository';

async function seedPrerequisites(db: AnyInvoraDb) {
  const businessRepo = new SqliteBusinessRepository(db);
  const business = await businessRepo.createBusiness({
    name: 'Test Co',
    logoInitial: 'TC',
    logoColor: '#000',
    email: 'a@b.com',
    currencyCode: 'USD',
    invoicePrefix: 'INV-',
  });
  if (!business.isSuccess) throw new Error('business setup failed');

  const customerRepo = new SqliteCustomerRepository(db);
  const customer = await customerRepo.createCustomer({ name: 'Acme Corp' });
  if (!customer.isSuccess) throw new Error('customer setup failed');

  const typeRepo = new SqliteInvoiceTypeRepository(db);
  const type = await typeRepo.createInvoiceType({ name: 'General', enabledFields: ['quantity', 'discount', 'tax'] });
  if (!type.isSuccess) throw new Error('invoice type setup failed');

  return { businessId: business.value.id, customerId: customer.value.id, invoiceTypeId: type.value.id };
}

describe('SqliteInvoiceRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteInvoiceRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteInvoiceRepository(db);
  });

  it('rejects a create with no line items', async () => {
    const { customerId, invoiceTypeId } = await seedPrerequisites(db);
    const result = await repo.createInvoice({
      customerId,
      invoiceTypeId,
      issueDate: '2026-01-01',
      lines: [],
    });
    expect(result.isSuccess).toBe(false);
  });

  it('computes totals, assigns the next invoice number, and snapshots line-item fields', async () => {
    const { customerId, invoiceTypeId } = await seedPrerequisites(db);

    const result = await repo.createInvoice({
      customerId,
      invoiceTypeId,
      issueDate: '2026-01-01',
      dueDate: '2099-02-01',
      lines: [
        { itemNameSnapshot: 'Widget', unitSnapshot: 'pcs', quantity: 2, unitPrice: 50, taxRate: 10 },
        { itemNameSnapshot: 'Gadget', quantity: 1, unitPrice: 20, discount: 5 },
      ],
    });

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;

    // subtotal = 2*50 + 1*20 = 120; discount = 5; tax = (100-0)*0.10 = 10; total = 120 - 5 + 10 = 125
    expect(result.value.subtotal).toBe(120);
    expect(result.value.discountTotal).toBe(5);
    expect(result.value.taxTotal).toBe(10);
    expect(result.value.total).toBe(125);
    expect(result.value.invoiceNumber).toBe('INV-1');
    expect(result.value.items).toHaveLength(2);
    expect(result.value.items[0].itemNameSnapshot).toBe('Widget');
    expect(result.value.status).toBe('unpaid');

    // A second invoice advances the business's invoice-number counter.
    const second = await repo.createInvoice({
      customerId,
      invoiceTypeId,
      issueDate: '2026-01-02',
      lines: [{ itemNameSnapshot: 'Another', quantity: 1, unitPrice: 10 }],
    });
    expect(second.isSuccess && second.value.invoiceNumber).toBe('INV-2');
  });

  it('getInvoice/getInvoices round-trip what was created', async () => {
    const { customerId, invoiceTypeId } = await seedPrerequisites(db);
    const created = await repo.createInvoice({
      customerId,
      invoiceTypeId,
      issueDate: '2026-01-01',
      lines: [{ itemNameSnapshot: 'Widget', quantity: 1, unitPrice: 10 }],
    });
    if (!created.isSuccess) throw new Error('setup failed');

    const single = await repo.getInvoice(created.value.id);
    expect(single.isSuccess && single.value.items).toHaveLength(1);

    const all = await repo.getInvoices();
    expect(all.isSuccess && all.value).toHaveLength(1);
  });

  it('fails clearly when no business profile exists yet', async () => {
    const customerRepo = new SqliteCustomerRepository(db);
    const customer = await customerRepo.createCustomer({ name: 'Acme Corp' });
    const typeRepo = new SqliteInvoiceTypeRepository(db);
    const type = await typeRepo.createInvoiceType({ name: 'General', enabledFields: [] });
    if (!customer.isSuccess || !type.isSuccess) throw new Error('setup failed');

    const result = await repo.createInvoice({
      customerId: customer.value.id,
      invoiceTypeId: type.value.id,
      issueDate: '2026-01-01',
      lines: [{ itemNameSnapshot: 'Widget', quantity: 1, unitPrice: 10 }],
    });
    expect(result.isSuccess).toBe(false);
  });
});
