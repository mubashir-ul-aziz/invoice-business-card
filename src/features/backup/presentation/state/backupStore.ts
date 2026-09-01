import { create } from 'zustand';
import {
  googleDriveBackupRepository,
  backupLogRepository,
  settingsRepository,
  businessRepository,
  invoiceTypeRepository,
  customerRepository,
  itemRepository,
  invoiceRepository,
  paymentRepository,
} from '../../../../app/di/providers';
import { hydrateSettingsStore } from '../../../settings/presentation/state/settingsStore';
import { DriveAuthStatus, DriveBackupFile } from '../../domain/entities/GoogleDriveBackup';
import { BackupLogEntry } from '../../domain/entities/BackupLog';

export type BackupActionStatus = 'idle' | 'working' | 'error';

interface BackupState {
  authStatus: DriveAuthStatus;
  driveBackups: DriveBackupFile[];
  logs: BackupLogEntry[];

  connectStatus: BackupActionStatus;
  backupStatus: BackupActionStatus;
  restoringId: string | null;
  driveListStatus: BackupActionStatus;
  logsStatus: BackupActionStatus;
  errorMessage?: string;

  loadAuthStatus: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  backupNow: () => Promise<void>;
  loadDriveBackups: () => Promise<void>;
  restoreBackup: (fileId: string) => Promise<boolean>;
  loadLogs: () => Promise<void>;
}

/**
 * Re-runs the same set of repository reads `App.tsx`'s `bootstrap()` does
 * (Section 10 — an explicit re-fetch after every write, never implicit).
 * Needed once, right after a restore: every table in the local database was
 * just replaced wholesale, so every `mock*` read-cache and the Settings
 * store need to catch up before the app's other screens are next focused.
 */
async function reloadAllDataAfterRestore(): Promise<void> {
  const [, , , , , , settingsResult] = await Promise.all([
    businessRepository.getBusiness(),
    invoiceTypeRepository.getInvoiceTypes(),
    customerRepository.getCustomers(),
    itemRepository.getItems(),
    invoiceRepository.getInvoices(),
    paymentRepository.getPayments(),
    settingsRepository.getSettings(),
  ]);
  if (settingsResult.isSuccess) hydrateSettingsStore(settingsResult.value);
}

/**
 * Backs Screen 22's real Google Drive connect/backup/restore actions (Phase
 * 22), replacing the UI-only simulation the mock-data phases shipped with.
 * The local `BackupLog` history (`logs`) doubles as this screen's
 * success/failure status line (Section 33) — no separate "last backup
 * failed" flag anywhere else.
 */
export const useBackupStore = create<BackupState>((set, get) => ({
  authStatus: { connected: false },
  driveBackups: [],
  logs: [],

  connectStatus: 'idle',
  backupStatus: 'idle',
  restoringId: null,
  driveListStatus: 'idle',
  logsStatus: 'idle',
  errorMessage: undefined,

  loadAuthStatus: async () => {
    const result = await googleDriveBackupRepository.getAuthStatus();
    if (result.isSuccess) set({ authStatus: result.value });
  },

  connect: async () => {
    set({ connectStatus: 'working', errorMessage: undefined });
    const result = await googleDriveBackupRepository.connect();
    if (!result.isSuccess) {
      set({ connectStatus: 'error', errorMessage: result.error.message });
      return;
    }
    set({ connectStatus: 'idle', authStatus: result.value });
    await get().loadDriveBackups();
  },

  disconnect: async () => {
    set({ connectStatus: 'working', errorMessage: undefined });
    const result = await googleDriveBackupRepository.disconnect();
    if (!result.isSuccess) {
      set({ connectStatus: 'error', errorMessage: result.error.message });
      return;
    }
    set({ connectStatus: 'idle', authStatus: { connected: false }, driveBackups: [] });
  },

  backupNow: async () => {
    set({ backupStatus: 'working', errorMessage: undefined });
    const result = await googleDriveBackupRepository.backupNow();
    if (!result.isSuccess) {
      set({ backupStatus: 'error', errorMessage: result.error.message });
      await get().loadLogs();
      return;
    }
    set({ backupStatus: 'idle' });
    const settings = await settingsRepository.getSettings();
    if (settings.isSuccess) hydrateSettingsStore(settings.value);
    await Promise.all([get().loadLogs(), get().loadDriveBackups()]);
  },

  loadDriveBackups: async () => {
    set({ driveListStatus: 'working' });
    const result = await googleDriveBackupRepository.listBackups();
    if (!result.isSuccess) {
      set({ driveListStatus: 'error', errorMessage: result.error.message });
      return;
    }
    set({ driveListStatus: 'idle', driveBackups: result.value });
  },

  restoreBackup: async (fileId) => {
    set({ restoringId: fileId, errorMessage: undefined });
    const result = await googleDriveBackupRepository.restoreBackup(fileId);
    if (!result.isSuccess) {
      set({ restoringId: null, errorMessage: result.error.message });
      await get().loadLogs();
      return false;
    }
    set({ restoringId: null });
    await reloadAllDataAfterRestore();
    await get().loadLogs();
    return true;
  },

  loadLogs: async () => {
    set({ logsStatus: 'working' });
    const result = await backupLogRepository.getBackupLogs();
    if (!result.isSuccess) {
      set({ logsStatus: 'error', errorMessage: result.error.message });
      return;
    }
    set({ logsStatus: 'idle', logs: result.value });
  },
}));
