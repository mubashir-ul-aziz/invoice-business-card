import { create } from 'zustand';
import { customerRepository, itemRepository, invoiceTypeRepository } from '../../../../app/di/providers';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { Customer } from '../../../customer/domain/entities/Customer';
import { Item } from '../../../item/domain/entities/Item';
import { InvoiceType } from '../../../invoiceType/domain/entities/InvoiceType';
import { invoiceTypeHasField } from '../../../invoiceType/domain/usecases/resolveInvoiceTypeFields';
import { generateId } from '../../../../core/utils/idGenerator';
import { DraftInvoiceLine } from '../../../../app/navigation/types';
import { createInvoiceFromDraft } from '../../data/datasources/mock/mockInvoices';
import { Invoice } from '../../domain/entities/Invoice';

export type InvoiceFormReferenceStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface InvoiceFormDraft {
  customerId?: string;
  invoiceTypeId: string;
  issueDate: string;
  dueDate?: string;
  lines: DraftInvoiceLine[];
  notes: string;
  terms: string;
  /** Key of the line whose inline editor is expanded, or undefined if none. */
  editingLineKey?: string;
}

interface InvoiceFormState extends InvoiceFormDraft {
  // Reference data the wizard needs across all 3 steps — the store is the
  // sole caller of these repositories (Section 10); screens only read state.
  customers: Customer[];
  items: Item[];
  invoiceTypes: InvoiceType[];
  referenceStatus: InvoiceFormReferenceStatus;
  referenceError?: string;

  loadReferenceData: () => Promise<void>;
  /** Clears the draft for a brand-new invoice, keeping already-loaded reference data. */
  startNew: () => void;
  /** Seeds the draft from a direct entry point (e.g. Customer Detail's "New Invoice"), skipping Step 1. */
  presetDraft: (preset: { customerId: string; invoiceTypeId?: string; issueDate?: string; dueDate?: string }) => void;
  setCustomerId: (id: string) => void;
  setInvoiceTypeId: (id: string) => void;
  addLineFromItem: (itemId: string) => void;
  updateLine: (key: string, patch: Partial<DraftInvoiceLine>) => void;
  removeLine: (key: string) => void;
  setEditingLineKey: (key: string | undefined) => void;
  setNotes: (notes: string) => void;
  setTerms: (terms: string) => void;
  /** Screen 16 (Invoice Review) "Save" — appends the draft to the mock repository (Section 9) with InvoiceItem snapshot fields populated, then clears the draft. Returns undefined if the draft isn't save-ready (no customer / no lines). */
  submit: () => Invoice | undefined;
  /** Seeds a full draft — customer, type, line items, notes, terms — from an existing invoice. Used by Invoice Detail's "Duplicate" action to start a new draft pre-filled from a saved one. */
  loadForDuplicate: (source: { customerId: string; invoiceTypeId: string; lines: DraftInvoiceLine[]; notes?: string; terms?: string }) => void;
}

/** Fresh draft defaults: today's issue date, a 30-day due date, the business's default invoice type. */
function defaultDraft(invoiceTypeId?: string): InvoiceFormDraft {
  const issue = new Date();
  const due = new Date(issue.getTime() + 30 * 24 * 60 * 60 * 1000);
  return {
    customerId: undefined,
    invoiceTypeId: invoiceTypeId ?? mockBusiness.defaultInvoiceTypeId ?? '',
    issueDate: issue.toISOString(),
    dueDate: due.toISOString(),
    lines: [],
    notes: '',
    terms: 'Net 30',
    editingLineKey: undefined,
  };
}

/**
 * Draft state for the 3-step Create Invoice wizard (Phase 11, Screens
 * 14-16). Replaces threading the draft through navigation route params —
 * every step reads/writes this single store, matching the "dedicated form
 * store" rule (Section 10) used by `customerFormStore`/`itemFormStore`.
 */
export const useInvoiceFormStore = create<InvoiceFormState>((set, get) => ({
  customers: [],
  items: [],
  invoiceTypes: [],
  referenceStatus: 'idle',
  referenceError: undefined,
  ...defaultDraft(),

  loadReferenceData: async () => {
    set({ referenceStatus: 'loading', referenceError: undefined });
    const [customersResult, itemsResult, typesResult] = await Promise.all([
      customerRepository.getCustomers(),
      itemRepository.getItems(),
      invoiceTypeRepository.getInvoiceTypes(),
    ]);

    if (!customersResult.isSuccess) {
      set({ referenceStatus: 'error', referenceError: customersResult.error.message });
      return;
    }
    if (!itemsResult.isSuccess) {
      set({ referenceStatus: 'error', referenceError: itemsResult.error.message });
      return;
    }
    if (!typesResult.isSuccess) {
      set({ referenceStatus: 'error', referenceError: typesResult.error.message });
      return;
    }

    set((state) => ({
      referenceStatus: 'loaded',
      customers: customersResult.value,
      items: itemsResult.value,
      invoiceTypes: typesResult.value,
      // Keep an already-chosen type; otherwise fall back to the business default, then the first available type.
      invoiceTypeId:
        state.invoiceTypeId || mockBusiness.defaultInvoiceTypeId || typesResult.value[0]?.id || '',
    }));
  },

  startNew: () => set(defaultDraft(get().invoiceTypeId)),

  presetDraft: (preset) =>
    set({
      ...defaultDraft(preset.invoiceTypeId),
      customerId: preset.customerId,
      issueDate: preset.issueDate ?? defaultDraft().issueDate,
      dueDate: preset.dueDate,
    }),

  setCustomerId: (id) => set({ customerId: id }),
  setInvoiceTypeId: (id) => set({ invoiceTypeId: id }),

  addLineFromItem: (itemId) => {
    const { items, invoiceTypes, invoiceTypeId } = get();
    const item = items.find((existing) => existing.id === itemId);
    if (!item) return;
    const invoiceType = invoiceTypes.find((type) => type.id === invoiceTypeId);

    const line: DraftInvoiceLine = {
      key: generateId(),
      itemNameSnapshot: item.name,
      unitSnapshot: invoiceTypeHasField(invoiceType, 'unit') ? (item.unit ?? '') : undefined,
      quantity: invoiceTypeHasField(invoiceType, 'quantity') ? 1 : undefined,
      weight: invoiceTypeHasField(invoiceType, 'weight') ? (item.weight ?? 1) : undefined,
      length: invoiceTypeHasField(invoiceType, 'length') ? (item.length ?? 1) : undefined,
      width: invoiceTypeHasField(invoiceType, 'width') ? (item.width ?? 1) : undefined,
      height: invoiceTypeHasField(invoiceType, 'height') ? (item.height ?? 1) : undefined,
      unitPrice: item.defaultPrice,
      discount: invoiceTypeHasField(invoiceType, 'discount') ? 0 : undefined,
      taxRate: invoiceTypeHasField(invoiceType, 'tax') ? (item.taxRate ?? 0) : undefined,
    };
    // Newly-added lines open expanded so the price/qty/discount/tax the item
    // seeded are immediately visible and editable (Screen 15 "edit line").
    set((state) => ({ lines: [...state.lines, line], editingLineKey: line.key }));
  },

  updateLine: (key, patch) =>
    set((state) => ({
      lines: state.lines.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    })),

  removeLine: (key) =>
    set((state) => ({
      lines: state.lines.filter((line) => line.key !== key),
      editingLineKey: state.editingLineKey === key ? undefined : state.editingLineKey,
    })),

  setEditingLineKey: (key) => set({ editingLineKey: key }),
  setNotes: (notes) => set({ notes }),
  setTerms: (terms) => set({ terms }),

  submit: () => {
    const state = get();
    if (!state.customerId || state.lines.length === 0) return undefined;

    const invoice = createInvoiceFromDraft({
      customerId: state.customerId,
      invoiceTypeId: state.invoiceTypeId,
      issueDate: state.issueDate,
      dueDate: state.dueDate,
      notes: state.notes.trim() || undefined,
      terms: state.terms.trim() || undefined,
      lines: state.lines,
    });

    set(defaultDraft(state.invoiceTypeId));
    return invoice;
  },

  loadForDuplicate: (source) =>
    set({
      ...defaultDraft(source.invoiceTypeId),
      customerId: source.customerId,
      lines: source.lines,
      notes: source.notes ?? '',
      terms: source.terms ?? 'Net 30',
    }),
}));
