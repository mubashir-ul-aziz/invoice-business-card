import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqlitePaymentRepository } from '../sqlitePaymentRepository';
import { SqliteInvoiceRepository } from '../../../../invoice/data/repositories/sqliteInvoiceRepository';
import { SqliteBusinessRepository } from '../../../../business/data/repositories/sqliteBusinessRepository';
import { SqliteCustomerRepository } from '../../../../customer/data/repositories/sqliteCustomerRepository';
import { SqliteInvoiceTypeRepository } from '../../../../invoiceType/data/repositories/sqliteInvoiceTypeRepository';

async function createInvoice(db: AnyInvoraDb, dueDate?: string) {
  await new SqliteBusinessRepository(db).createBusiness({
    name: 'Test Co',
    logoInitial: 'TC',
    logoColor: '#000',
    email: 'a@b.com',
    currencyCode: 'USD',
    invoicePrefix: 'INV-',
  });
  const customer = await new SqliteCustomerRepository(db).createCustomer({ name: 'Acme Corp' });
  const type = await new SqliteInvoiceTypeRepository(db).createInvoiceType({ name: 'General', enabledFields: [] });
  if (!customer.isSuccess || !type.isSuccess) throw new Error('setup failed');

  const invoice = await new SqliteInvoiceRepository(db).createInvoice({
    customerId: customer.value.id,
    invoiceTypeId: type.value.id,
    issueDate: '2020-01-01',
    dueDate,
    lines: [{ itemNameSnapshot: 'Widget', quantity: 1, unitPrice: 100 }],
  });
  if (!invoice.isSuccess) throw new Error('invoice setup failed');
  return invoice.value;
}

describe('SqlitePaymentRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqlitePaymentRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqlitePaymentRepository(db);
  });

  it('rejects a negative/zero amount and an invalid date', async () => {
    const invoice = await createInvoice(db);
    const negative = await repo.recordPayment({ invoiceId: invoice.id, amount: 0, paymentDate: '2026-01-01', method: 'cash' });
    expect(negative.isSuccess).toBe(false);

    const badDate = await repo.recordPayment({ invoiceId: invoice.id, amount: 10, paymentDate: 'not-a-date', method: 'cash' });
    expect(badDate.isSuccess).toBe(false);
  });

  it('fails for an unknown invoice', async () => {
    const result = await repo.recordPayment({ invoiceId: 'missing', amount: 10, paymentDate: '2026-01-01', method: 'cash' });
    expect(result.isSuccess).toBe(false);
  });

  it('a partial payment moves the invoice from unpaid to partial (Section 26)', async () => {
    const invoice = await createInvoice(db, '2099-01-01');
    const result = await repo.recordPayment({ invoiceId: invoice.id, amount: 40, paymentDate: '2026-01-01', method: 'cash' });
    expect(result.isSuccess).toBe(true);

    const invoiceRepo = new SqliteInvoiceRepository(db);
    const updated = await invoiceRepo.getInvoice(invoice.id);
    expect(updated.isSuccess && updated.value.status).toBe('partial');
  });

  it('paying the full remaining balance moves the invoice to paid, even split across multiple payments', async () => {
    const invoice = await createInvoice(db);
    await repo.recordPayment({ invoiceId: invoice.id, amount: 60, paymentDate: '2026-01-01', method: 'cash' });
    await repo.recordPayment({ invoiceId: invoice.id, amount: 40, paymentDate: '2026-01-02', method: 'card' });

    const invoiceRepo = new SqliteInvoiceRepository(db);
    const updated = await invoiceRepo.getInvoice(invoice.id);
    expect(updated.isSuccess && updated.value.status).toBe('paid');

    const payments = await repo.getPaymentsForInvoice(invoice.id);
    expect(payments.isSuccess && payments.value).toHaveLength(2);
  });

  it('an unpaid invoice past its due date is overdue', async () => {
    const invoice = await createInvoice(db, '2000-01-01');
    const invoiceRepo = new SqliteInvoiceRepository(db);
    const fetched = await invoiceRepo.getInvoice(invoice.id);
    // Status is fixed at creation time from the given due date (Section 26) —
    // a 2000 due date on a brand-new invoice is already overdue.
    expect(fetched.isSuccess && fetched.value.status).toBe('overdue');
  });

  it('getPayments() returns every payment across every invoice', async () => {
    const invoiceA = await createInvoice(db);
    await repo.recordPayment({ invoiceId: invoiceA.id, amount: 10, paymentDate: '2026-01-01', method: 'cash' });
    await repo.recordPayment({ invoiceId: invoiceA.id, amount: 10, paymentDate: '2026-01-02', method: 'cash' });

    const all = await repo.getPayments();
    expect(all.isSuccess && all.value).toHaveLength(2);
  });

  it('allows an overpayment, recorded as-is (Section 24)', async () => {
    const invoice = await createInvoice(db);
    const result = await repo.recordPayment({ invoiceId: invoice.id, amount: 500, paymentDate: '2026-01-01', method: 'cash' });
    expect(result.isSuccess).toBe(true);

    const invoiceRepo = new SqliteInvoiceRepository(db);
    const updated = await invoiceRepo.getInvoice(invoice.id);
    expect(updated.isSuccess && updated.value.status).toBe('paid');
  });
});
