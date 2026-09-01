import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { Invoice } from '../entities/Invoice';

/** One draft line as the Create Invoice wizard collects it (mirrors `DraftInvoiceLine`, Section 7's InvoiceItem snapshot fields). */
export interface CreateInvoiceLineInput {
  itemNameSnapshot: string;
  descriptionSnapshot?: string;
  unitSnapshot?: string;
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

/** Fields the Invoice Review screen (Screen 16) submits on save. `id`/`invoiceNumber`/status/snapshots are set by the repository. */
export interface CreateInvoiceInput {
  customerId: string;
  invoiceTypeId: string;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  terms?: string;
  lines: CreateInvoiceLineInput[];
}

/**
 * Invoice persistence boundary (Section 9). Introduced in Phase 20 — Phases
 * 10-19 built the Invoice screens directly against the mock datasource's
 * `mockInvoices`/`createInvoiceFromDraft` (ahead of a repository existing
 * yet, same allowance the plan gives Payment/Customer during their own
 * early phases). This is the first real `InvoiceRepository`, satisfying the
 * "repository abstraction" / "UI must not directly query SQLite" rules for
 * Phase 20; `SqliteInvoiceRepository` is its only implementation.
 */
export interface InvoiceRepository {
  /** The full invoice list (Screen 13 filters/searches this client-side, per the list convention used elsewhere). */
  getInvoices(): Promise<Result<Invoice[], Failure>>;

  /** A single invoice by id, with its line items. */
  getInvoice(id: string): Promise<Result<Invoice, Failure>>;

  /**
   * Persists a new Invoice + InvoiceItems (with snapshot fields as given —
   * Section 7's historical-integrity rule), assigns the next invoice number
   * from the Business's counter, and advances that counter.
   */
  createInvoice(input: CreateInvoiceInput): Promise<Result<Invoice, Failure>>;
}
