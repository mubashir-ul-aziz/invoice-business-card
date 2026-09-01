import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { invoiceTypes } from './invoiceTypeTable';

/**
 * Business profile (Section 7). MVP is single-business, so this table is
 * expected to hold at most one row, but it is not modeled as a hard
 * singleton at the schema level — `SqliteBusinessRepository` enforces that
 * by updating the existing row instead of inserting a second one.
 */
export const businesses = sqliteTable('businesses', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  logoInitial: text('logo_initial').notNull(),
  logoColor: text('logo_color').notNull(),
  address: text('address'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  currencyCode: text('currency_code').notNull(),
  taxNumber: text('tax_number'),
  invoicePrefix: text('invoice_prefix').notNull(),
  nextInvoiceNumber: integer('next_invoice_number').notNull().default(1),
  // Nullable FK, set null on delete (Section 8: InvoiceType 1--* Invoice; a
  // deleted default type must never take the Business row down with it).
  defaultInvoiceTypeId: text('default_invoice_type_id').references(() => invoiceTypes.id, { onDelete: 'set null' }),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
