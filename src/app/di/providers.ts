/**
 * Composition root for app-wide, cross-cutting wiring (as opposed to
 * feature-local Zustand stores, which live in
 * `features/*\/presentation/state` and are imported directly by that
 * feature's UI).
 *
 * This is where mock-vs-real repository instances get selected once a
 * feature's provider is added (Phase 2+): a screen depends only on the
 * repository interface from `features/*\/domain`, and this file decides
 * which implementation (`Mock*Repository` now, `Sqlite*Repository` from
 * Phase 20 on) actually gets constructed — swapping is a one-line change
 * here, never a UI change (Section 9).
 *
 * Intentionally empty in Phase 0: no repositories exist yet to wire.
 */
export {};
