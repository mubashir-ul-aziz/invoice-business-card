import { AppSettings } from '../../../settings/domain/entities/AppSettings';

const FREQUENCY_INTERVAL_MS: Record<'daily' | 'weekly', number> = {
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/**
 * Pure decision function for the automatic-backup check run once per launch
 * (Section 13 — "runs on a schedule... when the app is opened"). Kept as a
 * domain use-case, not inline in a store, so it's unit-testable without any
 * repository/network involved (Section 35).
 *
 * `manual` always means "disabled" (Screen 22's frequency selector doubles
 * as the enable/disable toggle — there's no separate boolean for it,
 * Section 7's `AppSettings.backupFrequency` is the single source of truth).
 * A missing/unparseable `lastBackupAt` is treated as "due" so a fresh
 * install with auto-backup already enabled backs up on its first launch.
 */
export function shouldRunAutomaticBackup(
  settings: Pick<AppSettings, 'backupFrequency' | 'lastBackupAt'>,
  now: Date = new Date(),
): boolean {
  if (settings.backupFrequency === 'manual') return false;

  if (!settings.lastBackupAt) return true;
  const last = new Date(settings.lastBackupAt).getTime();
  if (Number.isNaN(last)) return true;

  return now.getTime() - last >= FREQUENCY_INTERVAL_MS[settings.backupFrequency];
}
