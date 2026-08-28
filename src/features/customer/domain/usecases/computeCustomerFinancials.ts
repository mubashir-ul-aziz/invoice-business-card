import { Invoice } from '../../../invoice/domain/entities/Invoice';
import { Payment } from '../../../payment/domain/entities/Payment';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { roundMoney } from '../../../../core/utils/currencyFormatter';

export interface CustomerFinancials {
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
}

/**
 * Per-customer financial summary for Customer Detail (Screen 11, Phase 9):
 * total billed, total paid, outstanding, and overdue, derived from Section
 * 24/25/26 logic against that customer's invoices/payments — mirrors
 * `computeDashboardSummary` but scoped to one customer instead of the whole
 * business, so it slots into a repository-backed store later with no UI change.
 */
export function computeCustomerFinancials(invoices: Invoice[], payments: Payment[]): CustomerFinancials {
  let totalBilled = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let overdue = 0;

  for (const invoice of invoices) {
    totalBilled += invoice.total;
    const paid = totalPaidForInvoice(invoice.id, payments);
    totalPaid += paid;
    const remaining = invoice.total - paid;
    if (remaining > 0) {
      outstanding += remaining;
      if (invoice.status === 'overdue') overdue += remaining;
    }
  }

  return {
    totalBilled: roundMoney(totalBilled),
    totalPaid: roundMoney(totalPaid),
    outstanding: roundMoney(outstanding),
    overdue: roundMoney(overdue),
  };
}
