import { Invoice, InvoiceItem } from '../../../domain/entities/Invoice';
import { computeInvoiceTotals, computeLineTotal, deriveInvoiceStatus, InvoiceItemInput } from '../../../../../core/utils/invoiceCalculations';
import { totalPaidForInvoice } from '../../../../../core/utils/customerBalance';
import { mockPayments } from '../../../../payment/data/datasources/mock/mockPayments';
import { mockBusiness } from '../../../../business/data/datasources/mock/mockBusiness';
import { generateId } from '../../../../../core/utils/idGenerator';

/** "Now" is pinned so overdue/unpaid status derivation is stable across renders in this mock phase. */
export const MOCK_TODAY = new Date('2026-08-27');

interface RawLine extends InvoiceItemInput {
  itemNameSnapshot: string;
  descriptionSnapshot?: string;
  unitSnapshot?: string;
}

interface RawInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceTypeId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  lines: RawLine[];
}

function buildInvoice(raw: RawInvoice): Invoice {
  const totals = computeInvoiceTotals(raw.lines);
  const items: InvoiceItem[] = raw.lines.map((line, index) => ({
    id: `${raw.id}-line-${index + 1}`,
    invoiceId: raw.id,
    itemNameSnapshot: line.itemNameSnapshot,
    descriptionSnapshot: line.descriptionSnapshot,
    unitSnapshot: line.unitSnapshot,
    quantity: line.quantity,
    weight: line.weight,
    length: line.length,
    width: line.width,
    height: line.height,
    unitPrice: line.unitPrice,
    discount: line.discount,
    taxRate: line.taxRate,
    lineTotal: computeLineTotal(line),
  }));
  const totalPaid = totalPaidForInvoice(raw.id, mockPayments);
  return {
    id: raw.id,
    invoiceNumber: raw.invoiceNumber,
    customerId: raw.customerId,
    invoiceTypeId: raw.invoiceTypeId,
    issueDate: raw.issueDate,
    dueDate: raw.dueDate,
    subtotal: totals.subtotal,
    discountTotal: totals.discountTotal,
    taxTotal: totals.taxTotal,
    total: totals.total,
    notes: raw.notes,
    terms: raw.terms,
    status: deriveInvoiceStatus(totals.total, totalPaid, raw.dueDate, MOCK_TODAY),
    items,
  };
}

const rawInvoices: RawInvoice[] = [
  {
    id: 'inv-1001', invoiceNumber: 'INV-1001', customerId: 'cust-1', invoiceTypeId: 'type-quantity',
    issueDate: '2026-05-20', dueDate: '2026-06-19', terms: 'Net 30',
    lines: [
      { itemNameSnapshot: 'Steel Brackets (Box of 50)', unitSnapshot: 'box', quantity: 12, unitPrice: 64.5, taxRate: 6.25, discount: 20 },
      { itemNameSnapshot: 'Packing Foam Rolls', unitSnapshot: 'roll', quantity: 8, unitPrice: 38, taxRate: 6.25 },
    ],
  },
  {
    id: 'inv-1002', invoiceNumber: 'INV-1002', customerId: 'cust-2', invoiceTypeId: 'type-general',
    issueDate: '2026-06-01', dueDate: '2026-07-01', terms: 'Net 30',
    lines: [{ itemNameSnapshot: 'LED Panel Light', unitSnapshot: 'pcs', quantity: 15, unitPrice: 42.75, taxRate: 8.25 }],
  },
  {
    id: 'inv-1003', invoiceNumber: 'INV-1003', customerId: 'cust-3', invoiceTypeId: 'type-weight',
    issueDate: '2026-06-10', dueDate: '2026-07-10',
    lines: [{ itemNameSnapshot: 'Recycled Steel Scrap', unitSnapshot: 'kg', weight: 1800, unitPrice: 0.9 }],
  },
  {
    id: 'inv-1004', invoiceNumber: 'INV-1004', customerId: 'cust-4', invoiceTypeId: 'type-general',
    issueDate: '2026-06-25', dueDate: '2026-07-25', terms: 'Net 30',
    lines: [
      { itemNameSnapshot: 'Office Desk Chair', unitSnapshot: 'pcs', quantity: 6, unitPrice: 189, taxRate: 8.25 },
      { itemNameSnapshot: 'Conference Table (8ft)', unitSnapshot: 'pcs', quantity: 1, unitPrice: 890, taxRate: 8.25, discount: 50 },
    ],
  },
  {
    id: 'inv-1005', invoiceNumber: 'INV-1005', customerId: 'cust-5', invoiceTypeId: 'type-dimension',
    issueDate: '2026-07-01', dueDate: '2026-07-31',
    lines: [{ itemNameSnapshot: 'Custom Crate', unitSnapshot: 'unit', quantity: 4, length: 4, width: 3, height: 3, unitPrice: 120, taxRate: 6.25 }],
  },
  {
    id: 'inv-1006', invoiceNumber: 'INV-1006', customerId: 'cust-6', invoiceTypeId: 'type-service-hours',
    issueDate: '2026-07-05', dueDate: '2026-08-04', terms: 'Net 30',
    lines: [{ itemNameSnapshot: 'Project Management (Weekly)', unitSnapshot: 'wk', quantity: 2, unitPrice: 950, taxRate: 8, discount: 100 }],
  },
  {
    id: 'inv-1007', invoiceNumber: 'INV-1007', customerId: 'cust-7', invoiceTypeId: 'type-quantity',
    issueDate: '2026-07-08', dueDate: '2026-08-07',
    lines: [{ itemNameSnapshot: 'HVAC Filter (MERV 13)', unitSnapshot: 'pcs', quantity: 40, unitPrice: 12.5, taxRate: 8.25 }],
  },
  {
    id: 'inv-1008', invoiceNumber: 'INV-1008', customerId: 'cust-8', invoiceTypeId: 'type-general',
    issueDate: '2026-07-12', dueDate: '2026-08-11',
    lines: [{ itemNameSnapshot: 'Office Desk Chair', unitSnapshot: 'pcs', quantity: 20, unitPrice: 189, taxRate: 8.25, discount: 150 }],
  },
  {
    id: 'inv-1009', invoiceNumber: 'INV-1009', customerId: 'cust-9', invoiceTypeId: 'type-dimension',
    issueDate: '2026-07-15', dueDate: '2026-08-14',
    lines: [{ itemNameSnapshot: 'Oak Plywood Sheet', unitSnapshot: 'sheet', quantity: 10, length: 8, width: 4, height: 0.06, unitPrice: 54, taxRate: 6.25 }],
  },
  {
    id: 'inv-1010', invoiceNumber: 'INV-1010', customerId: 'cust-1', invoiceTypeId: 'type-service-hours',
    issueDate: '2026-07-18', dueDate: '2026-08-17', terms: 'Net 30',
    lines: [{ itemNameSnapshot: 'Consulting Session', unitSnapshot: 'hr', quantity: 6, unitPrice: 175, taxRate: 8 }],
  },
  {
    id: 'inv-1011', invoiceNumber: 'INV-1011', customerId: 'cust-2', invoiceTypeId: 'type-weight',
    issueDate: '2026-07-22', dueDate: '2026-08-21',
    lines: [{ itemNameSnapshot: 'Bulk Aggregate (Gravel)', unitSnapshot: 'kg', weight: 5200, unitPrice: 0.42 }],
  },
  {
    id: 'inv-1012', invoiceNumber: 'INV-1012', customerId: 'cust-3', invoiceTypeId: 'type-general',
    issueDate: '2026-07-25', dueDate: '2026-08-24',
    lines: [{ itemNameSnapshot: 'Conference Table (8ft)', unitSnapshot: 'pcs', quantity: 2, unitPrice: 890, taxRate: 8.25 }],
  },
  {
    id: 'inv-1013', invoiceNumber: 'INV-1013', customerId: 'cust-4', invoiceTypeId: 'type-quantity',
    issueDate: '2026-08-01', dueDate: '2026-08-31',
    lines: [{ itemNameSnapshot: 'Steel Brackets (Box of 50)', unitSnapshot: 'box', quantity: 30, unitPrice: 64.5, taxRate: 6.25, discount: 60 }],
  },
  {
    id: 'inv-1014', invoiceNumber: 'INV-1014', customerId: 'cust-5', invoiceTypeId: 'type-general',
    issueDate: '2026-08-03', dueDate: '2026-09-02',
    lines: [
      { itemNameSnapshot: 'LED Panel Light', unitSnapshot: 'pcs', quantity: 25, unitPrice: 42.75, taxRate: 8.25 },
      { itemNameSnapshot: 'HVAC Filter (MERV 13)', unitSnapshot: 'pcs', quantity: 12, unitPrice: 12.5, taxRate: 8.25 },
    ],
  },
  {
    id: 'inv-1015', invoiceNumber: 'INV-1015', customerId: 'cust-6', invoiceTypeId: 'type-dimension',
    issueDate: '2026-08-08', dueDate: '2026-09-07',
    lines: [{ itemNameSnapshot: 'Custom Crate', unitSnapshot: 'unit', quantity: 2, length: 4, width: 3, height: 3, unitPrice: 120, taxRate: 6.25 }],
  },
  {
    id: 'inv-1016', invoiceNumber: 'INV-1016', customerId: 'cust-7', invoiceTypeId: 'type-service-hours',
    issueDate: '2026-08-12', dueDate: '2026-09-11', terms: 'Net 30',
    lines: [{ itemNameSnapshot: 'Consulting Session', unitSnapshot: 'hr', quantity: 10, unitPrice: 175, taxRate: 8, discount: 100 }],
  },
  {
    id: 'inv-1017', invoiceNumber: 'INV-1017', customerId: 'cust-8', invoiceTypeId: 'type-quantity',
    issueDate: '2026-08-18', dueDate: '2026-09-17',
    lines: [{ itemNameSnapshot: 'Packing Foam Rolls', unitSnapshot: 'roll', quantity: 25, unitPrice: 38, taxRate: 6.25 }],
  },
  {
    id: 'inv-1018', invoiceNumber: 'INV-1018', customerId: 'cust-9', invoiceTypeId: 'type-general',
    issueDate: '2026-08-24', dueDate: '2026-09-23',
    lines: [{ itemNameSnapshot: 'Office Desk Chair', unitSnapshot: 'pcs', quantity: 4, unitPrice: 189, taxRate: 8.25 }],
  },
];

export const mockInvoices: Invoice[] = rawInvoices.map(buildInvoice);

export function getInvoiceById(id: string): Invoice | undefined {
  return mockInvoices.find((invoice) => invoice.id === id);
}

export interface CreateInvoiceInput {
  customerId: string;
  invoiceTypeId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  lines: RawLine[];
}

/**
 * Appends a new Invoice — built through the same `buildInvoice` path as the
 * seed data, so InvoiceItem snapshot fields (name/unit/etc.) are populated
 * from the draft lines at save time (Section 7's historical-integrity rule,
 * Phase 12 acceptance) — to the shared mock array, and advances
 * `Business.nextInvoiceNumber` (Section 7). This is the Invoice feature's
 * "mock repository" write path (Section 9) until a real one lands.
 */
export function createInvoiceFromDraft(input: CreateInvoiceInput): Invoice {
  const invoice = buildInvoice({
    id: generateId(),
    invoiceNumber: `${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`,
    customerId: input.customerId,
    invoiceTypeId: input.invoiceTypeId,
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    notes: input.notes,
    terms: input.terms,
    lines: input.lines,
  });
  mockInvoices.push(invoice);
  mockBusiness.nextInvoiceNumber += 1;
  return invoice;
}
