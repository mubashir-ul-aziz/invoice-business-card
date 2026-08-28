import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { Business } from '../entities/Business';

/** Fields the Create/Edit Business form can submit. `id` is added by the repository on create. */
export interface BusinessInput {
  name: string;
  logoInitial: string;
  logoColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currencyCode: string;
  taxNumber?: string;
  invoicePrefix: string;
}

/**
 * Business persistence boundary (Section 9). Phase 2 is backed by
 * `mockBusinessRepository` (in-memory); Phase 20 swaps in a SQLite-backed
 * implementation via `src/app/di/providers.ts` only — this interface, and
 * every caller of it, stays unchanged.
 */
export interface BusinessRepository {
  /** The single business profile this device is set up for, or null before first-run setup completes. */
  getBusiness(): Promise<Result<Business | null, Failure>>;
  createBusiness(input: BusinessInput): Promise<Result<Business, Failure>>;
  updateBusiness(id: string, input: BusinessInput): Promise<Result<Business, Failure>>;
}
