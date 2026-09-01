/**
 * Keeps a shared mutable array/object "cache" in sync with a freshly-read
 * value, without changing its reference identity.
 *
 * A handful of screens read the feature-level `mock*` fixtures
 * (`mockBusiness`, `mockInvoices`, ...) directly rather than through a
 * repository/store — a convention already established in the mock-data
 * phases specifically so a write made through one repository call is
 * immediately visible to every other direct reader (see e.g.
 * `mockBusinessRepository`'s class doc). The SQLite repositories introduced
 * in Phase 20 keep that convention alive: every read/write mutates the
 * corresponding shared fixture in place via these helpers, so those
 * call sites keep working with zero UI changes while SQLite becomes the
 * real, persisted source of truth behind them (Section 9: "this interface,
 * and every caller of it, stays unchanged").
 */

/** Replaces the contents of `target` with `source`, keeping `target`'s array reference stable. */
export function syncArray<T>(target: T[], source: readonly T[]): void {
  target.length = 0;
  target.push(...source);
}

/** Copies every field of `source` onto `target`, keeping `target`'s object reference stable. */
export function syncObject<T extends object>(target: T, source: T): void {
  Object.assign(target, source);
}
