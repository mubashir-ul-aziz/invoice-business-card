import { computeCustomerBalance, totalPaidForInvoice } from '../customerBalance';
import { Invoice } from '../../../features/invoice/domain/entities/Invoice';
import { Payment } from '../../../features/payment/domain/entities/Payment';

function invoice(overrides: Partial<Invoice> & { id: string; total: number }): Invoice {
  return {
    invoiceNumber: `INV-${overrides.id}`,
    customerId: 'customer-1',
    invoiceTypeId: 'type-general',
    issueDate: '2026-01-01',
    subtotal: overrides.total,
    discountTotal: 0,
    taxTotal: 0,
    status: 'unpaid',
    items: [],
    ...overrides,
  };
}

function payment(overrides: Partial<Payment> & { invoiceId: string; amount: number }): Payment {
  return {
    id: `payment-${overrides.invoiceId}-${overrides.amount}`,
    paymentDate: '2026-01-05',
    method: 'cash',
    ...overrides,
  };
}

describe('computeCustomerBalance (Section 25)', () => {
  it('is sum(invoice.total) - sum(payment.amount) across the customer\'s invoices', () => {
    const invoices = [invoice({ id: 'a', total: 100 }), invoice({ id: 'b', total: 50 })];
    const payments = [payment({ invoiceId: 'a', amount: 40 }), payment({ invoiceId: 'b', amount: 50 })];
    expect(computeCustomerBalance(invoices, payments)).toBe(60);
  });

  it('ignores payments on invoices that do not belong to this customer\'s invoice list', () => {
    const invoices = [invoice({ id: 'a', total: 100 })];
    const payments = [payment({ invoiceId: 'unrelated-invoice', amount: 999 })];
    expect(computeCustomerBalance(invoices, payments)).toBe(100);
  });

  it('is 0 for a fully-paid customer', () => {
    const invoices = [invoice({ id: 'a', total: 100 })];
    const payments = [payment({ invoiceId: 'a', amount: 100 })];
    expect(computeCustomerBalance(invoices, payments)).toBe(0);
  });

  it('goes negative on overpayment (no automatic refund logic, Section 24)', () => {
    const invoices = [invoice({ id: 'a', total: 100 })];
    const payments = [payment({ invoiceId: 'a', amount: 130 })];
    expect(computeCustomerBalance(invoices, payments)).toBe(-30);
  });

  it('is 0 for a customer with no invoices', () => {
    expect(computeCustomerBalance([], [])).toBe(0);
  });
});

describe('totalPaidForInvoice (Section 24)', () => {
  it('sums every payment for that invoice, ignoring others', () => {
    const payments = [
      payment({ invoiceId: 'a', amount: 30 }),
      payment({ invoiceId: 'a', amount: 20 }),
      payment({ invoiceId: 'b', amount: 999 }),
    ];
    expect(totalPaidForInvoice('a', payments)).toBe(50);
  });

  it('is 0 when there are no payments for the invoice', () => {
    expect(totalPaidForInvoice('a', [])).toBe(0);
  });
});
