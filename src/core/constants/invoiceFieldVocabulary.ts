/**
 * Fixed vocabulary of line-item fields an InvoiceType can enable
 * (Section 27). The Create Invoice — Items and Create/Edit Item screens both
 * read this list (via an InvoiceType's `enabledFields`) to decide which
 * inputs to render, instead of hard-coding field sets per screen.
 */
export const INVOICE_FIELD_VOCABULARY = [
  'quantity',
  'unit',
  'weight',
  'length',
  'width',
  'height',
  'discount',
  'tax',
] as const;

export type InvoiceFieldKey = (typeof INVOICE_FIELD_VOCABULARY)[number];

export const INVOICE_FIELD_LABELS: Record<InvoiceFieldKey, string> = {
  quantity: 'Quantity',
  unit: 'Unit',
  weight: 'Weight',
  length: 'Length',
  width: 'Width',
  height: 'Height',
  discount: 'Discount',
  tax: 'Tax',
};
