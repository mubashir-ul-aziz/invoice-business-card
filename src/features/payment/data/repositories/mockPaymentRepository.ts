import { Result, ok, err } from '../../../../core/result/result';
import { Failure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Payment } from '../../domain/entities/Payment';
import { PaymentRepository, RecordPaymentInput } from '../../domain/repositories/PaymentRepository';
import { mockPayments } from '../datasources/mock/mockPayments';
import { mockInvoices, MOCK_TODAY } from '../../../invoice/data/datasources/mock/mockInvoices';
import { generateId } from '../../../../core/utils/idGenerator';
import { roundMoney } from '../../../../core/utils/currencyFormatter';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { deriveInvoiceStatus } from '../../../../core/utils/invoiceCalculations';

const SIMULATED_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

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

/**
 * In-memory `PaymentRepository` for Phase 13 (Section: "Global rule for
 * Phases 1-19" — no SQLite yet). Reads/writes the shared `mockPayments`
 * array in place, mirroring `mockCustomerRepository`'s convention, so
 * Invoice Detail — which still reads that array directly, ahead of a
 * Phase 20 SQLite-backed rewrite — sees the same data this repository
 * creates.
 */
export class MockPaymentRepository implements PaymentRepository {
  async getPayments(): Promise<Result<Payment[], Failure>> {
    return delay(ok([...mockPayments]));
  }

  async getPaymentsForInvoice(invoiceId: string): Promise<Result<Payment[], Failure>> {
    const payments = mockPayments
      .filter((payment) => payment.invoiceId === invoiceId)
      .sort((a, b) => (a.paymentDate < b.paymentDate ? 1 : -1));
    return delay(ok(payments));
  }

  async recordPayment(input: RecordPaymentInput): Promise<Result<Payment, Failure>> {
    const invoice = mockInvoices.find((existing) => existing.id === input.invoiceId);
    if (!invoice) return delay(err(new NotFoundFailure('That invoice could not be found.')));

    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    const payment: Payment = {
      id: generateId(),
      invoiceId: input.invoiceId,
      amount: roundMoney(input.amount),
      paymentDate: input.paymentDate,
      method: input.method,
      reference: input.reference,
      notes: input.notes,
    };
    mockPayments.push(payment);

    // Recalculate and persist status (Section 26) — derived here, once, rather
    // than left for every screen that reads `invoice.status` to redo itself.
    const totalPaid = totalPaidForInvoice(invoice.id, mockPayments);
    invoice.status = deriveInvoiceStatus(invoice.total, totalPaid, invoice.dueDate, MOCK_TODAY);

    return delay(ok(payment));
  }
}
