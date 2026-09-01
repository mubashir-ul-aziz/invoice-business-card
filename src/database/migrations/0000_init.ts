/**
 * Initial schema migration — creates every table in `src/database/schema`
 * plus their indexes (Section 6). Hand-authored (rather than a raw
 * `drizzle-kit generate` SQL file loaded at runtime) so it needs no extra
 * Metro/babel asset-loading configuration to ship inside the Expo bundle;
 * the statements below are kept in exact 1:1 correspondence with the
 * `sqliteTable()` definitions they create — any schema change must add a
 * new numbered migration here, never edit this file in place (Section:
 * "Safe migrations").
 */
export const MIGRATION_0000_INIT = {
  id: '0000_init',
  statements: [
    `CREATE TABLE IF NOT EXISTS invoice_types (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      is_system_defined INTEGER NOT NULL DEFAULT 0,
      enabled_fields TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      logo_initial TEXT NOT NULL,
      logo_color TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      currency_code TEXT NOT NULL,
      tax_number TEXT,
      invoice_prefix TEXT NOT NULL,
      next_invoice_number INTEGER NOT NULL DEFAULT 1,
      default_invoice_type_id TEXT REFERENCES invoice_types(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      address TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS customers_name_idx ON customers(name)`,
    `CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT,
      unit TEXT,
      default_price REAL NOT NULL,
      tax_rate REAL,
      weight REAL,
      length REAL,
      width REAL,
      height REAL,
      invoice_type_id TEXT REFERENCES invoice_types(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS items_name_idx ON items(name)`,
    `CREATE INDEX IF NOT EXISTS items_sku_idx ON items(sku)`,
    `CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
      invoice_type_id TEXT NOT NULL REFERENCES invoice_types(id) ON DELETE RESTRICT,
      issue_date TEXT NOT NULL,
      due_date TEXT,
      subtotal REAL NOT NULL,
      discount_total REAL NOT NULL,
      tax_total REAL NOT NULL,
      total REAL NOT NULL,
      notes TEXT,
      terms TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS invoices_customer_id_idx ON invoices(customer_id)`,
    `CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status)`,
    `CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices(due_date)`,
    `CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      item_id TEXT REFERENCES items(id) ON DELETE SET NULL,
      item_name_snapshot TEXT NOT NULL,
      item_description_snapshot TEXT,
      item_sku_snapshot TEXT,
      unit_snapshot TEXT,
      quantity REAL,
      weight REAL,
      length REAL,
      width REAL,
      height REAL,
      unit_price REAL NOT NULL,
      discount REAL,
      tax_rate REAL,
      line_total REAL NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS invoice_items_invoice_id_idx ON invoice_items(invoice_id)`,
    `CREATE INDEX IF NOT EXISTS invoice_items_item_id_idx ON invoice_items(item_id)`,
    `CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY NOT NULL,
      invoice_id TEXT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      method TEXT NOT NULL,
      reference TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS payments_invoice_id_idx ON payments(invoice_id)`,
    `CREATE TABLE IF NOT EXISTS social_links (
      id TEXT PRIMARY KEY NOT NULL,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      url TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS social_links_business_id_idx ON social_links(business_id)`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY NOT NULL,
      default_currency TEXT NOT NULL,
      default_tax_rate REAL,
      default_payment_terms_days INTEGER NOT NULL,
      invoice_template_id TEXT NOT NULL,
      backup_frequency TEXT NOT NULL,
      last_backup_at TEXT,
      cloud_backup_enabled INTEGER NOT NULL DEFAULT 0,
      app_lock_enabled INTEGER NOT NULL DEFAULT 0,
      biometric_unlock_enabled INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS backup_logs (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      direction TEXT NOT NULL,
      status TEXT NOT NULL,
      file_name TEXT,
      size_bytes INTEGER,
      error_message TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE INDEX IF NOT EXISTS backup_logs_created_at_idx ON backup_logs(created_at)`,
  ],
};
