/**
 * Orchestrates real Google Drive backup/restore (Section 12, 13; Phase 22)
 * on top of three narrow, independently-injectable collaborators:
 *  - `GoogleDriveAuthClient`  — OAuth connection (googleDriveAuthDataSource.ts)
 *  - `GoogleDriveFileClient`  — Drive REST calls (googleDriveApiDataSource.ts)
 *  - the local snapshot builder/validator/applier (databaseSnapshotDataSource.ts)
 * plus `BackupLogRepository`/`SettingsRepository` for the bookkeeping every
 * attempt needs (Section 33). Every collaborator defaults to its real
 * implementation but can be swapped in a test, so this class's actual
 * decision logic — validation, rollback, failure classification, logging —
 * is fully unit-testable without any network/native module involved
 * (Section 35).
 */
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, BackupFailure, NetworkFailure } from '../../../../core/errors/failures';
import { generateId } from '../../../../core/utils/idGenerator';
import { BackupLogEntry, BackupDirection } from '../../domain/entities/BackupLog';
import { BackupLogRepository } from '../../domain/repositories/BackupLogRepository';
import { GoogleDriveBackupRepository } from '../../domain/repositories/GoogleDriveBackupRepository';
import { BACKUP_FORMAT_VERSION, DriveAuthStatus, DriveBackupFile } from '../../domain/entities/GoogleDriveBackup';
import { SettingsRepository } from '../../../settings/domain/repositories/SettingsRepository';
import {
  GoogleDriveAuthClient,
  ExpoGoogleDriveAuthClient,
  DriveNotConfiguredError,
  DriveSignInCancelledError,
} from '../datasources/remote/googleDriveAuthDataSource';
import { GoogleDriveFileClient, GoogleDriveRestFileClient } from '../datasources/remote/googleDriveApiDataSource';
import { buildBackupSnapshot, validateBackupSnapshot, applyBackupSnapshot } from '../datasources/local/databaseSnapshotDataSource';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { now } from '../../../../database/mappers';

function backupFileName(createdAt: string): string {
  const safe = createdAt.replace(/[:.]/g, '-');
  return `invora-backup-v${BACKUP_FORMAT_VERSION}-${safe}.json`;
}

function parseVersionFromFileName(name: string): number | null {
  const match = /^invora-backup-v(\d+)-/.exec(name);
  return match ? Number(match[1]) : null;
}

/**
 * Turns any thrown value from the auth/file datasources into a
 * user-friendly, correctly-kinded `Failure` (Section 31) — config/consent
 * problems are `BackupFailure`s, everything else (network drops, Drive API
 * errors) is a `NetworkFailure` that explicitly reassures the user their
 * local data is untouched (Section 11).
 */
function classifyBackupError(cause: unknown): Failure {
  if (cause instanceof DriveNotConfiguredError || cause instanceof DriveSignInCancelledError) {
    return new BackupFailure(cause.message);
  }
  const raw = cause instanceof Error ? cause.message : 'An unexpected error occurred.';
  return new NetworkFailure(`${raw} Your local data is safe.`, cause);
}

/** SQLite-backed local data + real Google Drive (Phase 22) implementation of `GoogleDriveBackupRepository`, wired in `src/app/di/providers.ts`. */
export class GoogleDriveBackupRepositoryImpl implements GoogleDriveBackupRepository {
  constructor(
    private readonly backupLogRepository: BackupLogRepository,
    private readonly settingsRepository: SettingsRepository,
    private readonly authClient: GoogleDriveAuthClient = new ExpoGoogleDriveAuthClient(),
    private readonly fileClient: GoogleDriveFileClient = new GoogleDriveRestFileClient(),
    private readonly db: AnyInvoraDb = getDb(),
  ) {}

  async getAuthStatus(): Promise<Result<DriveAuthStatus, Failure>> {
    try {
      return ok(await this.authClient.getStatus());
    } catch (cause) {
      return err(classifyBackupError(cause));
    }
  }

  async connect(): Promise<Result<DriveAuthStatus, Failure>> {
    try {
      const { accountEmail } = await this.authClient.connect();
      return ok({ connected: true, accountEmail });
    } catch (cause) {
      return err(classifyBackupError(cause));
    }
  }

  async disconnect(): Promise<Result<void, Failure>> {
    try {
      await this.authClient.disconnect();
      return ok(undefined);
    } catch (cause) {
      return err(classifyBackupError(cause));
    }
  }

  async backupNow(): Promise<Result<BackupLogEntry, Failure>> {
    try {
      const accessToken = await this.authClient.getValidAccessToken();
      const snapshot = buildBackupSnapshot(this.db);
      const contentJson = JSON.stringify(snapshot);

      const folderId = await this.fileClient.ensureBackupFolder(accessToken);
      const uploaded = await this.fileClient.uploadBackupFile(accessToken, folderId, backupFileName(snapshot.createdAt), contentJson);

      // Best-effort — a failure here is a minor local bookkeeping gap, not a
      // reason to tell the user their (already-uploaded) backup failed.
      await this.settingsRepository.updateSettings({ lastBackupAt: snapshot.createdAt }).catch(() => undefined);

      const entry = await this.logAttempt('backup', 'success', { fileName: uploaded.name, sizeBytes: uploaded.sizeBytes });
      return ok(entry);
    } catch (cause) {
      const failure = classifyBackupError(cause);
      await this.logAttempt('backup', 'failed', { errorMessage: failure.message });
      return err(failure);
    }
  }

  async listBackups(): Promise<Result<DriveBackupFile[], Failure>> {
    try {
      const accessToken = await this.authClient.getValidAccessToken();
      const folderId = await this.fileClient.ensureBackupFolder(accessToken);
      const files = await this.fileClient.listBackupFiles(accessToken, folderId);
      const list: DriveBackupFile[] = files.map((file) => {
        const formatVersion = parseVersionFromFileName(file.name);
        return {
          id: file.id,
          name: file.name,
          createdAt: file.createdAt,
          sizeBytes: file.sizeBytes,
          formatVersion,
          isSupportedVersion: formatVersion === null || formatVersion <= BACKUP_FORMAT_VERSION,
        };
      });
      return ok(list);
    } catch (cause) {
      return err(classifyBackupError(cause));
    }
  }

  async restoreBackup(fileId: string): Promise<Result<BackupLogEntry, Failure>> {
    try {
      const accessToken = await this.authClient.getValidAccessToken();
      const rawJson = await this.fileClient.downloadBackupFile(accessToken, fileId);

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        const failure = new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.');
        await this.logAttempt('restore', 'failed', { errorMessage: failure.message });
        return err(failure);
      }

      const validated = validateBackupSnapshot(parsed);
      if (!validated.isSuccess) {
        await this.logAttempt('restore', 'failed', { errorMessage: validated.error.message });
        return err(validated.error);
      }

      // Pre-restore safety snapshot (Section 33) — held in memory only,
      // reapplied below if the actual restore throws. `applyBackupSnapshot`
      // itself already runs inside one SQLite transaction that rolls back to
      // exactly this same state on any thrown error (Section 21's
      // transactional guarantee); this is the explicit second layer Section
      // 33 asks for, in case that guarantee is ever bypassed by a future
      // change to how it's called.
      const safety = buildBackupSnapshot(this.db);
      try {
        applyBackupSnapshot(this.db, validated.value);
      } catch {
        try {
          applyBackupSnapshot(this.db, safety);
        } catch {
          // The transaction's own rollback already protects the data even
          // if this explicit reapply somehow also fails — surfacing the
          // original error is more useful to the user than this one.
        }
        const failure = new BackupFailure('Restore failed partway through and was rolled back — your previous data is unchanged.');
        await this.logAttempt('restore', 'failed', { errorMessage: failure.message });
        return err(failure);
      }

      const entry = await this.logAttempt('restore', 'success', { sizeBytes: rawJson.length });
      return ok(entry);
    } catch (cause) {
      const failure = classifyBackupError(cause);
      await this.logAttempt('restore', 'failed', { errorMessage: failure.message });
      return err(failure);
    }
  }

  /**
   * Records one BackupLog entry (Section 33 — every attempt, success or
   * failure) and always returns a usable entry even if the log write itself
   * fails, so a logging hiccup never masks an otherwise-successful (or
   * already-reported-failed) backup/restore outcome from the caller.
   */
  private async logAttempt(
    direction: BackupDirection,
    status: 'success' | 'failed',
    extra: Partial<Pick<BackupLogEntry, 'fileName' | 'sizeBytes' | 'errorMessage'>>,
  ): Promise<BackupLogEntry> {
    const result = await this.backupLogRepository.recordEntry({ type: 'google_drive', direction, status, ...extra });
    if (result.isSuccess) return result.value;
    return { id: generateId(), type: 'google_drive', direction, status, createdAt: now(), ...extra };
  }
}
