import { Result } from '../../../../core/result/result';
import { Failure } from '../../../../core/errors/failures';
import { BackupLogEntry } from '../entities/BackupLog';

/**
 * BackupLog persistence boundary (Section 9, Section 33 — "every backup and
 * restore attempt... written to BackupLog"). Introduced in Phase 20 purely
 * as a read/append log store; the Google Drive/cloud backup flows that
 * would actually call `recordEntry` are explicitly out of scope until
 * Phases 22/23 (per this phase's instructions) — `BackupRestoreScreen`'s
 * "Backup Now" stays a UI-only simulation until then.
 */
export interface BackupLogRepository {
  /** Every backup/restore attempt, most recent first (Screen 22's history list). */
  getBackupLogs(): Promise<Result<BackupLogEntry[], Failure>>;

  /** Appends one backup/restore attempt to the log (Section 33) — not yet called anywhere until Phase 22. */
  recordEntry(entry: Omit<BackupLogEntry, 'id' | 'createdAt'>): Promise<Result<BackupLogEntry, Failure>>;
}
