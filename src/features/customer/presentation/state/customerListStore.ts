import { create } from 'zustand';
import { customerRepository } from '../../../../app/di/providers';
import { Customer } from '../../domain/entities/Customer';
import { CustomerActivity, computeCustomerActivity } from '../../domain/usecases/customerActivity';
import { CustomerFilter } from '../../domain/usecases/filterCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';

export type CustomerListStatus = 'idle' | 'loading' | 'loaded' | 'error';
export type { CustomerFilter } from '../../domain/usecases/filterCustomers';

interface CustomerListState {
  customers: Customer[];
  /** Invoice count / balance / overdue flag per customer id (Screen 9 display fields). */
  activityByCustomerId: Record<string, CustomerActivity>;
  status: CustomerListStatus;
  errorMessage?: string;
  searchQuery: string;
  filter: CustomerFilter;

  load: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: CustomerFilter) => void;
}

/**
 * Backs the Customers List (Screen 9, Phase 8). Holds the raw customer list
 * + per-customer activity summary; the actual search/filter narrowing is
 * done by the pure `filterCustomers` use-case, called from the screen
 * (Section 10 — the store holds state, use-cases hold derivation logic).
 *
 * Invoices/Payments are read from their mock datasources directly — those
 * features don't have their own repository yet (Phase 9/13/18), which the
 * plan explicitly allows ahead of schedule (Section: Phase 3 acceptance
 * criteria); the balance/invoice-count math itself stays in
 * `computeCustomerActivity`, not inline here.
 */
export const useCustomerListStore = create<CustomerListState>((set) => ({
  customers: [],
  activityByCustomerId: {},
  status: 'idle',
  errorMessage: undefined,
  searchQuery: '',
  filter: 'all',

  load: async () => {
    set({ status: 'loading', errorMessage: undefined });
    const result = await customerRepository.getCustomers();

    if (!result.isSuccess) {
      set({ status: 'error', errorMessage: result.error.message });
      return;
    }

    const activityByCustomerId: Record<string, CustomerActivity> = {};
    for (const customer of result.value) {
      activityByCustomerId[customer.id] = computeCustomerActivity(customer.id, mockInvoices, mockPayments);
    }

    set({ status: 'loaded', customers: result.value, activityByCustomerId });
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
}));
