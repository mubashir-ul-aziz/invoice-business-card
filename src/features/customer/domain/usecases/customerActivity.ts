import { Invoice } from '../../../invoice/domain/entities/Invoice';
import { Payment } from '../../../payment/domain/entities/Payment';
import { computeCustomerBalance } from '../../../../core/utils/customerBalance';

/**
 * Per-customer activity summary for the Customers List row (Screen 9,
 * Section 16: "Display: Invoice count, Outstanding balance"). A placeholder
 * computed-balance use-case over mock Invoice/Payment data (Phase 8
 * acceptance criteria) — the real balance derivation (Section 25) slots in
 * later without any UI change, since the screen only ever reads this shape.
 */
export interface CustomerActivity {
  invoiceCount: number;
  balance: number;
  hasOverdue: boolean;
}

export function computeCustomerActivity(customerId: string, invoices: Invoice[], payments: Payment[]): CustomerActivity {
  const customerInvoices = invoices.filter((invoice) => invoice.customerId === customerId);
  return {
    invoiceCount: customerInvoices.length,
    balance: computeCustomerBalance(customerInvoices, payments),
    hasOverdue: customerInvoices.some((invoice) => invoice.status === 'overdue'),
  };
}
