import { create } from 'zustand';
import { itemRepository, invoiceTypeRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { Item } from '../../domain/entities/Item';
import { ItemInput } from '../../domain/repositories/ItemRepository';
import { InvoiceType } from '../../../invoiceType/domain/entities/InvoiceType';

export type ItemFormMode = 'create' | 'edit';
export type ItemFormStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export interface ItemFormFields {
  name: string;
  description: string;
  sku: string;
  unit: string;
  defaultPrice: string;
  taxRate: string;
  weight: string;
  length: string;
  width: string;
  height: string;
  invoiceTypeId: string;
}

const DEFAULT_FIELDS: ItemFormFields = {
  name: '',
  description: '',
  sku: '',
  unit: '',
  defaultPrice: '',
  taxRate: '',
  weight: '',
  length: '',
  width: '',
  height: '',
  invoiceTypeId: '',
};

/** Blank optional numeric fields are omitted rather than sent as NaN/0. */
function toNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toInput(fields: ItemFormFields): ItemInput {
  return {
    name: fields.name.trim(),
    description: fields.description.trim() || undefined,
    sku: fields.sku.trim() || undefined,
    unit: fields.unit.trim() || undefined,
    defaultPrice: Number(fields.defaultPrice.trim()),
    taxRate: toNumber(fields.taxRate),
    weight: toNumber(fields.weight),
    length: toNumber(fields.length),
    width: toNumber(fields.width),
    height: toNumber(fields.height),
    invoiceTypeId: fields.invoiceTypeId || undefined,
  };
}

function fromItem(item: Item): ItemFormFields {
  return {
    name: item.name,
    description: item.description ?? '',
    sku: item.sku ?? '',
    unit: item.unit ?? '',
    defaultPrice: String(item.defaultPrice),
    taxRate: item.taxRate != null ? String(item.taxRate) : '',
    weight: item.weight != null ? String(item.weight) : '',
    length: item.length != null ? String(item.length) : '',
    width: item.width != null ? String(item.width) : '',
    height: item.height != null ? String(item.height) : '',
    invoiceTypeId: item.invoiceTypeId ?? '',
  };
}

interface ItemFormState extends ItemFormFields {
  mode: ItemFormMode;
  status: ItemFormStatus;
  itemId?: string;
  invoiceTypes: InvoiceType[];
  fieldErrors: Record<string, string>;
  errorMessage?: string;

  setField: <K extends keyof ItemFormFields>(key: K, value: ItemFormFields[K]) => void;
  startCreate: () => Promise<void>;
  loadForEdit: (itemId: string) => Promise<void>;
  save: () => Promise<Item | undefined>;
}

/**
 * Draft state for the Create/Edit Item form (Phase 7, Screen 8). The screen
 * reads and writes only through this store; the store is the sole caller of
 * `itemRepository` (Section 10 — UI never talks to a repository directly).
 */
export const useItemFormStore = create<ItemFormState>((set, get) => ({
  ...DEFAULT_FIELDS,
  mode: 'create',
  status: 'idle',
  itemId: undefined,
  invoiceTypes: [],
  fieldErrors: {},
  errorMessage: undefined,

  setField: (key, value) =>
    set((state) => ({
      [key]: value,
      fieldErrors: { ...state.fieldErrors, [key]: '' },
    } as Partial<ItemFormState>)),

  startCreate: async () => {
    set({
      ...DEFAULT_FIELDS,
      mode: 'create',
      status: 'loading',
      itemId: undefined,
      fieldErrors: {},
      errorMessage: undefined,
    });
    const typesResult = await invoiceTypeRepository.getInvoiceTypes();
    const invoiceTypes = typesResult.isSuccess ? typesResult.value : [];
    set({
      status: 'idle',
      invoiceTypes,
      invoiceTypeId: invoiceTypes[0]?.id ?? '',
    });
  },

  loadForEdit: async (itemId) => {
    set({ mode: 'edit', status: 'loading', itemId, errorMessage: undefined });
    const [itemResult, typesResult] = await Promise.all([
      itemRepository.getItem(itemId),
      invoiceTypeRepository.getInvoiceTypes(),
    ]);

    if (!itemResult.isSuccess) {
      set({ status: 'error', errorMessage: itemResult.error.message });
      return;
    }

    set({
      status: 'idle',
      invoiceTypes: typesResult.isSuccess ? typesResult.value : [],
      fieldErrors: {},
      ...fromItem(itemResult.value),
    });
  },

  save: async () => {
    const state = get();
    set({ status: 'saving', errorMessage: undefined });
    const input = toInput(state);
    const result =
      state.mode === 'edit' && state.itemId
        ? await itemRepository.updateItem(state.itemId, input)
        : await itemRepository.createItem(input);

    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        errorMessage: failure.message,
        fieldErrors: failure instanceof ValidationFailure ? failure.fieldErrors ?? {} : {},
      });
      return undefined;
    }

    set({ status: 'saved', itemId: result.value.id, fieldErrors: {}, errorMessage: undefined });
    return result.value;
  },
}));
