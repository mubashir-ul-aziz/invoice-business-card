/**
 * Fixed vocabulary of line-item fields an InvoiceType can enable
 * (Section 27). The Create Invoice — Items and Create/Edit Item screens both
 * read this list (via an InvoiceType's `enabledFields`) to decide which
 * inputs to render, instead of hard-coding field sets per screen.
 *
 * Grouped into three sections for the Custom Invoice Type screen (Phase 6,
 * Screen 6): identity fields, pricing/calculation fields, and optional
 * physical-measurement fields. `itemName` and `unitPrice` are structural —
 * every Item always has a name and a price (Section 7) — so they're always
 * included in `enabledFields` and can't be toggled off; every other field is
 * a genuine per-invoice-type choice.
 */
export const INVOICE_FIELD_GROUPS = [
  {
    key: 'itemDetails',
    label: 'Item Details',
    fields: ['itemName', 'description', 'sku'],
  },
  {
    key: 'pricing',
    label: 'Pricing & Calculations',
    fields: ['unitPrice', 'quantity', 'discount', 'tax'],
  },
  {
    key: 'measurements',
    label: 'Measurements (Optional)',
    fields: ['unit', 'weight', 'length', 'width', 'height'],
  },
] as const;

export const INVOICE_FIELD_VOCABULARY = INVOICE_FIELD_GROUPS.flatMap((group) => group.fields);

export type InvoiceFieldKey = (typeof INVOICE_FIELD_VOCABULARY)[number];

/** Structural fields every Item has regardless of invoice type — locked "on" wherever fields are toggled. */
export const REQUIRED_INVOICE_FIELDS: InvoiceFieldKey[] = ['itemName', 'unitPrice'];

export const INVOICE_FIELD_LABELS: Record<InvoiceFieldKey, string> = {
  itemName: 'Item Name',
  description: 'Description',
  sku: 'SKU / Code',
  unitPrice: 'Unit Price',
  quantity: 'Quantity',
  discount: 'Discount',
  tax: 'Tax',
  unit: 'Unit',
  weight: 'Weight',
  length: 'Length',
  width: 'Width',
  height: 'Height',
};

/** Short hint shown under each field row on the Custom Invoice Type screen. */
export const INVOICE_FIELD_HINTS: Record<InvoiceFieldKey, string> = {
  itemName: 'Always collected',
  description: 'Additional details about the item',
  sku: 'Stock keeping unit or product code',
  unitPrice: 'Always collected',
  quantity: 'How many units are on the line',
  discount: 'Percentage or flat amount off the line',
  tax: 'Apply a tax rate to the line',
  unit: 'e.g. hrs, kg, boxes',
  weight: 'Priced or shown by weight',
  length: 'Used for freight/material items',
  width: 'Used for freight/material items',
  height: 'Used for freight/material items',
};
