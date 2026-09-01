import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { BackupLogEntry } from '../entities/BackupLog';
import { DriveAuthStatus, DriveBackupFile } from '../entities/GoogleDriveBackup';

/**
 * Real Google Drive backup/restore boundary (Section 12, 13 — Phase 22).
 * Every method returns a `Result` rather than throwing (Section 31);
 * network/auth failures are always classified as `NetworkFailure`/
 * `BackupFailure`, never `DatabaseFailure`, so the UI can reassure the user
 * their local data is safe (Section 11) whenever one of these fails.
 *
 * Drive is a backup *destination* — nothing here is ever read from on a
 * normal app-usage path; only the Backup & Restore screen and the
 * once-per-launch automatic-backup check call it (Section 12).
 */
export interface GoogleDriveBackupRepository {
  /** Whether the app currently holds a valid (or refreshable) Drive connection, and which account it's for. */
  getAuthStatus(): Promise<Result<DriveAuthStatus, Failure>>;

  /** Runs the Google sign-in flow and stores the resulting tokens (Section 34 — via `expo-secure-store`). */
  connect(): Promise<Result<DriveAuthStatus, Failure>>;

  /** Revokes/discards the stored connection. Never touches local app data. */
  disconnect(): Promise<Result<void, Failure>>;

  /**
   * Builds a fresh snapshot of the local database, uploads it to the user's
   * "Invora Backups" Drive folder, and records the attempt in `BackupLog`
   * (Section 33) — on both success and failure. Used by both "Backup Now"
   * and the automatic-backup check.
   */
  backupNow(): Promise<Result<BackupLogEntry, Failure>>;

  /** Lists backups in the Drive folder, most recent first (Screen 22's restore picker). */
  listBackups(): Promise<Result<DriveBackupFile[], Failure>>;

  /**
   * Downloads, validates, and restores one backup (Section 33 safety
   * strategy: pre-restore local safety snapshot, atomic apply, automatic
   * rollback on any failure). Records the attempt in `BackupLog` regardless
   * of outcome.
   */
  restoreBackup(fileId: string): Promise<Result<BackupLogEntry, Failure>>;
}
