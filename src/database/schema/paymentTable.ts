import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { invoices } from './invoiceTable';

/**
 * Payment (Section 7, 24). Always a separate, standalone record — never a
 * denormalized field on Invoice. `Invoice.status`/remaining balance are
 * always derived by summing rows here (Section 24/26), never trusted from a
 * cached `amountPaid`-style column.
 */
export const payments = sqliteTable(
  'payments',
  {
    id: text('id').primaryKey(),
    invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    amount: real('amount').notNull(),
    paymentDate: text('payment_date').notNull(),
    method: text('method', { enum: ['cash', 'bank_transfer', 'card', 'paypal', 'other'] }).notNull(),
    reference: text('reference'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('payments_invoice_id_idx').on(table.invoiceId)],
);
