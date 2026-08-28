import { create } from 'zustand';
import { customerRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { Customer } from '../../domain/entities/Customer';
import { CustomerInput } from '../../domain/repositories/CustomerRepository';

export type CustomerFormMode = 'create' | 'edit';
export type CustomerFormStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export interface CustomerFormFields {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

const DEFAULT_FIELDS: CustomerFormFields = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

function toInput(fields: CustomerFormFields): CustomerInput {
  return {
    name: fields.name.trim(),
    phone: fields.phone.trim() || undefined,
    email: fields.email.trim() || undefined,
    address: fields.address.trim() || undefined,
    notes: fields.notes.trim() || undefined,
  };
}

function fromCustomer(customer: Customer): CustomerFormFields {
  return {
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    notes: customer.notes ?? '',
  };
}

interface CustomerFormState extends CustomerFormFields {
  mode: CustomerFormMode;
  status: CustomerFormStatus;
  customerId?: string;
  fieldErrors: Record<string, string>;
  errorMessage?: string;

  setField: <K extends keyof CustomerFormFields>(key: K, value: CustomerFormFields[K]) => void;
  startCreate: () => void;
  loadForEdit: (customerId: string) => Promise<void>;
  save: () => Promise<Customer | undefined>;
}

/**
 * Draft state for the Create/Edit Customer form (Phase 8, Screen 10). The
 * screen reads and writes only through this store; the store is the sole
 * caller of `customerRepository` (Section 10 — UI never talks to a
 * repository directly).
 */
export const useCustomerFormStore = create<CustomerFormState>((set, get) => ({
  ...DEFAULT_FIELDS,
  mode: 'create',
  status: 'idle',
  customerId: undefined,
  fieldErrors: {},
  errorMessage: undefined,

  setField: (key, value) =>
    set((state) => ({
      [key]: value,
      fieldErrors: { ...state.fieldErrors, [key]: '' },
    } as Partial<CustomerFormState>)),

  startCreate: () => {
    set({
      ...DEFAULT_FIELDS,
      mode: 'create',
      status: 'idle',
      customerId: undefined,
      fieldErrors: {},
      errorMessage: undefined,
    });
  },

  loadForEdit: async (customerId) => {
    set({ mode: 'edit', status: 'loading', customerId, errorMessage: undefined });
    const result = await customerRepository.getCustomer(customerId);

    if (!result.isSuccess) {
      set({ status: 'error', errorMessage: result.error.message });
      return;
    }

    set({
      status: 'idle',
      fieldErrors: {},
      ...fromCustomer(result.value),
    });
  },

  save: async () => {
    const state = get();
    set({ status: 'saving', errorMessage: undefined });
    const input = toInput(state);
    const result =
      state.mode === 'edit' && state.customerId
        ? await customerRepository.updateCustomer(state.customerId, input)
        : await customerRepository.createCustomer(input);

    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        errorMessage: failure.message,
        fieldErrors: failure instanceof ValidationFailure ? failure.fieldErrors ?? {} : {},
      });
      return undefined;
    }

    set({ status: 'saved', customerId: result.value.id, fieldErrors: {}, errorMessage: undefined });
    return result.value;
  },
}));
