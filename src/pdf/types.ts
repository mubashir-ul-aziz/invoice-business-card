import { InvoiceStatus } from '../features/invoice/domain/entities/Invoice';

/**
 * PDF layer's own input model (Section 28): plain data, no domain/repository
 * imports. `invoicePdfBuilder.ts` maps `Invoice + Business + Customer` into
 * this shape once; every template renders from it so adding a template never
 * touches invoice logic and no template can drift from another on what data
 * it has access to.
 *
 * Every field here is a direct copy of what is already stored on the saved
 * Invoice/InvoiceItem (snapshots included) — nothing is recalculated for
 * display, so the PDF can never disagree with the invoice record it was
 * generated from (historical-integrity rule, Section 7).
 */
export interface PdfBusinessInfo {
  name: string;
  logoInitial: string;
  logoColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxNumber?: string;
}

export interface PdfCustomerInfo {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface PdfInvoiceLine {
  itemNameSnapshot: string;
  descriptionSnapshot?: string;
  /** Pre-formatted "12 pcs" / "1800 kg" / "4×3×3 ft" via `describeInvoiceLineQuantity`, so no template recomputes it. */
  quantityLabel: string;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineTotal: number;
}

export interface PdfInvoiceData {
  invoiceNumber: string;
  status: InvoiceStatus;
  /** ISO date strings, exactly as stored on the Invoice. */
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  totalPaid: number;
  currencyCode: string;
  business: PdfBusinessInfo;
  customer: PdfCustomerInfo;
  lines: PdfInvoiceLine[];
}

export type InvoiceTemplateId = 'classic' | 'modern' | 'compact';

export interface InvoiceTemplateDefinition {
  id: InvoiceTemplateId;
  name: string;
  description: string;
  render: (data: PdfInvoiceData) => string;
}
