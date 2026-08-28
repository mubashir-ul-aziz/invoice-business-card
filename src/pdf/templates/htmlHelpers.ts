import { formatCurrency } from '../../core/utils/currencyFormatter';
import { formatDate } from '../../core/utils/dateFormatter';
import { PdfInvoiceData, PdfInvoiceLine } from '../types';

/** Escapes user-entered text (names, addresses, notes) before it is interpolated into template HTML. */
export function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Renders `\n`-separated free text (notes/terms/address) as safe, line-broken HTML. */
export function escapeMultiline(value: string | undefined): string {
  return escapeHtml(value).replace(/\n/g, '<br/>');
}

export function money(amount: number, currencyCode: string): string {
  return escapeHtml(formatCurrency(amount, currencyCode));
}

export function niceDate(iso: string | undefined): string {
  if (!iso) return '—';
  return escapeHtml(formatDate(new Date(iso)));
}

const STATUS_LABELS: Record<PdfInvoiceData['status'], string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
};

export function statusLabel(status: PdfInvoiceData['status']): string {
  return STATUS_LABELS[status];
}

/**
 * Per-line display fields every template needs, computed once here so
 * Classic/Modern/Compact can never disagree on how a line's numbers are
 * formatted (Section 28's "shared data model" requirement).
 */
export interface PreparedLine {
  name: string;
  description: string;
  quantityLabel: string;
  unitPriceLabel: string;
  discountLabel: string;
  taxLabel: string;
  totalLabel: string;
}

export function prepareLines(lines: PdfInvoiceLine[], currencyCode: string): PreparedLine[] {
  return lines.map((line) => ({
    name: escapeHtml(line.itemNameSnapshot),
    description: escapeHtml(line.descriptionSnapshot),
    quantityLabel: escapeHtml(line.quantityLabel),
    unitPriceLabel: money(line.unitPrice, currencyCode),
    discountLabel: line.discount ? `-${money(line.discount, currencyCode)}` : '—',
    taxLabel: line.taxRate ? `${line.taxRate}%` : '—',
    totalLabel: money(line.lineTotal, currencyCode),
  }));
}

/** Font stack shared by every template: no custom font is embedded/fetched, keeping PDF generation fully offline (Section 4/28). */
export const PDF_FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Shared `@page`/reset rules so every template starts from the same baseline (Letter size, no default UA margins). */
export const PDF_BASE_RESET = `
  * { box-sizing: border-box; }
  @page { margin: 0; }
  html, body { margin: 0; padding: 0; }
  body { font-family: ${PDF_FONT_STACK}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  table { border-collapse: collapse; width: 100%; }
`;
