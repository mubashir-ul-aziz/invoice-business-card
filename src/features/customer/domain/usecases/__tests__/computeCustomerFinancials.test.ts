import { computeCustomerFinancials } from '../computeCustomerFinancials';
import { Invoice } from '../../../../invoice/domain/entities/Invoice';
import { Payment } from '../../../../payment/domain/entities/Payment';

function invoice(overrides: Partial<Invoice> & { id: string; total: number; status: Invoice['status'] }): Invoice {
  return {
    invoiceNumber: `INV-${overrides.id}`,
    customerId: 'customer-1',
    invoiceTypeId: 'type-general',
    issueDate: '2026-01-01',
    subtotal: overrides.total,
    discountTotal: 0,
    taxTotal: 0,
    items: [],
    ...overrides,
  };
}

function payment(invoiceId: string, amount: number): Payment {
  return { id: `p-${invoiceId}-${amount}`, invoiceId, amount, paymentDate: '2026-01-05', method: 'cash' };
}

describe('computeCustomerFinancials (Screen 11, Sections 24-26)', () => {
  it('reports totalBilled, totalPaid, outstanding and overdue for one customer', () => {
    const invoices = [
      invoice({ id: 'a', total: 100, status: 'paid' }),
      invoice({ id: 'b', total: 200, status: 'overdue' }),
    ];
    const payments = [payment('a', 100), payment('b', 50)];

    expect(computeCustomerFinancials(invoices, payments)).toEqual({
      totalBilled: 300,
      totalPaid: 150,
      outstanding: 150,
      overdue: 150,
    });
  });

  it('is all zeros for a customer with no invoices', () => {
    expect(computeCustomerFinancials([], [])).toEqual({ totalBilled: 0, totalPaid: 0, outstanding: 0, overdue: 0 });
  });

  it('does not count a partial (not-yet-overdue) invoice toward overdue', () => {
    const invoices = [invoice({ id: 'a', total: 100, status: 'partial' })];
    const payments = [payment('a', 40)];
    const financials = computeCustomerFinancials(invoices, payments);
    expect(financials.outstanding).toBe(60);
    expect(financials.overdue).toBe(0);
  });
});
