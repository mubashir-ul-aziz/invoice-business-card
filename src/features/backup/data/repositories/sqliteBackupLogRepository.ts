import { desc } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure } from '../../../../core/errors/failures';
import { BackupLogEntry } from '../../domain/entities/BackupLog';
import { BackupLogRepository } from '../../domain/repositories/BackupLogRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { syncArray } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { backupLogs } from '../../../../database/schema';
import { backupLogFromRow, now } from '../../../../database/mappers';
import { mockBackupLogs } from '../datasources/mock/mockBackupLogs';

/** SQLite-backed `BackupLogRepository` (Phase 20). Nothing calls `recordEntry` yet — that lands with Phase 22's real Google Drive backup. */
export class SqliteBackupLogRepository implements BackupLogRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getBackupLogs(): Promise<Result<BackupLogEntry[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(backupLogs).orderBy(desc(backupLogs.createdAt)).all();
      const list = rows.map(backupLogFromRow);
      syncArray(mockBackupLogs, list);
      return ok(list);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load backup history.', cause));
    }
  }

  async recordEntry(entry: Omit<BackupLogEntry, 'id' | 'createdAt'>): Promise<Result<BackupLogEntry, Failure>> {
    try {
      const db = this.db;
      const row = { id: generateId(), ...entry, createdAt: now() };
      db.insert(backupLogs).values(row).run();
      const rows = db.select().from(backupLogs).orderBy(desc(backupLogs.createdAt)).all();
      syncArray(mockBackupLogs, rows.map(backupLogFromRow));
      return ok(backupLogFromRow(row as typeof backupLogs.$inferSelect));
    } catch (cause) {
      return err(new DatabaseFailure('Could not record this backup attempt.', cause));
    }
  }
}
