import { computeDashboardSummary } from '../computeDashboardSummary';
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

describe('computeDashboardSummary (Sections 3, 24-26)', () => {
  it('aggregates totalSales, totalPaid, outstanding, overdue and invoiceCount', () => {
    const invoices = [
      invoice({ id: 'a', total: 100, status: 'paid' }),
      invoice({ id: 'b', total: 200, status: 'partial' }),
      invoice({ id: 'c', total: 50, status: 'overdue' }),
      invoice({ id: 'd', total: 75, status: 'unpaid' }),
    ];
    const payments = [payment('a', 100), payment('b', 120)];

    const summary = computeDashboardSummary(invoices, payments);

    expect(summary.totalSales).toBe(425);
    expect(summary.totalPaid).toBe(220);
    // outstanding: b remaining 80, c remaining 50, d remaining 75 = 205
    expect(summary.totalOutstanding).toBe(205);
    // overdue: only invoice c's remaining balance
    expect(summary.totalOverdue).toBe(50);
    expect(summary.invoiceCount).toBe(4);
  });

  it('returns all zeros for an empty invoice list', () => {
    expect(computeDashboardSummary([], [])).toEqual({
      totalSales: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      invoiceCount: 0,
    });
  });

  it('never counts a fully-paid invoice toward outstanding/overdue', () => {
    const invoices = [invoice({ id: 'a', total: 100, status: 'paid' })];
    const payments = [payment('a', 100)];
    const summary = computeDashboardSummary(invoices, payments);
    expect(summary.totalOutstanding).toBe(0);
    expect(summary.totalOverdue).toBe(0);
  });
});
