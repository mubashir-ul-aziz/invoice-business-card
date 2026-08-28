/**
 * Item catalog entry (Section 7). `invoiceTypeId` ties the item to the
 * invoice type it's intended for, which drives which of the optional
 * measurement fields (unit/weight/length/width/height) are meaningful for it
 * — resolved via the shared `resolveInvoiceTypeFields` use-case (Section 27),
 * never hard-coded per screen.
 */
export interface Item {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  defaultPrice: number;
  taxRate?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  invoiceTypeId?: string;
}
