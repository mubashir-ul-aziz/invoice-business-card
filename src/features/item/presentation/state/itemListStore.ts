import { create } from 'zustand';
import { itemRepository, invoiceTypeRepository } from '../../../../app/di/providers';
import { Item } from '../../domain/entities/Item';
import { InvoiceType } from '../../../invoiceType/domain/entities/InvoiceType';

export type ItemListStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface ItemListState {
  items: Item[];
  invoiceTypes: InvoiceType[];
  status: ItemListStatus;
  errorMessage?: string;
  searchQuery: string;
  /** `null` = "All" — no invoice-type filter chip selected. */
  selectedTypeId: string | null;

  load: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTypeId: (id: string | null) => void;
}

/**
 * Backs the Items List (Screen 7, Phase 7). Holds the raw catalog + invoice
 * types (for filter chips); the actual search/filter narrowing is done by
 * the pure `filterItems` use-case, called from the screen (Section 10 — the
 * store holds state, use-cases hold derivation logic).
 */
export const useItemListStore = create<ItemListState>((set) => ({
  items: [],
  invoiceTypes: [],
  status: 'idle',
  errorMessage: undefined,
  searchQuery: '',
  selectedTypeId: null,

  load: async () => {
    set({ status: 'loading', errorMessage: undefined });
    const [itemsResult, typesResult] = await Promise.all([
      itemRepository.getItems(),
      invoiceTypeRepository.getInvoiceTypes(),
    ]);

    if (!itemsResult.isSuccess) {
      set({ status: 'error', errorMessage: itemsResult.error.message });
      return;
    }

    set({
      status: 'loaded',
      items: itemsResult.value,
      invoiceTypes: typesResult.isSuccess ? typesResult.value : [],
    });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTypeId: (id) => set({ selectedTypeId: id }),
}));
