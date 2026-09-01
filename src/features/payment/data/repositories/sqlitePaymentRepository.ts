import { eq, desc } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Payment } from '../../domain/entities/Payment';
import { PaymentRepository, RecordPaymentInput } from '../../domain/repositories/PaymentRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { roundMoney } from '../../../../core/utils/currencyFormatter';
import { syncArray } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { payments, invoices, invoiceItems } from '../../../../database/schema';
import { paymentFromRow, invoicesFromRows, now } from '../../../../database/mappers';
import { recalculateInvoiceStatus } from '../../../invoice/data/repositories/sqliteInvoiceRepository';
import { mockPayments } from '../datasources/mock/mockPayments';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';

function validate(input: RecordPaymentInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    // Section 24: "A payment cannot be negative" — zero is rejected too, since it isn't a payment.
    fieldErrors.amount = 'Enter an amount greater than zero.';
  }
  if (!input.paymentDate || Number.isNaN(new Date(input.paymentDate).getTime())) {
    fieldErrors.paymentDate = 'Enter a valid date.';
  }
  return fieldErrors;
}

/** SQLite-backed `PaymentRepository` (Phase 20), replacing `MockPaymentRepository` behind the same interface (Section 9). */
export class SqlitePaymentRepository implements PaymentRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getPayments(): Promise<Result<Payment[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(payments).all();
      const list = rows.map(paymentFromRow);
      syncArray(mockPayments, list);
      return ok(list);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load payments.', cause));
    }
  }

  async getPaymentsForInvoice(invoiceId: string): Promise<Result<Payment[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paymentDate)).all();
      return ok(rows.map(paymentFromRow));
    } catch (cause) {
      return err(new DatabaseFailure('Could not load payments for this invoice.', cause));
    }
  }

  async recordPayment(input: RecordPaymentInput): Promise<Result<Payment, Failure>> {
    try {
      const db = this.db;
      const [invoice] = db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).all();
      if (!invoice) return err(new NotFoundFailure('That invoice could not be found.'));

      const fieldErrors = validate(input);
      if (Object.keys(fieldErrors).length > 0) {
        return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
      }

      const id = generateId();
      const payment = {
        id,
        invoiceId: input.invoiceId,
        amount: roundMoney(input.amount),
        paymentDate: input.paymentDate,
        method: input.method,
        reference: input.reference,
        notes: input.notes,
        createdAt: now(),
      };

      // Insert + status recalculation (Section 26) run inside one transaction
      // (Section 21 crash-safety) — otherwise an app kill between the two
      // statements could leave a persisted Payment row against an Invoice
      // whose stored `status` never reflects it, until some later write
      // happens to recompute it.
      db.transaction((tx) => {
        tx.insert(payments).values(payment).run();
        recalculateInvoiceStatus(tx, input.invoiceId);
      });

      const allPayments = db.select().from(payments).all();
      syncArray(mockPayments, allPayments.map(paymentFromRow));

      const invoiceRows = db.select().from(invoices).all();
      const itemRows = db.select().from(invoiceItems).all();
      syncArray(mockInvoices, invoicesFromRows(invoiceRows, itemRows));

      const paymentEntity: Payment = {
        id,
        invoiceId: input.invoiceId,
        amount: payment.amount,
        paymentDate: input.paymentDate,
        method: input.method,
        reference: input.reference,
        notes: input.notes,
      };
      return ok(paymentEntity);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this payment.', cause));
    }
  }
}
