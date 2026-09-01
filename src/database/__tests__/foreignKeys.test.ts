import { createTestDb } from '../testUtils';
import { AnyInvoraDb } from '../migrate';

/**
 * Exercises the schema's FK constraints (Section 7/8) directly with raw
 * SQL — none of the current screens expose a delete action for
 * customers/items/invoices yet, so these behaviors aren't reachable through
 * a repository test, but the constraints themselves must hold.
 */
describe('foreign key constraints', () => {
  let db: AnyInvoraDb;

  beforeEach(async () => {
    db = await createTestDb();
    const now = new Date().toISOString();
    db.run(`INSERT INTO invoice_types (id, name, description, is_system_defined, enabled_fields, created_at, updated_at)
      VALUES ('type-1', 'General', 'desc', 1, '[]', '${now}', '${now}')`);
    db.run(`INSERT INTO customers (id, name, created_at, updated_at) VALUES ('cust-1', 'Acme', '${now}', '${now}')`);
    db.run(`INSERT INTO items (id, name, default_price, created_at, updated_at) VALUES ('item-1', 'Widget', 10, '${now}', '${now}')`);
    db.run(`INSERT INTO invoices (id, invoice_number, customer_id, invoice_type_id, issue_date, subtotal, discount_total, tax_total, total, status, created_at, updated_at)
      VALUES ('inv-1', 'INV-1', 'cust-1', 'type-1', '${now}', 10, 0, 0, 10, 'unpaid', '${now}', '${now}')`);
    db.run(`INSERT INTO invoice_items (id, invoice_id, item_id, item_name_snapshot, unit_price, line_total, created_at)
      VALUES ('line-1', 'inv-1', 'item-1', 'Widget', 10, 10, '${now}')`);
    db.run(`INSERT INTO payments (id, invoice_id, amount, payment_date, method, created_at)
      VALUES ('pay-1', 'inv-1', 10, '${now}', 'cash', '${now}')`);
  });

  it('deleting an invoice cascades to its invoice_items and payments', () => {
    db.run(`DELETE FROM invoices WHERE id = 'inv-1'`);
    expect(db.all(`SELECT id FROM invoice_items WHERE invoice_id = 'inv-1'`)).toHaveLength(0);
    expect(db.all(`SELECT id FROM payments WHERE invoice_id = 'inv-1'`)).toHaveLength(0);
  });

  it('deleting an Item sets InvoiceItem.item_id to null, preserving the snapshot (Section 7 historical integrity)', () => {
    db.run(`DELETE FROM items WHERE id = 'item-1'`);
    const [row] = db.all<{ item_id: string | null; item_name_snapshot: string }>(
      `SELECT item_id, item_name_snapshot FROM invoice_items WHERE id = 'line-1'`,
    );
    expect(row.item_id).toBeNull();
    expect(row.item_name_snapshot).toBe('Widget');
  });

  it('a Customer referenced by an Invoice cannot be deleted (restrict)', () => {
    expect(() => db.run(`DELETE FROM customers WHERE id = 'cust-1'`)).toThrow();
  });

  it('an InvoiceType referenced by an Invoice cannot be deleted (restrict)', () => {
    expect(() => db.run(`DELETE FROM invoice_types WHERE id = 'type-1'`)).toThrow();
  });

  it('deleting a Business sets its social links away via cascade', () => {
    const now = new Date().toISOString();
    db.run(`INSERT INTO businesses (id, name, logo_initial, logo_color, currency_code, invoice_prefix, next_invoice_number, created_at, updated_at)
      VALUES ('biz-1', 'Acme', 'A', '#000', 'USD', 'INV-', 1, '${now}', '${now}')`);
    db.run(`INSERT INTO social_links (id, business_id, platform, url, created_at) VALUES ('social-1', 'biz-1', 'website', 'https://acme.test', '${now}')`);

    db.run(`DELETE FROM businesses WHERE id = 'biz-1'`);
    expect(db.all(`SELECT id FROM social_links WHERE business_id = 'biz-1'`)).toHaveLength(0);
  });
});
