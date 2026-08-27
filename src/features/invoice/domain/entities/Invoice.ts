export type InvoiceStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  itemNameSnapshot: string;
  descriptionSnapshot?: string;
  unitSnapshot?: string;
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  lineTotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceTypeId: string;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  notes?: string;
  terms?: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
}
