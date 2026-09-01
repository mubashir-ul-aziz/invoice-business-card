import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Item } from '../../domain/entities/Item';
import { ItemInput, ItemRepository } from '../../domain/repositories/ItemRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { syncArray } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { items } from '../../../../database/schema';
import { itemFromRow, now } from '../../../../database/mappers';
import { mockItems } from '../datasources/mock/mockItems';

function validate(input: ItemInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Give this item a name.';
  if (!Number.isFinite(input.defaultPrice) || input.defaultPrice < 0) {
    fieldErrors.defaultPrice = 'Enter a valid, non-negative price.';
  }
  return fieldErrors;
}

function toClean(input: ItemInput) {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    sku: input.sku?.trim() || undefined,
    unit: input.unit?.trim() || undefined,
    defaultPrice: input.defaultPrice,
    taxRate: input.taxRate,
    weight: input.weight,
    length: input.length,
    width: input.width,
    height: input.height,
    invoiceTypeId: input.invoiceTypeId,
  };
}

/** SQLite-backed `ItemRepository` (Phase 20), replacing `MockItemRepository` behind the same interface (Section 9). */
export class SqliteItemRepository implements ItemRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getItems(): Promise<Result<Item[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(items).all();
      const list = rows.map(itemFromRow);
      syncArray(mockItems, list);
      return ok(list);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load items.', cause));
    }
  }

  async getItem(id: string): Promise<Result<Item, Failure>> {
    try {
      const db = this.db;
      const [row] = db.select().from(items).where(eq(items.id, id)).all();
      if (!row) return err(new NotFoundFailure('That item could not be found.'));
      return ok(itemFromRow(row));
    } catch (cause) {
      return err(new DatabaseFailure('Could not load that item.', cause));
    }
  }

  async createItem(input: ItemInput): Promise<Result<Item, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const id = generateId();
      const timestamp = now();
      db.insert(items)
        .values({ id, ...toClean(input), createdAt: timestamp, updatedAt: timestamp })
        .run();

      const [row] = db.select().from(items).where(eq(items.id, id)).all();
      const item = itemFromRow(row);
      const all = db.select().from(items).all();
      syncArray(mockItems, all.map(itemFromRow));
      return ok(item);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this item.', cause));
    }
  }

  async updateItem(id: string, input: ItemInput): Promise<Result<Item, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const [existing] = db.select().from(items).where(eq(items.id, id)).all();
      if (!existing) return err(new NotFoundFailure('That item could not be found.'));

      db.update(items).set({ ...toClean(input), updatedAt: now() }).where(eq(items.id, id)).run();

      const [row] = db.select().from(items).where(eq(items.id, id)).all();
      const item = itemFromRow(row);
      const all = db.select().from(items).all();
      syncArray(mockItems, all.map(itemFromRow));
      return ok(item);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save this item.', cause));
    }
  }
}
