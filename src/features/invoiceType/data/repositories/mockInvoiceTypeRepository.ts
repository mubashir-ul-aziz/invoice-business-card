import { Result, ok, err } from '../../../../core/result/result';
import { Failure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { InvoiceType } from '../../domain/entities/InvoiceType';
import { CreateInvoiceTypeInput, InvoiceTypeRepository } from '../../domain/repositories/InvoiceTypeRepository';
import { mockInvoiceTypes } from '../datasources/mock/mockInvoiceTypes';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { generateId } from '../../../../core/utils/idGenerator';
import { REQUIRED_INVOICE_FIELDS } from '../../../../core/constants/invoiceFieldVocabulary';

const SIMULATED_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

/**
 * In-memory `InvoiceTypeRepository` for Phase 5 (Section: "Global rule for
 * Phases 1-19" — no SQLite yet). Holds the seeded system-defined types plus
 * the business's selected default for the lifetime of the app session;
 * nothing is written to disk.
 */
export class MockInvoiceTypeRepository implements InvoiceTypeRepository {
  private readonly invoiceTypes: InvoiceType[] = [...mockInvoiceTypes];
  // Seeded from the shared demo Business fixture so this stays consistent
  // with the Business/Company screen until real persistence lands.
  private selectedId: string | null = mockBusiness.defaultInvoiceTypeId ?? null;

  async getInvoiceTypes(): Promise<Result<InvoiceType[], Failure>> {
    return delay(ok([...this.invoiceTypes]));
  }

  async getSelectedInvoiceTypeId(): Promise<Result<string | null, Failure>> {
    return delay(ok(this.selectedId));
  }

  async selectInvoiceType(invoiceTypeId: string): Promise<Result<string, Failure>> {
    const exists = this.invoiceTypes.some((type) => type.id === invoiceTypeId);
    if (!exists) {
      return delay(err(new NotFoundFailure('That invoice type could not be found.')));
    }
    this.selectedId = invoiceTypeId;
    return delay(ok(invoiceTypeId));
  }

  async createInvoiceType(input: CreateInvoiceTypeInput): Promise<Result<InvoiceType, Failure>> {
    const name = input.name.trim();
    if (!name) {
      return delay(err(new ValidationFailure('Give this type a name.', { name: 'Give this type a name.' })));
    }

    // itemName/unitPrice are structural (Section 7 — every Item has a name and a price)
    // so they're always persisted regardless of what the form toggled.
    const enabledFields = Array.from(new Set([...REQUIRED_INVOICE_FIELDS, ...input.enabledFields]));

    const invoiceType: InvoiceType = {
      id: generateId(),
      name,
      description: `Custom type — ${enabledFields.length} fields selected.`,
      isSystemDefined: false,
      enabledFields,
    };

    this.invoiceTypes.push(invoiceType);
    return delay(ok(invoiceType));
  }
}
