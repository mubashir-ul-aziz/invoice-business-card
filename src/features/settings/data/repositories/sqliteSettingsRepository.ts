import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, ValidationFailure } from '../../../../core/errors/failures';
import { AppSettings } from '../../domain/entities/AppSettings';
import { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import { syncObject } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { appSettings, APP_SETTINGS_SINGLETON_ID } from '../../../../database/schema';
import { appSettingsFromRow, now } from '../../../../database/mappers';
import { mockAppSettings } from '../datasources/mock/mockSettings';

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

/** SQLite-backed `SettingsRepository` (Phase 20), replacing `MockSettingsRepository` behind the same interface (Section 9). Singleton row keyed by `APP_SETTINGS_SINGLETON_ID`. */
export class SqliteSettingsRepository implements SettingsRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getSettings(): Promise<Result<AppSettings, Failure>> {
    try {
      const db = this.db;
      const [row] = db.select().from(appSettings).where(eq(appSettings.id, APP_SETTINGS_SINGLETON_ID)).all();
      if (!row) {
        // No settings row yet (a fresh, unseeded database) — fall back to the
        // shared default fixture rather than erroring the Settings screen out.
        return ok({ ...mockAppSettings });
      }
      const settings = appSettingsFromRow(row);
      syncObject(mockAppSettings, settings);
      return ok(settings);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load settings.', cause));
    }
  }

  async updateSettings(patch: Partial<AppSettings>): Promise<Result<AppSettings, Failure>> {
    const fieldErrors = validate(patch);
    if (Object.keys(fieldErrors).length > 0) {
      return err(new ValidationFailure('Fix the highlighted fields.', fieldErrors));
    }

    try {
      const db = this.db;
      const [existing] = db.select().from(appSettings).where(eq(appSettings.id, APP_SETTINGS_SINGLETON_ID)).all();
      const timestamp = now();

      if (existing) {
        db.update(appSettings).set({ ...patch, updatedAt: timestamp }).where(eq(appSettings.id, APP_SETTINGS_SINGLETON_ID)).run();
      } else {
        const merged = { ...mockAppSettings, ...patch };
        db.insert(appSettings)
          .values({
            id: APP_SETTINGS_SINGLETON_ID,
            defaultCurrency: merged.defaultCurrency,
            defaultTaxRate: merged.defaultTaxRate,
            defaultPaymentTermsDays: merged.defaultPaymentTermsDays,
            invoiceTemplateId: merged.invoiceTemplateId,
            backupFrequency: merged.backupFrequency,
            lastBackupAt: merged.lastBackupAt,
            cloudBackupEnabled: merged.cloudBackupEnabled,
            appLockEnabled: merged.appLockEnabled,
            biometricUnlockEnabled: merged.biometricUnlockEnabled,
            updatedAt: timestamp,
          })
          .run();
      }

      const [row] = db.select().from(appSettings).where(eq(appSettings.id, APP_SETTINGS_SINGLETON_ID)).all();
      const settings = appSettingsFromRow(row);
      syncObject(mockAppSettings, settings);
      return ok(settings);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save settings.', cause));
    }
  }
}
