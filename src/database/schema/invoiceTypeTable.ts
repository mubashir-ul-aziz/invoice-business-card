import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

/**
 * InvoiceType (Section 7, 27). `enabledFields` is a JSON-serialized array of
 * `InvoiceFieldKey` values (the fixed vocabulary in
 * `core/constants/invoiceFieldVocabulary.ts`) — SQLite has no native array
 * type, so it round-trips through `JSON.stringify`/`JSON.parse` in the
 * repository layer, same convention as other JSON-shaped columns below.
 */
export const invoiceTypes = sqliteTable('invoice_types', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  isSystemDefined: integer('is_system_defined', { mode: 'boolean' }).notNull().default(false),
  enabledFields: text('enabled_fields').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});
