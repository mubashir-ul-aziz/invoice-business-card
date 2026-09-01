import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Customer } from '../../domain/entities/Customer';
import { CustomerInput, CustomerRepository } from '../../domain/repositories/CustomerRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { syncArray } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { customers } from '../../../../database/schema';
import { customerFromRow, now } from '../../../../database/mappers';
import { mockCustomers } from '../datasources/mock/mockCustomers';

function validate(input: CustomerInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Give this customer a name.';
  return fieldErrors;
}

function toClean(input: CustomerInput) {
  return {
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    address: input.address?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
  };
}

/** SQLite-backed `CustomerRepository` (Phase 20), replacing `MockCustomerRepository` behind the same interface (Section 9). */
export class SqliteCustomerRepository implements CustomerRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getCustomers(): Promise<Result<Customer[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(customers).all();
      const list = rows.map(customerFromRow);
      syncArray(mockCustomers, list);
      return ok(list);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load customers.', cause));
    }
  }

  async getCustomer(id: string): Promise<Result<Customer, Failure>> {
    try {
      const db = this.db;
      const [row] = db.select().from(customers).where(eq(customers.id, id)).all();
      if (!row) return err(new NotFoundFailure('That customer could not be found.'));
      return ok(customerFromRow(row));
    } catch (cause) {
      return err(new DatabaseFailure('Could not load that customer.', cause));
    }
  }

  async createCustomer(input: CustomerInput): Promise<Result<Customer, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const id = generateId();
      const createdAt = now();
      const clean = toClean(input);
      db.insert(customers)
        .values({ id, ...clean, createdAt, updatedAt: createdAt })
        .run();

      const [row] = db.select().from(customers).where(eq(customers.id, id)).all();
      const customer = customerFromRow(row);
      const all = db.select().from(customers).all();
      syncArray(mockCustomers, all.map(customerFromRow));
      return ok(customer);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this customer.', cause));
    }
  }

  async updateCustomer(id: string, input: CustomerInput): Promise<Result<Customer, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const [existing] = db.select().from(customers).where(eq(customers.id, id)).all();
      if (!existing) return err(new NotFoundFailure('That customer could not be found.'));

      const clean = toClean(input);
      db.update(customers).set({ ...clean, updatedAt: now() }).where(eq(customers.id, id)).run();

      const [row] = db.select().from(customers).where(eq(customers.id, id)).all();
      const customer = customerFromRow(row);
      const all = db.select().from(customers).all();
      syncArray(mockCustomers, all.map(customerFromRow));
      return ok(customer);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this customer.', cause));
    }
  }
}
