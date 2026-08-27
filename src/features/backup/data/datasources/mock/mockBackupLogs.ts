import { BackupLogEntry } from '../../../domain/entities/BackupLog';

export const mockBackupLogs: BackupLogEntry[] = [
  { id: 'backup-1', type: 'google_drive', direction: 'backup', status: 'success', fileName: 'invora-backup-2026-08-25.db', sizeBytes: 482_300, createdAt: '2026-08-25T09:12:00' },
  { id: 'backup-2', type: 'google_drive', direction: 'backup', status: 'success', fileName: 'invora-backup-2026-08-18.db', sizeBytes: 468_900, createdAt: '2026-08-18T09:10:00' },
  { id: 'backup-3', type: 'google_drive', direction: 'backup', status: 'failed', fileName: 'invora-backup-2026-08-11.db', errorMessage: 'Network unavailable during upload.', createdAt: '2026-08-11T09:11:00' },
  { id: 'backup-4', type: 'google_drive', direction: 'restore', status: 'success', fileName: 'invora-backup-2026-07-14.db', sizeBytes: 411_200, createdAt: '2026-07-15T14:02:00' },
  { id: 'backup-5', type: 'google_drive', direction: 'backup', status: 'success', fileName: 'invora-backup-2026-08-04.db', sizeBytes: 455_100, createdAt: '2026-08-04T09:09:00' },
];
