export type BackupType = 'google_drive' | 'cloud' | 'local_export';
export type BackupDirection = 'backup' | 'restore';
export type BackupStatus = 'success' | 'failed' | 'in_progress';

export interface BackupLogEntry {
  id: string;
  type: BackupType;
  direction: BackupDirection;
  status: BackupStatus;
  fileName?: string;
  sizeBytes?: number;
  errorMessage?: string;
  createdAt: string;
}
