import { Item } from '../entities/Item';

/**
 * Search (name/SKU) + invoice-type filtering for the Items List (Screen 7).
 * A pure use-case rather than logic inline in the screen (Section 10), called
 * from a `useMemo` selector the same way `computeInvoiceTotals` is used by
 * the Custom Invoice Type screen's live preview.
 *
 * `invoiceTypeId` of `null` means "All" — no type filter applied.
 */
export function filterItems(items: Item[], query: string, invoiceTypeId: string | null): Item[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (invoiceTypeId && item.invoiceTypeId !== invoiceTypeId) return false;
    if (!q) return true;
    return item.name.toLowerCase().includes(q) || (item.sku?.toLowerCase().includes(q) ?? false);
  });
}
