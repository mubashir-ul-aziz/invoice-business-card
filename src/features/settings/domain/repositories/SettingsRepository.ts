import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { AppSettings } from '../entities/AppSettings';

/**
 * Settings persistence boundary (Section 9, Phase 17). The Settings screen —
 * and every other screen that reads app-level defaults (currency, tax,
 * template, security toggles) — goes through this interface rather than the
 * mock datasource directly, so Phase 20 swaps in a SQLite-backed
 * implementation via `src/app/di/providers.ts` only.
 */
export interface SettingsRepository {
  getSettings(): Promise<Result<AppSettings, Failure>>;

  /** Partial update — only the passed fields change; everything else is left as-is. */
  updateSettings(patch: Partial<AppSettings>): Promise<Result<AppSettings, Failure>>;
}
