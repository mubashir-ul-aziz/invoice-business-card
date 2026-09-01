import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { invoiceTypes } from './invoiceTypeTable';

/** Item catalog entry (Section 7). Indexed on `name`/`sku` — Screen 7 searches both on every keystroke. */
export const items = sqliteTable(
  'items',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    sku: text('sku'),
    unit: text('unit'),
    defaultPrice: real('default_price').notNull(),
    taxRate: real('tax_rate'),
    weight: real('weight'),
    length: real('length'),
    width: real('width'),
    height: real('height'),
    // Nullable FK, set null on delete — an Item survives its InvoiceType being removed.
    invoiceTypeId: text('invoice_type_id').references(() => invoiceTypes.id, { onDelete: 'set null' }),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('items_name_idx').on(table.name), index('items_sku_idx').on(table.sku)],
);
