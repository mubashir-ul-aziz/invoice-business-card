import { Result, ok, err } from '../../../../core/result/result';
import { Failure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Customer } from '../../domain/entities/Customer';
import { CustomerInput, CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { mockCustomers } from '../datasources/mock/mockCustomers';
import { generateId } from '../../../../core/utils/idGenerator';

const SIMULATED_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function validate(input: CustomerInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Give this customer a name.';
  return fieldErrors;
}

/** Trims the input down to `Customer` shape, dropping optional fields that came in empty. */
function toClean(input: CustomerInput): { name: string; phone?: string; email?: string; address?: string; notes?: string } {
  return {
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

/**
 * In-memory `CustomerRepository` for Phase 8 (Section: "Global rule for
 * Phases 1-19" — no SQLite yet). Reads/writes the shared `mockCustomers`
 * array in place (rather than a private copy) so the Customer Detail/History
 * screens — which still read that array directly, ahead of their own Phase 9
 * repository wiring — see the same data this repository creates/edits.
 */
export class MockCustomerRepository implements CustomerRepository {
  async getCustomers(): Promise<Result<Customer[], Failure>> {
    return delay(ok([...mockCustomers]));
  }

  async getCustomer(id: string): Promise<Result<Customer, Failure>> {
    const customer = mockCustomers.find((existing) => existing.id === id);
    if (!customer) return delay(err(new NotFoundFailure('That customer could not be found.')));
    return delay(ok(customer));
  }

  async createCustomer(input: CustomerInput): Promise<Result<Customer, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    const customer: Customer = { id: generateId(), ...toClean(input), createdAt: new Date().toISOString() };
    mockCustomers.push(customer);
    return delay(ok(customer));
  }

  async updateCustomer(id: string, input: CustomerInput): Promise<Result<Customer, Failure>> {
    const index = mockCustomers.findIndex((existing) => existing.id === id);
    if (index === -1) return delay(err(new NotFoundFailure('That customer could not be found.')));

    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    const updated: Customer = { ...mockCustomers[index], ...toClean(input) };
    mockCustomers[index] = updated;
    return delay(ok(updated));
  }
}
