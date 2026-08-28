import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { Item } from '../entities/Item';

/** Fields the Create/Edit Item form (Screen 8) submits. `id` is added by the repository on create. */
export interface ItemInput {
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  defaultPrice: number;
  taxRate?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  invoiceTypeId?: string;
}

/**
 * Item persistence boundary (Section 9). Phase 7 is backed by
 * `mockItemRepository` (in-memory); Phase 20 swaps in a SQLite-backed
 * implementation via `src/app/di/providers.ts` only — this interface, and
 * every caller of it (the item list/form Zustand stores), stays unchanged.
 */
export interface ItemRepository {
  /** The full item catalog (Screen 7 filters/searches this client-side, per the mock-phase list convention). */
  getItems(): Promise<Result<Item[], Failure>>;

  /** A single item by id, for the Edit Item flow (Screen 8). */
  getItem(id: string): Promise<Result<Item, Failure>>;

  createItem(input: ItemInput): Promise<Result<Item, Failure>>;

  updateItem(id: string, input: ItemInput): Promise<Result<Item, Failure>>;
}
