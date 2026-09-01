import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { customers } from './customerTable';
import { invoiceTypes } from './invoiceTypeTable';

/**
 * Invoice (Section 7). `status` is recalculated on every Payment write and
 * on read for date-based Overdue transitions (Section 26), but persisted
 * here for fast list/dashboard queries. Indexed on `customerId`, `status`,
 * and `dueDate` per the Section 4 performance principle — these are the
 * fields the Invoice List filters/dashboard aggregates query most.
 */
export const invoices = sqliteTable(
  'invoices',
  {
    id: text('id').primaryKey(),
    invoiceNumber: text('invoice_number').notNull().unique(),
    // Customer/InvoiceType are required on every Invoice (Section 7) — deleting
    // either while invoices reference it is blocked at the repository layer
    // (customers/items already guard against in-use deletes the same way).
    customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'restrict' }),
    invoiceTypeId: text('invoice_type_id').notNull().references(() => invoiceTypes.id, { onDelete: 'restrict' }),
    issueDate: text('issue_date').notNull(),
    dueDate: text('due_date'),
    subtotal: real('subtotal').notNull(),
    discountTotal: real('discount_total').notNull(),
    taxTotal: real('tax_total').notNull(),
    total: real('total').notNull(),
    notes: text('notes'),
    terms: text('terms'),
    status: text('status', { enum: ['unpaid', 'partial', 'paid', 'overdue'] }).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('invoices_customer_id_idx').on(table.customerId),
    index('invoices_status_idx').on(table.status),
    index('invoices_due_date_idx').on(table.dueDate),
  ],
);
