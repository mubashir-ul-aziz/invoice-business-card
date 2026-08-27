import { InvoiceFieldKey } from '../../../../core/constants/invoiceFieldVocabulary';
import { InvoiceType } from '../entities/InvoiceType';

/**
 * Single source of truth for "which fields does this invoice type show" —
 * used by both Create/Edit Item and Create Invoice — Items so field
 * visibility never diverges between the two screens (Section 27).
 */
export function resolveInvoiceTypeFields(invoiceType: InvoiceType | undefined): Set<InvoiceFieldKey> {
  return new Set(invoiceType?.enabledFields ?? []);
}

export function invoiceTypeHasField(invoiceType: InvoiceType | undefined, field: InvoiceFieldKey): boolean {
  return resolveInvoiceTypeFields(invoiceType).has(field);
}
