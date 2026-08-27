import { Invoice } from '../../../invoice/domain/entities/Invoice';
import { Payment } from '../../../payment/domain/entities/Payment';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { roundMoney } from '../../../../core/utils/currencyFormatter';

export interface DashboardSummary {
  totalSales: number;
  totalPaid: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
}

/**
 * Dashboard aggregation lives in a use-case (not inline in the component
 * tree) so swapping the mock invoice source for a real repository later is a
 * one-line change (Phase 3 acceptance criteria).
 */
export function computeDashboardSummary(invoices: Invoice[], payments: Payment[]): DashboardSummary {
  let totalSales = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;
  let totalOverdue = 0;

  for (const invoice of invoices) {
    totalSales += invoice.total;
    const paid = totalPaidForInvoice(invoice.id, payments);
    totalPaid += paid;
    const remaining = invoice.total - paid;
    if (remaining > 0) {
      totalOutstanding += remaining;
      if (invoice.status === 'overdue') totalOverdue += remaining;
    }
  }

  return {
    totalSales: roundMoney(totalSales),
    totalPaid: roundMoney(totalPaid),
    totalOutstanding: roundMoney(totalOutstanding),
    totalOverdue: roundMoney(totalOverdue),
    invoiceCount: invoices.length,
  };
}
