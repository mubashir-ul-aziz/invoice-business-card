import { Invoice } from '../../../invoice/domain/entities/Invoice';

export interface MonthOption {
  /** "YYYY-MM", stable sort/compare key. */
  key: string;
  /** "August 2026" — display label for the month selector. */
  label: string;
  year: number;
  month: number;
}

const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function monthKeyFor(isoDate: string): string {
  const date = new Date(isoDate);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Distinct months present in the invoice list, most recent first. Drives the
 * dashboard's month selector without hard-coding a calendar range — as new
 * invoices are issued (or once this reads a real repository) the list grows
 * on its own.
 */
export function getInvoiceMonthOptions(invoices: Invoice[]): MonthOption[] {
  const byKey = new Map<string, MonthOption>();
  for (const invoice of invoices) {
    const key = monthKeyFor(invoice.issueDate);
    if (byKey.has(key)) continue;
    const date = new Date(invoice.issueDate);
    byKey.set(key, { key, label: `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`, year: date.getFullYear(), month: date.getMonth() });
  }
  return Array.from(byKey.values()).sort((a, b) => (a.key < b.key ? 1 : -1));
}

/** Invoices issued within the given "YYYY-MM" month key (Phase 3: Month selector). */
export function filterInvoicesByMonth(invoices: Invoice[], monthKey: string): Invoice[] {
  return invoices.filter((invoice) => monthKeyFor(invoice.issueDate) === monthKey);
}
