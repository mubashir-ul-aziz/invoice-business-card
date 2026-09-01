import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteBackupLogRepository } from '../sqliteBackupLogRepository';

describe('SqliteBackupLogRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteBackupLogRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteBackupLogRepository(db);
  });

  it('starts empty', async () => {
    const result = await repo.getBackupLogs();
    expect(result.isSuccess && result.value).toEqual([]);
  });

  it('records an entry and lists it back, most recent first', async () => {
    await repo.recordEntry({ type: 'google_drive', direction: 'backup', status: 'success', fileName: 'a.db' });
    await new Promise((resolve) => setTimeout(resolve, 2));
    await repo.recordEntry({ type: 'google_drive', direction: 'backup', status: 'failed', errorMessage: 'offline' });

    const result = await repo.getBackupLogs();
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0].status).toBe('failed');
    expect(result.value[1].fileName).toBe('a.db');
  });
});
