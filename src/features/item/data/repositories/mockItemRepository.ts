import { Result, ok, err } from '../../../../core/result/result';
import { Failure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { Item } from '../../domain/entities/Item';
import { ItemInput, ItemRepository } from '../../domain/repositories/ItemRepository';
import { mockItems } from '../datasources/mock/mockItems';
import { generateId } from '../../../../core/utils/idGenerator';

const SIMULATED_LATENCY_MS = 250;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function validate(input: ItemInput): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Give this item a name.';
  if (!Number.isFinite(input.defaultPrice) || input.defaultPrice < 0) {
    fieldErrors.defaultPrice = 'Enter a valid, non-negative price.';
  }
  return fieldErrors;
}

/**
 * In-memory `ItemRepository` for Phase 7 (Section: "Global rule for Phases
 * 1-19" — no SQLite yet). Holds the seeded catalog for the lifetime of the
 * app session; nothing is written to disk.
 */
export class MockItemRepository implements ItemRepository {
  private readonly items: Item[] = [...mockItems];

  async getItems(): Promise<Result<Item[], Failure>> {
    return delay(ok([...this.items]));
  }

  async getItem(id: string): Promise<Result<Item, Failure>> {
    const item = this.items.find((existing) => existing.id === id);
    if (!item) return delay(err(new NotFoundFailure('That item could not be found.')));
    return delay(ok(item));
  }

  async createItem(input: ItemInput): Promise<Result<Item, Failure>> {
    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    const item: Item = { id: generateId(), ...toClean(input) };
    this.items.push(item);
    return delay(ok(item));
  }

  async updateItem(id: string, input: ItemInput): Promise<Result<Item, Failure>> {
    const index = this.items.findIndex((existing) => existing.id === id);
    if (index === -1) return delay(err(new NotFoundFailure('That item could not be found.')));

    const fieldErrors = validate(input);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    const updated: Item = { id, ...toClean(input) };
    this.items[index] = updated;
    return delay(ok(updated));
  }
}

/** Trims the input down to `Item` shape, dropping optional fields that came in empty. */
function toClean(input: ItemInput): Omit<Item, 'id'> {
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
