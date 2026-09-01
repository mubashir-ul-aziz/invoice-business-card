import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { seedDatabase } from '../../../../../database/seed';
import * as schema from '../../../../../database/schema';
import { SqliteBackupLogRepository } from '../sqliteBackupLogRepository';
import { SqliteSettingsRepository } from '../../../../settings/data/repositories/sqliteSettingsRepository';
import { GoogleDriveBackupRepositoryImpl } from '../googleDriveBackupRepository';
import { GoogleDriveAuthClient, DriveNotConfiguredError } from '../../datasources/remote/googleDriveAuthDataSource';
import { GoogleDriveFileClient, DriveFileMetadata } from '../../datasources/remote/googleDriveApiDataSource';
import { buildBackupSnapshot } from '../../datasources/local/databaseSnapshotDataSource';

class FakeAuthClient implements GoogleDriveAuthClient {
  connected = true;
  accessToken = 'fake-access-token';
  tokenError: Error | null = null;

  async getStatus() {
    return { connected: this.connected, accountEmail: this.connected ? 'owner@example.com' : undefined };
  }
  async connect() {
    if (this.tokenError) throw this.tokenError;
    this.connected = true;
    return { accountEmail: 'owner@example.com' };
  }
  async disconnect() {
    this.connected = false;
  }
  async getValidAccessToken() {
    if (this.tokenError) throw this.tokenError;
    if (!this.connected) throw new Error('Connect Google Drive before backing up.');
    return this.accessToken;
  }
}

class FakeFileClient implements GoogleDriveFileClient {
  folderId = 'folder-1';
  files = new Map<string, { name: string; content: string; createdAt: string }>();
  uploadError: Error | null = null;
  downloadError: Error | null = null;
  private nextId = 1;

  async ensureBackupFolder() {
    return this.folderId;
  }
  async uploadBackupFile(_token: string, _folderId: string, fileName: string, contentJson: string) {
    if (this.uploadError) throw this.uploadError;
    const id = `file-${this.nextId++}`;
    const createdAt = new Date().toISOString();
    this.files.set(id, { name: fileName, content: contentJson, createdAt });
    return { id, name: fileName, createdAt, sizeBytes: contentJson.length };
  }
  async listBackupFiles(): Promise<DriveFileMetadata[]> {
    return [...this.files.entries()].map(([id, file]) => ({
      id,
      name: file.name,
      createdAt: file.createdAt,
      sizeBytes: file.content.length,
    }));
  }
  async downloadBackupFile(_token: string, fileId: string) {
    if (this.downloadError) throw this.downloadError;
    const file = this.files.get(fileId);
    if (!file) throw new Error('File not found.');
    return file.content;
  }
}

async function setUp() {
  const db = await createTestDb();
  const backupLogRepository = new SqliteBackupLogRepository(db);
  const settingsRepository = new SqliteSettingsRepository(db);
  const authClient = new FakeAuthClient();
  const fileClient = new FakeFileClient();
  const repository = new GoogleDriveBackupRepositoryImpl(backupLogRepository, settingsRepository, authClient, fileClient, db);
  return { db, backupLogRepository, settingsRepository, authClient, fileClient, repository };
}

describe('GoogleDriveBackupRepositoryImpl', () => {
  describe('backupNow', () => {
    it('uploads a snapshot, records a success BackupLog entry, and updates lastBackupAt', async () => {
      // Deliberately not seeded — backing up an empty (freshly installed)
      // database is a valid, supported case in its own right.
      const { backupLogRepository, settingsRepository, fileClient, repository } = await setUp();

      const result = await repository.backupNow();

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      expect(result.value.status).toBe('success');
      expect(result.value.direction).toBe('backup');
      expect(fileClient.files.size).toBe(1);

      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value).toHaveLength(1);
      if (logs.isSuccess) expect(logs.value[0].status).toBe('success');

      const settings = await settingsRepository.getSettings();
      expect(settings.isSuccess && settings.value.lastBackupAt).toBeTruthy();
    });

    it('records a failed BackupLog entry and leaves lastBackupAt unchanged when not connected (backup failure)', async () => {
      const { authClient, backupLogRepository, settingsRepository, repository } = await setUp();
      authClient.connected = false;
      const before = await settingsRepository.getSettings();
      const lastBackupAtBefore = before.isSuccess ? before.value.lastBackupAt : undefined;

      const result = await repository.backupNow();

      expect(result.isSuccess).toBe(false);
      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value).toHaveLength(1);
      if (logs.isSuccess) {
        expect(logs.value[0].status).toBe('failed');
        expect(logs.value[0].errorMessage).toBeTruthy();
      }
      const after = await settingsRepository.getSettings();
      expect(after.isSuccess && after.value.lastBackupAt).toBe(lastBackupAtBefore);
    });

    it('surfaces a friendly, reassuring message and logs failure when the upload itself fails (network drop mid-backup)', async () => {
      const { fileClient, backupLogRepository, repository } = await setUp();
      fileClient.uploadError = new Error('Network request failed');

      const result = await repository.backupNow();

      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/local data is safe/i);

      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value[0].status).toBe('failed');
    });

    it('gives a clear, non-crashing message when Drive isn’t configured for this build', async () => {
      const { authClient, repository } = await setUp();
      authClient.tokenError = new DriveNotConfiguredError();

      const result = await repository.backupNow();

      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/set up/i);
    });
  });

  describe('restoreBackup', () => {
    it('restores a backup onto an empty database (empty database restore)', async () => {
      const sourceDb = await createTestDb();
      seedDatabase(sourceDb);
      const snapshot = buildBackupSnapshot(sourceDb);

      const { db, fileClient, authClient, backupLogRepository, repository } = await setUp();
      const uploaded = await fileClient.uploadBackupFile(authClient.accessToken, fileClient.folderId, 'seed.json', JSON.stringify(snapshot));

      expect(db.select().from(schema.customers).all()).toHaveLength(0);

      const result = await repository.restoreBackup(uploaded.id);

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      expect(result.value.status).toBe('success');
      expect(result.value.direction).toBe('restore');
      expect(db.select().from(schema.customers).all().length).toBe(snapshot.tables.customers.length);
      expect(db.select().from(schema.customers).all().length).toBeGreaterThan(0);

      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value[0].status).toBe('success');
    });

    it('replaces existing data with the restored backup (existing data restore)', async () => {
      const sourceDb = await createTestDb();
      seedDatabase(sourceDb);
      const snapshot = buildBackupSnapshot(sourceDb);

      const { db, fileClient, authClient, repository } = await setUp();
      seedDatabase(db); // db already has its own seeded data before restoring.
      const uploaded = await fileClient.uploadBackupFile(authClient.accessToken, fileClient.folderId, 'seed.json', JSON.stringify(snapshot));

      const result = await repository.restoreBackup(uploaded.id);

      expect(result.isSuccess).toBe(true);
      const customerIds = db.select().from(schema.customers).all().map((row) => row.id);
      expect(customerIds.sort()).toEqual(snapshot.tables.customers.map((row) => row.id).sort());
    });

    it('rejects and logs a corrupted backup without touching existing data (restore failure)', async () => {
      const { db, fileClient, authClient, backupLogRepository, repository } = await setUp();
      seedDatabase(db);
      const before = db.select().from(schema.customers).all();

      const tampered = { formatVersion: 1, checksum: 'wrong', createdAt: new Date().toISOString(), tables: { customers: [] } };
      const uploaded = await fileClient.uploadBackupFile(authClient.accessToken, fileClient.folderId, 'bad.json', JSON.stringify(tampered));

      const result = await repository.restoreBackup(uploaded.id);

      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/corrupted/i);

      // Existing data must be untouched.
      expect(db.select().from(schema.customers).all()).toEqual(before);

      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value[0].status).toBe('failed');
    });

    it('rejects a backup written by an incompatible (newer) format version', async () => {
      const sourceDb = await createTestDb();
      seedDatabase(sourceDb);
      const snapshot = buildBackupSnapshot(sourceDb);
      const future = { ...snapshot, formatVersion: snapshot.formatVersion + 1 };

      const { fileClient, authClient, repository } = await setUp();
      const uploaded = await fileClient.uploadBackupFile(authClient.accessToken, fileClient.folderId, 'future.json', JSON.stringify(future));

      const result = await repository.restoreBackup(uploaded.id);

      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/newer version/i);
    });

    it('surfaces a friendly failure and logs it when the download itself fails (restore failure)', async () => {
      const { fileClient, backupLogRepository, repository } = await setUp();
      fileClient.downloadError = new Error('Network request failed');

      const result = await repository.restoreBackup('some-file-id');

      expect(result.isSuccess).toBe(false);
      const logs = await backupLogRepository.getBackupLogs();
      expect(logs.isSuccess && logs.value[0].status).toBe('failed');
    });
  });

  describe('listBackups', () => {
    it('flags a file whose name encodes a newer, unsupported format version', async () => {
      const { fileClient, authClient, repository } = await setUp();
      await fileClient.uploadBackupFile(authClient.accessToken, fileClient.folderId, 'invora-backup-v999-2026-01-01.json', '{}');

      const result = await repository.listBackups();

      expect(result.isSuccess).toBe(true);
      if (!result.isSuccess) return;
      expect(result.value[0].isSupportedVersion).toBe(false);
      expect(result.value[0].formatVersion).toBe(999);
    });
  });

  describe('connect / disconnect / getAuthStatus', () => {
    it('reports disconnected, then connected after connect()', async () => {
      const { authClient, repository } = await setUp();
      authClient.connected = false;

      const statusBefore = await repository.getAuthStatus();
      expect(statusBefore.isSuccess && statusBefore.value.connected).toBe(false);

      const connectResult = await repository.connect();
      expect(connectResult.isSuccess).toBe(true);
      if (connectResult.isSuccess) expect(connectResult.value.connected).toBe(true);
    });

    it('classifies an unconfigured client id as a BackupFailure with a friendly message', async () => {
      const { authClient, repository } = await setUp();
      authClient.tokenError = new DriveNotConfiguredError();

      const result = await repository.connect();
      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.kind).toBe('backup');
    });
  });
});
