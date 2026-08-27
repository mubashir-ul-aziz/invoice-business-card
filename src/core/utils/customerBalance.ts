import { roundMoney } from './currencyFormatter';
import { Invoice } from '../../features/invoice/domain/entities/Invoice';
import { Payment } from '../../features/payment/domain/entities/Payment';

/** customerBalance = sum(Invoice.total) - sum(Payment.amount) for that customer's invoices (Section 25). */
export function computeCustomerBalance(invoices: Invoice[], payments: Payment[]): number {
  const invoiceTotal = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const invoiceIds = new Set(invoices.map((invoice) => invoice.id));
  const paid = payments
    .filter((payment) => invoiceIds.has(payment.invoiceId))
    .reduce((sum, payment) => sum + payment.amount, 0);
  return roundMoney(invoiceTotal - paid);
}

export function totalPaidForInvoice(invoiceId: string, payments: Payment[]): number {
  return roundMoney(payments.filter((p) => p.invoiceId === invoiceId).reduce((sum, p) => sum + p.amount, 0));
}
