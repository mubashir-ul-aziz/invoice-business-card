import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { Payment, PaymentMethod } from '../entities/Payment';

/** Fields the Record Payment form (Screen 18) submits. `id` is set by the repository on create. */
export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

/**
 * Payment persistence boundary (Section 9). Phase 13 is backed by
 * `mockPaymentRepository` (in-memory); Phase 20 swaps in a SQLite-backed
 * implementation via `src/app/di/providers.ts` only — this interface, and
 * every caller of it (the Record Payment Zustand store), stays unchanged.
 */
export interface PaymentRepository {
  /** Payments logged against one invoice, most recent first (Screens 17/18). */
  getPaymentsForInvoice(invoiceId: string): Promise<Result<Payment[], Failure>>;

  /**
   * Appends a payment and recalculates + persists the owning invoice's
   * status (Section 24/26) so every reader of `Invoice.status` stays
   * consistent — the UI never sets status manually.
   */
  recordPayment(input: RecordPaymentInput): Promise<Result<Payment, Failure>>;
}
