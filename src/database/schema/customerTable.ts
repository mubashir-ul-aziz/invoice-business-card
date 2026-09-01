import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

/**
 * Customer (Section 7). Balance/history are derived (Section 25), never
 * stored columns here. Indexed on `name` since Screen 9 searches the
 * catalog by name on every keystroke (Section 4 performance principle).
 */
export const customers = sqliteTable(
  'customers',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    address: text('address'),
    notes: text('notes'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('customers_name_idx').on(table.name)],
);
