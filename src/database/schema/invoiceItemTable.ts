import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { invoices } from './invoiceTable';
import { items } from './itemTable';

/**
 * InvoiceItem (Section 7). Historical-integrity rule: every descriptive
 * field is a snapshot copied at creation time (`*Snapshot` columns) — an
 * InvoiceItem never re-reads live Item data for display, so later
 * edits/renames/deletes of an Item never alter a saved invoice. `itemId` is
 * nullable and `onDelete: 'set null'` for exactly that reason.
 */
export const invoiceItems = sqliteTable(
  'invoice_items',
  {
    id: text('id').primaryKey(),
    invoiceId: text('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
    itemId: text('item_id').references(() => items.id, { onDelete: 'set null' }),
    itemNameSnapshot: text('item_name_snapshot').notNull(),
    itemDescriptionSnapshot: text('item_description_snapshot'),
    itemSkuSnapshot: text('item_sku_snapshot'),
    unitSnapshot: text('unit_snapshot'),
    quantity: real('quantity'),
    weight: real('weight'),
    length: real('length'),
    width: real('width'),
    height: real('height'),
    unitPrice: real('unit_price').notNull(),
    discount: real('discount'),
    taxRate: real('tax_rate'),
    lineTotal: real('line_total').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('invoice_items_invoice_id_idx').on(table.invoiceId), index('invoice_items_item_id_idx').on(table.itemId)],
);
