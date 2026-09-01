/**
 * Backup file format (Section 12/13/33). Bumped whenever the shape of a
 * snapshot's `tables` changes in a way older builds can't read — every
 * snapshot this build writes carries this number, and `formatVersion >
 * CURRENT` on restore is treated as "incompatible backup version" rather
 * than corrupted (Section 33 — the two are surfaced with different,
 * user-friendly messages).
 */
export const BACKUP_FORMAT_VERSION = 1;

/** The visible Drive folder backups are written to (Section 13 default: transparency over hidden app-data). */
export const BACKUP_DRIVE_FOLDER_NAME = 'Invora Backups';

export interface DriveAuthStatus {
  connected: boolean;
  accountEmail?: string;
}

/** One backup file as listed from Drive (Section 13 — "lists available backups from Drive by date"). */
export interface DriveBackupFile {
  id: string;
  name: string;
  createdAt: string;
  sizeBytes: number;
  /** Parsed from the filename; `null` when it can't be determined without downloading (e.g. a foreign file dropped into the folder). */
  formatVersion: number | null;
  /** `false` when `formatVersion` is already known to be newer than this build supports — surfaced before the user wastes a download on it. */
  isSupportedVersion: boolean;
}
