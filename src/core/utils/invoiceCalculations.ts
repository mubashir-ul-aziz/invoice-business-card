import { roundMoney } from './currencyFormatter';
import { InvoiceStatus } from '../../features/invoice/domain/entities/Invoice';

/** Line-item input before its computed lineTotal is attached (Section 23). */
export interface InvoiceItemInput {
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

/**
 * quantity-or-equivalent depends on invoice type: plain quantity for
 * General/Quantity, weight for Weight, quantity*L*W*H for Dimension. Falls
 * back to 1 so General-type lines without an explicit quantity still price
 * correctly.
 */
function resolveQuantityEquivalent(item: InvoiceItemInput): number {
  if (item.length != null && item.width != null && item.height != null) {
    return (item.quantity ?? 1) * item.length * item.width * item.height;
  }
  if (item.weight != null) return item.weight;
  return item.quantity ?? 1;
}

export function computeLineTotal(item: InvoiceItemInput): number {
  const lineSubtotal = resolveQuantityEquivalent(item) * item.unitPrice;
  const lineDiscount = item.discount ?? 0;
  const lineTaxable = lineSubtotal - lineDiscount;
  const lineTax = lineTaxable * ((item.taxRate ?? 0) / 100);
  return roundMoney(lineTaxable + lineTax);
}

export interface InvoiceTotals {
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
}

/** Sums line items into invoice-level totals (Section 23) — never done ad hoc per screen. */
export function computeInvoiceTotals(items: InvoiceItemInput[]): InvoiceTotals {
  let subtotal = 0;
  let discountTotal = 0;
  let taxTotal = 0;
  for (const item of items) {
    const qtyEquivalent = resolveQuantityEquivalent(item);
    const lineSubtotal = qtyEquivalent * item.unitPrice;
    const lineDiscount = item.discount ?? 0;
    const lineTaxable = lineSubtotal - lineDiscount;
    const lineTax = lineTaxable * ((item.taxRate ?? 0) / 100);
    subtotal += lineSubtotal;
    discountTotal += lineDiscount;
    taxTotal += lineTax;
  }
  const total = subtotal - discountTotal + taxTotal;
  return {
    subtotal: roundMoney(subtotal),
    discountTotal: roundMoney(discountTotal),
    taxTotal: roundMoney(taxTotal),
    total: roundMoney(total),
  };
}

/**
 * Human-readable "how many × unit" line shown under an item's name on
 * Invoice Review/Detail (Section 16, Screens 16/17) — handles the
 * quantity/weight/dimension variants the same way `resolveQuantityEquivalent`
 * does, so the two screens never diverge on how a line reads.
 */
export function describeInvoiceLineQuantity(item: InvoiceItemInput & { unitSnapshot?: string }): string {
  if (item.length != null && item.width != null && item.height != null) {
    const qtyPrefix = item.quantity != null && item.quantity !== 1 ? `${item.quantity} × ` : '';
    return `${qtyPrefix}${item.length}×${item.width}×${item.height} ${item.unitSnapshot ?? ''}`.trim();
  }
  if (item.weight != null) {
    return `${item.weight} ${item.unitSnapshot ?? 'kg'}`;
  }
  if (item.quantity != null) {
    return `${item.quantity} ${item.unitSnapshot ?? ''}`.trim();
  }
  return item.unitSnapshot ?? '1 unit';
}

/** Derives invoice status from payments and due date — never manually set (Section 26). */
export function deriveInvoiceStatus(total: number, totalPaid: number, dueDate: string | undefined, now: Date = new Date()): InvoiceStatus {
  const remaining = roundMoney(total - totalPaid);
  const isPastDue = dueDate != null && new Date(dueDate).getTime() < now.getTime();

  if (totalPaid <= 0) {
    return isPastDue && remaining > 0 ? 'overdue' : 'unpaid';
  }
  if (totalPaid > 0 && remaining > 0) {
    return isPastDue ? 'overdue' : 'partial';
  }
  return 'paid';
}
