import { shouldRunAutomaticBackup } from '../shouldRunAutomaticBackup';

describe('shouldRunAutomaticBackup', () => {
  it('never runs when the user disabled automatic backup (frequency = manual)', () => {
    expect(shouldRunAutomaticBackup({ backupFrequency: 'manual', lastBackupAt: undefined })).toBe(false);
    expect(shouldRunAutomaticBackup({ backupFrequency: 'manual', lastBackupAt: '2020-01-01T00:00:00.000Z' })).toBe(false);
  });

  it('runs immediately if enabled but never backed up before', () => {
    expect(shouldRunAutomaticBackup({ backupFrequency: 'daily', lastBackupAt: undefined })).toBe(true);
    expect(shouldRunAutomaticBackup({ backupFrequency: 'weekly', lastBackupAt: undefined })).toBe(true);
  });

  it('treats an unparseable lastBackupAt as due', () => {
    expect(shouldRunAutomaticBackup({ backupFrequency: 'daily', lastBackupAt: 'not-a-date' })).toBe(true);
  });

  it('does not run daily backup before 24 hours have passed', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const lastBackupAt = new Date('2026-06-10T00:00:00.000Z').toISOString(); // 12h ago
    expect(shouldRunAutomaticBackup({ backupFrequency: 'daily', lastBackupAt }, now)).toBe(false);
  });

  it('runs daily backup once 24 hours have passed', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const lastBackupAt = new Date('2026-06-09T11:59:00.000Z').toISOString(); // just over 24h ago
    expect(shouldRunAutomaticBackup({ backupFrequency: 'daily', lastBackupAt }, now)).toBe(true);
  });

  it('does not run weekly backup before 7 days have passed', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const lastBackupAt = new Date('2026-06-05T12:00:00.000Z').toISOString(); // 5 days ago
    expect(shouldRunAutomaticBackup({ backupFrequency: 'weekly', lastBackupAt }, now)).toBe(false);
  });

  it('runs weekly backup once 7 days have passed', () => {
    const now = new Date('2026-06-10T12:00:00.000Z');
    const lastBackupAt = new Date('2026-06-03T11:00:00.000Z').toISOString(); // just over 7 days ago
    expect(shouldRunAutomaticBackup({ backupFrequency: 'weekly', lastBackupAt }, now)).toBe(true);
  });
});
