import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { Customer } from '../entities/Customer';

/** Fields the Create/Edit Customer form (Screen 10) submits. `id`/`createdAt` are set by the repository on create. */
export interface CustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

/**
 * Customer persistence boundary (Section 9). Phase 8 is backed by
 * `mockCustomerRepository` (in-memory); Phase 20 swaps in a SQLite-backed
 * implementation via `src/app/di/providers.ts` only — this interface, and
 * every caller of it (the customer list/form Zustand stores), stays
 * unchanged.
 */
export interface CustomerRepository {
  /** The full customer list (Screen 9 searches/filters this client-side, per the mock-phase list convention). */
  getCustomers(): Promise<Result<Customer[], Failure>>;

  /** A single customer by id, for the Edit Customer flow (Screen 10). */
  getCustomer(id: string): Promise<Result<Customer, Failure>>;

  createCustomer(input: CustomerInput): Promise<Result<Customer, Failure>>;

  updateCustomer(id: string, input: CustomerInput): Promise<Result<Customer, Failure>>;
}
