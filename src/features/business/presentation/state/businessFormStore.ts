import { create } from 'zustand';
import { businessRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { Business } from '../../domain/entities/Business';
import { BusinessInput } from '../../domain/repositories/BusinessRepository';

/** Preset logo colors the "Add Logo" swatch cycles through (Section: no image picker until a later phase). */
export const LOGO_COLOR_PALETTE = ['#2563EB', '#0FA968', '#F59E0B', '#8B5CF6', '#EC4899', '#0891B2'];

export type BusinessFormMode = 'create' | 'edit';
export type BusinessFormStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';

export interface BusinessFormFields {
  name: string;
  logoInitial: string;
  logoColor: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  currencyCode: string;
  taxNumber: string;
  invoicePrefix: string;
}

const DEFAULT_FIELDS: BusinessFormFields = {
  name: '',
  logoInitial: '',
  logoColor: LOGO_COLOR_PALETTE[0],
  address: '',
  phone: '',
  email: '',
  website: '',
  currencyCode: 'USD',
  taxNumber: '',
  invoicePrefix: 'INV-',
};

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toInput(fields: BusinessFormFields): BusinessInput {
  return {
    name: fields.name.trim(),
    logoInitial: fields.logoInitial || initialsFrom(fields.name) || '?',
    logoColor: fields.logoColor,
    address: fields.address.trim() || undefined,
    phone: fields.phone.trim() || undefined,
    email: fields.email.trim() || undefined,
    website: fields.website.trim() || undefined,
    currencyCode: fields.currencyCode,
    taxNumber: fields.taxNumber.trim() || undefined,
    invoicePrefix: fields.invoicePrefix.trim() || 'INV-',
  };
}

interface BusinessFormState extends BusinessFormFields {
  mode: BusinessFormMode;
  status: BusinessFormStatus;
  businessId?: string;
  fieldErrors: Record<string, string>;
  errorMessage?: string;

  setField: <K extends keyof BusinessFormFields>(key: K, value: BusinessFormFields[K]) => void;
  cycleLogoColor: () => void;
  startCreate: () => void;
  loadForEdit: () => Promise<void>;
  save: () => Promise<Business | undefined>;
}

/**
 * Draft state for the Create/Edit Business form (Phase 2). The screen reads
 * and writes only through this store; the store is the sole caller of
 * `businessRepository` (Section 10 — UI never talks to a repository
 * directly).
 */
export const useBusinessFormStore = create<BusinessFormState>((set, get) => ({
  ...DEFAULT_FIELDS,
  mode: 'create',
  status: 'idle',
  businessId: undefined,
  fieldErrors: {},
  errorMessage: undefined,

  setField: (key, value) =>
    set((state) => ({
      [key]: value,
      fieldErrors: { ...state.fieldErrors, [key]: '' },
    } as Partial<BusinessFormState>)),

  cycleLogoColor: () =>
    set((state) => {
      const index = LOGO_COLOR_PALETTE.indexOf(state.logoColor);
      const next = LOGO_COLOR_PALETTE[(index + 1) % LOGO_COLOR_PALETTE.length];
      return { logoColor: next };
    }),

  startCreate: () => set({ ...DEFAULT_FIELDS, mode: 'create', status: 'idle', businessId: undefined, fieldErrors: {}, errorMessage: undefined }),

  loadForEdit: async () => {
    set({ mode: 'edit', status: 'loading', errorMessage: undefined });
    const result = await businessRepository.getBusiness();
    if (!result.isSuccess) {
      set({ status: 'error', errorMessage: result.error.message });
      return;
    }
    const business = result.value;
    if (!business) {
      set({ status: 'error', errorMessage: 'No business profile found to edit yet.' });
      return;
    }
    set({
      status: 'idle',
      businessId: business.id,
      name: business.name,
      logoInitial: business.logoInitial,
      logoColor: business.logoColor,
      address: business.address ?? '',
      phone: business.phone ?? '',
      email: business.email ?? '',
      website: business.website ?? '',
      currencyCode: business.currencyCode,
      taxNumber: business.taxNumber ?? '',
      invoicePrefix: business.invoicePrefix,
      fieldErrors: {},
    });
  },

  save: async () => {
    const state = get();
    set({ status: 'saving', errorMessage: undefined });
    const input = toInput(state);
    const result =
      state.mode === 'edit' && state.businessId
        ? await businessRepository.updateBusiness(state.businessId, input)
        : await businessRepository.createBusiness(input);

    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        errorMessage: failure.message,
        fieldErrors: failure instanceof ValidationFailure ? failure.fieldErrors ?? {} : {},
      });
      return undefined;
    }

    set({ status: 'saved', businessId: result.value.id, fieldErrors: {}, errorMessage: undefined });
    return result.value;
  },
}));
