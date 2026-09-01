import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Invoice } from '../../domain/entities/Invoice';
import { CreateInvoiceInput, InvoiceRepository } from '../../domain/repositories/InvoiceRepository';
import { computeInvoiceTotals, computeLineTotal, deriveInvoiceStatus } from '../../../../core/utils/invoiceCalculations';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { generateId } from '../../../../core/utils/idGenerator';
import { syncArray, syncObject } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { invoices, invoiceItems, businesses, payments } from '../../../../database/schema';
import { invoiceFromRow, paymentFromRow, businessFromRow, now } from '../../../../database/mappers';
import { mockInvoices } from '../datasources/mock/mockInvoices';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';

function validate(input: CreateInvoiceInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!input.customerId) fieldErrors.customerId = 'Choose a customer.';
  if (!input.invoiceTypeId) fieldErrors.invoiceTypeId = 'Choose an invoice type.';
  if (!input.lines || input.lines.length === 0) fieldErrors.lines = 'Add at least one line item.';
  return fieldErrors;
}

/** Reads every invoice + its line items from SQLite and re-syncs the shared `mockInvoices` cache. */
function reloadAll(db: AnyInvoraDb): Invoice[] {
  const invoiceRows = db.select().from(invoices).all();
  const itemRows = db.select().from(invoiceItems).all();
  const list = invoiceRows.map((row) => invoiceFromRow(row, itemRows));
  syncArray(mockInvoices, list);
  return list;
}

/**
 * SQLite-backed `InvoiceRepository` (Phase 20) — the first real
 * implementation of this interface (Section 9), replacing the direct
 * `mockInvoices`/`createInvoiceFromDraft` datasource calls the Invoice
 * screens/stores used through Phases 10-19.
 */
export class SqliteInvoiceRepository implements InvoiceRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getInvoices(): Promise<Result<Invoice[], Failure>> {
    try {
      const db = this.db;
      return ok(reloadAll(db));
    } catch (cause) {
      return err(new DatabaseFailure('Could not load invoices.', cause));
    }
  }

  async getInvoice(id: string): Promise<Result<Invoice, Failure>> {
    try {
      const db = this.db;
      const [row] = db.select().from(invoices).where(eq(invoices.id, id)).all();
      if (!row) return err(new NotFoundFailure('That invoice could not be found.'));
      const itemRows = db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id)).all();
      return ok(invoiceFromRow(row, itemRows));
    } catch (cause) {
      return err(new DatabaseFailure('Could not load that invoice.', cause));
    }
  }

  async createInvoice(input: CreateInvoiceInput): Promise<Result<Invoice, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const [businessRow] = db.select().from(businesses).all();
      if (!businessRow) return err(new ValidationFailure('Set up your business profile before creating invoices.', {}));

      const id = generateId();
      const timestamp = now();
      const totals = computeInvoiceTotals(input.lines);
      const invoiceNumber = `${businessRow.invoicePrefix}${businessRow.nextInvoiceNumber}`;
      // No payments exist yet for a brand-new invoice — status is derived the
      // same way `buildInvoice`/`createInvoiceFromDraft` did in the mock phase.
      const status = deriveInvoiceStatus(totals.total, 0, input.dueDate);

      db.transaction((tx) => {
        tx.insert(invoices)
          .values({
            id,
            invoiceNumber,
            customerId: input.customerId,
            invoiceTypeId: input.invoiceTypeId,
            issueDate: input.issueDate,
            dueDate: input.dueDate,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxTotal: totals.taxTotal,
            total: totals.total,
            notes: input.notes,
            terms: input.terms,
            status,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          .run();

        input.lines.forEach((line, index) => {
          tx.insert(invoiceItems)
            .values({
              id: `${id}-line-${index + 1}`,
              invoiceId: id,
              itemNameSnapshot: line.itemNameSnapshot,
              itemDescriptionSnapshot: line.descriptionSnapshot,
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
              createdAt: timestamp,
            })
            .run();
        });

        tx.update(businesses)
          .set({ nextInvoiceNumber: businessRow.nextInvoiceNumber + 1, updatedAt: timestamp })
          .where(eq(businesses.id, businessRow.id))
          .run();
      });

      const [updatedBusiness] = db.select().from(businesses).where(eq(businesses.id, businessRow.id)).all();
      syncObject(mockBusiness, businessFromRow(updatedBusiness));

      const list = reloadAll(db);
      const created = list.find((invoice) => invoice.id === id)!;
      return ok(created);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this invoice.', cause));
    }
  }
}

/** Recomputes total-paid + status for one invoice row and persists it — shared with `SqlitePaymentRepository`. */
export function recalculateInvoiceStatus(db: AnyInvoraDb, invoiceId: string): void {
  const [row] = db.select().from(invoices).where(eq(invoices.id, invoiceId)).all();
  if (!row) return;
  const invoicePayments = db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).all();
  const totalPaid = totalPaidForInvoice(invoiceId, invoicePayments.map(paymentFromRow));
  const status = deriveInvoiceStatus(row.total, totalPaid, row.dueDate ?? undefined);
  db.update(invoices).set({ status, updatedAt: now() }).where(eq(invoices.id, invoiceId)).run();
}
