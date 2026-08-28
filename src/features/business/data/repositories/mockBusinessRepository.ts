import { Result, ok, err } from '../../../../core/result/result';
import { Failure, ValidationFailure, NotFoundFailure } from '../../../../core/errors/failures';
import { Business } from '../../domain/entities/Business';
import { BusinessInput, BusinessRepository } from '../../domain/repositories/BusinessRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { mockBusiness } from '../datasources/mock/mockBusiness';

const SIMULATED_LATENCY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function validate(input: BusinessInput): ValidationFailure | undefined {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Business name is required';
  if (!input.email || !input.email.trim()) fieldErrors.email = 'Business email is required';
  else if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) fieldErrors.email = 'Enter a valid email address';
  if (Object.keys(fieldErrors).length > 0) {
    return new ValidationFailure('Please fix the highlighted fields.', fieldErrors);
  }
  return undefined;
}

/**
 * In-memory `BusinessRepository` for Phase 2 (Section: "Global rule for
 * Phases 1-19" — no SQLite yet). Holds a single business profile for the
 * lifetime of the app session; nothing is written to disk.
 *
 * Mutates the shared `mockBusiness` fixture in place (rather than a private
 * copy) so every other screen that reads it directly — Dashboard, Business
 * hub, Digital Card, Settings, Invoice screens, etc. (Section 9) — sees
 * onboarding/edit saves immediately, matching the Customer/Payment/Invoice
 * mock repositories' convention of mutating the shared datasource in place.
 */
export class MockBusinessRepository implements BusinessRepository {
  private business: Business | null = mockBusiness;

  async getBusiness(): Promise<Result<Business | null, Failure>> {
    return delay(ok(this.business));
  }

  async createBusiness(input: BusinessInput): Promise<Result<Business, Failure>> {
    const failure = validate(input);
    if (failure) return delay(err(failure));

    // MVP is single-business: onboarding fleshes out the already-seeded demo
    // profile rather than minting an unrelated new id (which would orphan
    // `mockSocialLinks`' hardcoded `businessId`, Section 8).
    const id = this.business?.id ?? generateId();
    const nextInvoiceNumber = this.business?.nextInvoiceNumber ?? 1;
    Object.assign(mockBusiness, input, { id, nextInvoiceNumber });
    this.business = mockBusiness;
    return delay(ok(mockBusiness));
  }

  async updateBusiness(id: string, input: BusinessInput): Promise<Result<Business, Failure>> {
    const failure = validate(input);
    if (failure) return delay(err(failure));
    if (!this.business || this.business.id !== id) {
      return delay(err(new NotFoundFailure('No business profile exists to update yet.')));
    }

    Object.assign(mockBusiness, input);
    return delay(ok(mockBusiness));
  }
}
