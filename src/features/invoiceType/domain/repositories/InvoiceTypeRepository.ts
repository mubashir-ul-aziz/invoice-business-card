import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { InvoiceType } from '../entities/InvoiceType';
import { InvoiceFieldKey } from '../../../../core/constants/invoiceFieldVocabulary';

/** Fields the Custom Invoice Type form (Screen 6) submits. `id` is added by the repository on create. */
export interface CreateInvoiceTypeInput {
  name: string;
  enabledFields: InvoiceFieldKey[];
}

/**
 * InvoiceType persistence boundary (Section 9). Phase 5 is backed by
 * `mockInvoiceTypeRepository` (in-memory, seeded with the 5 system-defined
 * types); Phase 20 swaps in a SQLite-backed implementation via
 * `src/app/di/providers.ts` only — this interface, and every caller of it
 * (the selection screen's Zustand store), stays unchanged.
 */
export interface InvoiceTypeRepository {
  /** All invoice types available to the business (system-defined + custom). */
  getInvoiceTypes(): Promise<Result<InvoiceType[], Failure>>;

  /** The invoice type currently set as the business default, or null before one is chosen. */
  getSelectedInvoiceTypeId(): Promise<Result<string | null, Failure>>;

  /** Persists `invoiceTypeId` as the business's default invoice type. */
  selectInvoiceType(invoiceTypeId: string): Promise<Result<string, Failure>>;

  /** Creates a new business-defined (non-system) InvoiceType (Screen 6). */
  createInvoiceType(input: CreateInvoiceTypeInput): Promise<Result<InvoiceType, Failure>>;
}
