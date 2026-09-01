import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

/** BackupLog (Section 7) — standalone audit table, no FK required (Section 8). */
export const backupLogs = sqliteTable(
  'backup_logs',
  {
    id: text('id').primaryKey(),
    type: text('type', { enum: ['google_drive', 'cloud', 'local_export'] }).notNull(),
    direction: text('direction', { enum: ['backup', 'restore'] }).notNull(),
    status: text('status', { enum: ['success', 'failed', 'in_progress'] }).notNull(),
    fileName: text('file_name'),
    sizeBytes: integer('size_bytes'),
    errorMessage: text('error_message'),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('backup_logs_created_at_idx').on(table.createdAt)],
);
