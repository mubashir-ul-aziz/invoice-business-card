import { create } from 'zustand';
import { invoiceTypeRepository } from '../../../../app/di/providers';
import { InvoiceType } from '../../domain/entities/InvoiceType';

export type InvoiceTypeSelectionStatus = 'idle' | 'loading' | 'ready' | 'saving' | 'error';

interface InvoiceTypeSelectionState {
  invoiceTypes: InvoiceType[];
  selectedId: string | null;
  status: InvoiceTypeSelectionStatus;
  errorMessage?: string;

  load: () => Promise<void>;
  select: (invoiceTypeId: string) => void;
  confirmSelection: () => Promise<boolean>;
}

/**
 * Draft + persisted state for Invoice Type Selection (Phase 5, Screen 5).
 * The screen reads and writes only through this store; the store is the
 * sole caller of `invoiceTypeRepository` (Section 10 — UI never talks to a
 * repository directly).
 */
export const useInvoiceTypeSelectionStore = create<InvoiceTypeSelectionState>((set, get) => ({
  invoiceTypes: [],
  selectedId: null,
  status: 'idle',
  errorMessage: undefined,

  load: async () => {
    set({ status: 'loading', errorMessage: undefined });
    const [typesResult, selectedResult] = await Promise.all([
      invoiceTypeRepository.getInvoiceTypes(),
      invoiceTypeRepository.getSelectedInvoiceTypeId(),
    ]);

    if (!typesResult.isSuccess) {
      set({ status: 'error', errorMessage: typesResult.error.message });
      return;
    }
    if (!selectedResult.isSuccess) {
      set({ status: 'error', errorMessage: selectedResult.error.message });
      return;
    }

    const invoiceTypes = typesResult.value;
    const selectedId = selectedResult.value ?? invoiceTypes.find((type) => type.isSystemDefined)?.id ?? null;
    set({ status: 'ready', invoiceTypes, selectedId });
  },

  select: (invoiceTypeId) => set({ selectedId: invoiceTypeId }),

  confirmSelection: async () => {
    const { selectedId } = get();
    if (!selectedId) return false;

    set({ status: 'saving', errorMessage: undefined });
    const result = await invoiceTypeRepository.selectInvoiceType(selectedId);
    if (!result.isSuccess) {
      set({ status: 'error', errorMessage: result.error.message });
      return false;
    }
    set({ status: 'ready' });
    return true;
  },
}));
