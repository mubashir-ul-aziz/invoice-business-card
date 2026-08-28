import { create } from 'zustand';
import { invoiceTypeRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { InvoiceFieldKey, REQUIRED_INVOICE_FIELDS } from '../../../../core/constants/invoiceFieldVocabulary';
import { InvoiceType } from '../../domain/entities/InvoiceType';

export type CustomInvoiceTypeStatus = 'idle' | 'saving' | 'saved' | 'error';

/** Sensible starting selection — mirrors the seeded "General" type (Section 27) plus the two structural fields. */
const DEFAULT_ENABLED_FIELDS: InvoiceFieldKey[] = ['itemName', 'unitPrice', 'quantity', 'unit', 'discount', 'tax'];

interface CustomInvoiceTypeState {
  name: string;
  enabledFields: Set<InvoiceFieldKey>;
  status: CustomInvoiceTypeStatus;
  nameError?: string;
  errorMessage?: string;

  setName: (name: string) => void;
  toggleField: (field: InvoiceFieldKey) => void;
  reset: () => void;
  save: () => Promise<InvoiceType | undefined>;
}

/**
 * Draft state for the Custom Invoice Type form (Phase 6, Screen 6). The
 * screen reads/writes only through this store; the store is the sole caller
 * of `invoiceTypeRepository` (Section 10 — UI never talks to a repository
 * directly). Mock-only for now — `save()` persists into the in-memory
 * `MockInvoiceTypeRepository`; swapping to SQLite (Phase 20) is a
 * `providers.ts`-only change, this store stays as-is.
 */
export const useCustomInvoiceTypeStore = create<CustomInvoiceTypeState>((set, get) => ({
  name: '',
  enabledFields: new Set(DEFAULT_ENABLED_FIELDS),
  status: 'idle',
  nameError: undefined,
  errorMessage: undefined,

  setName: (name) => set({ name, nameError: undefined }),

  toggleField: (field) => {
    // itemName/unitPrice are structural and always included — not user-toggleable.
    if (REQUIRED_INVOICE_FIELDS.includes(field)) return;
    set((state) => {
      const next = new Set(state.enabledFields);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return { enabledFields: next };
    });
  },

  reset: () =>
    set({
      name: '',
      enabledFields: new Set(DEFAULT_ENABLED_FIELDS),
      status: 'idle',
      nameError: undefined,
      errorMessage: undefined,
    }),

  save: async () => {
    const { name, enabledFields } = get();
    set({ status: 'saving', nameError: undefined, errorMessage: undefined });

    const result = await invoiceTypeRepository.createInvoiceType({
      name,
      enabledFields: Array.from(enabledFields),
    });

    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        nameError: failure instanceof ValidationFailure ? failure.fieldErrors?.name : undefined,
        errorMessage: failure instanceof ValidationFailure ? undefined : failure.message,
      });
      return undefined;
    }

    set({ status: 'saved' });
    return result.value;
  },
}));
