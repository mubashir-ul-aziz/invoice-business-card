import { create } from 'zustand';
import { paymentRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { roundMoney } from '../../../../core/utils/currencyFormatter';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { InvoiceStatus } from '../../../invoice/domain/entities/Invoice';
import { mockInvoices, MOCK_TODAY } from '../../../invoice/data/datasources/mock/mockInvoices';
import { Payment, PaymentMethod } from '../../domain/entities/Payment';

export type PaymentFormStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

/** YYYY-MM-DD for date-only fields — shared with the screen's quick-date chips. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DEFAULT_DRAFT = {
  amount: '',
  paymentDate: toIsoDate(MOCK_TODAY),
  method: 'bank_transfer' as PaymentMethod,
  reference: '',
  notes: '',
};

interface ComputedInvoiceView {
  invoiceNumber: string;
  invoiceStatus: InvoiceStatus;
  invoiceTotal: number;
  remainingBalance: number;
  payments: Payment[];
}

/**
 * Looks up the invoice (still read directly from the mock datasource — no
 * `InvoiceRepository` exists yet ahead of Phase 20) and its payments (via
 * `paymentRepository`, the one boundary this phase introduces), and derives
 * the remaining balance (Section 24).
 */
async function fetchComputed(invoiceId: string): Promise<ComputedInvoiceView | undefined> {
  const invoice = mockInvoices.find((existing) => existing.id === invoiceId);
  if (!invoice) return undefined;

  const result = await paymentRepository.getPaymentsForInvoice(invoiceId);
  if (!result.isSuccess) return undefined;

  const payments = result.value;
  const totalPaid = totalPaidForInvoice(invoiceId, payments);
  return {
    invoiceNumber: invoice.invoiceNumber,
    invoiceStatus: invoice.status,
    invoiceTotal: invoice.total,
    remainingBalance: roundMoney(invoice.total - totalPaid),
    payments,
  };
}

interface PaymentFormState {
  invoiceId?: string;
  invoiceNumber?: string;
  invoiceStatus?: InvoiceStatus;
  invoiceTotal: number;
  remainingBalance: number;
  payments: Payment[];
  status: PaymentFormStatus;

  amount: string;
  paymentDate: string;
  method: PaymentMethod;
  reference: string;
  notes: string;
  fieldErrors: Record<string, string>;
  errorMessage?: string;

  load: (invoiceId: string) => Promise<void>;
  setField: <K extends 'amount' | 'paymentDate' | 'method' | 'reference' | 'notes'>(
    key: K,
    value: PaymentFormState[K],
  ) => void;
  save: () => Promise<Payment | undefined>;
}

/**
 * Draft state for the Record Payment form (Phase 13, Screen 18). The screen
 * reads/writes only through this store; the store is the sole caller of
 * `paymentRepository` (Section 10 — UI never talks to a repository
 * directly).
 */
export const usePaymentFormStore = create<PaymentFormState>((set, get) => ({
  invoiceId: undefined,
  invoiceNumber: undefined,
  invoiceStatus: undefined,
  invoiceTotal: 0,
  remainingBalance: 0,
  payments: [],
  status: 'idle',
  ...DEFAULT_DRAFT,
  fieldErrors: {},
  errorMessage: undefined,

  load: async (invoiceId) => {
    set({ status: 'loading', invoiceId, errorMessage: undefined, fieldErrors: {} });

    const computed = await fetchComputed(invoiceId);
    if (!computed) {
      set({ status: 'error', errorMessage: 'That invoice could not be found.' });
      return;
    }

    set({
      status: 'idle',
      ...computed,
      // Pre-fill the amount with the full remaining balance — the common case
      // is paying it off in one go; the field stays fully editable for partial payments.
      amount: computed.remainingBalance > 0 ? computed.remainingBalance.toFixed(2) : '',
      paymentDate: toIsoDate(MOCK_TODAY),
      method: 'bank_transfer',
      reference: '',
      notes: '',
      fieldErrors: {},
    });
  },

  setField: (key, value) =>
    set((state) => ({
      [key]: value,
      fieldErrors: { ...state.fieldErrors, [key]: '' },
    } as Partial<PaymentFormState>)),

  save: async () => {
    const state = get();
    if (!state.invoiceId) return undefined;

    set({ status: 'saving', errorMessage: undefined });

    const result = await paymentRepository.recordPayment({
      invoiceId: state.invoiceId,
      amount: Number(state.amount),
      paymentDate: state.paymentDate,
      method: state.method,
      reference: state.reference.trim() || undefined,
      notes: state.notes.trim() || undefined,
    });

    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        errorMessage: failure.message,
        fieldErrors: failure instanceof ValidationFailure ? failure.fieldErrors ?? {} : {},
      });
      return undefined;
    }

    // Refresh the computed view (remaining balance / status / history) so a
    // caller that stays on this screen sees the write reflected immediately.
    const computed = await fetchComputed(state.invoiceId);
    set({ status: 'saved', ...(computed ?? {}) });
    return result.value;
  },
}));
