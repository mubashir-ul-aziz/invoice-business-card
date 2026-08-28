import { Result, ok, err } from '../../../../core/result/result';
import { Failure, ValidationFailure } from '../../../../core/errors/failures';
import { AppSettings } from '../../domain/entities/AppSettings';
import { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import { mockAppSettings } from '../datasources/mock/mockSettings';

const SIMULATED_LATENCY_MS = 200;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), SIMULATED_LATENCY_MS));
}

function validate(patch: Partial<AppSettings>): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  if (patch.defaultTaxRate != null && (!Number.isFinite(patch.defaultTaxRate) || patch.defaultTaxRate < 0 || patch.defaultTaxRate > 100)) {
    fieldErrors.defaultTaxRate = 'Enter a tax rate between 0 and 100.';
  }
  if (patch.defaultPaymentTermsDays != null && (!Number.isFinite(patch.defaultPaymentTermsDays) || patch.defaultPaymentTermsDays <= 0)) {
    fieldErrors.defaultPaymentTermsDays = 'Enter a payment term greater than zero.';
  }
  if (patch.defaultCurrency != null && patch.defaultCurrency.trim().length === 0) {
    fieldErrors.defaultCurrency = 'Choose a currency.';
  }
  return fieldErrors;
}

/**
 * In-memory `SettingsRepository` for Phase 17 (no SQLite until Phase 20).
 * Mutates the shared `mockAppSettings` object in place, mirroring
 * `mockPaymentRepository`'s convention, so any screen still reading
 * `mockAppSettings` directly (e.g. the Business screen, ahead of a later
 * pass to route it through this repository too) sees the same values this
 * repository writes.
 */
export class MockSettingsRepository implements SettingsRepository {
  async getSettings(): Promise<Result<AppSettings, Failure>> {
    return delay(ok({ ...mockAppSettings }));
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<Result<AppSettings, Failure>> {
    const fieldErrors = validate(patch);
    if (Object.keys(fieldErrors).length > 0) {
      return delay(err(new ValidationFailure('Fix the highlighted fields.', fieldErrors)));
    }

    Object.assign(mockAppSettings, patch);
    return delay(ok({ ...mockAppSettings }));
  }
}
