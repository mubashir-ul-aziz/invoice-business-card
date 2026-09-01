import { createTestDb } from '../../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../../database/migrate';
import { seedDatabase } from '../../../../../../database/seed';
import * as schema from '../../../../../../database/schema';
import { BACKUP_FORMAT_VERSION } from '../../../../domain/entities/GoogleDriveBackup';
import { buildBackupSnapshot, validateBackupSnapshot, applyBackupSnapshot } from '../databaseSnapshotDataSource';

describe('databaseSnapshotDataSource', () => {
  let db: AnyInvoraDb;

  beforeEach(async () => {
    db = await createTestDb();
  });

  describe('buildBackupSnapshot / validateBackupSnapshot round-trip', () => {
    it('builds a valid, self-consistent snapshot of an empty database', () => {
      const snapshot = buildBackupSnapshot(db);
      expect(snapshot.formatVersion).toBe(BACKUP_FORMAT_VERSION);
      expect(snapshot.tables.customers).toEqual([]);
      expect(snapshot.tables.invoices).toEqual([]);

      const result = validateBackupSnapshot(JSON.parse(JSON.stringify(snapshot)));
      expect(result.isSuccess).toBe(true);
    });

    it('builds a valid snapshot of a database with existing data', () => {
      seedDatabase(db);
      const snapshot = buildBackupSnapshot(db);
      expect(snapshot.tables.customers.length).toBeGreaterThan(0);
      expect(snapshot.tables.invoices.length).toBeGreaterThan(0);

      const result = validateBackupSnapshot(JSON.parse(JSON.stringify(snapshot)));
      expect(result.isSuccess).toBe(true);
    });
  });

  describe('validateBackupSnapshot — corruption/version protection', () => {
    it('rejects a payload with a tampered checksum (corrupted backup)', () => {
      seedDatabase(db);
      const snapshot = buildBackupSnapshot(db);
      const tampered = { ...snapshot, checksum: 'not-the-real-checksum' };

      const result = validateBackupSnapshot(tampered);
      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/corrupted/i);
    });

    it('rejects a payload with a truncated table (partial backup)', () => {
      seedDatabase(db);
      const snapshot = buildBackupSnapshot(db);
      // Simulate an upload/download that got cut off mid-way — data present
      // but the checksum (computed over the *original* tables) no longer matches.
      const partial = { ...snapshot, tables: { ...snapshot.tables, invoices: [] } };

      const result = validateBackupSnapshot(partial);
      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/corrupted/i);
    });

    it('rejects a payload missing required table keys entirely', () => {
      const malformed = { formatVersion: 1, checksum: 'x', tables: { customers: [] } };
      const result = validateBackupSnapshot(malformed);
      expect(result.isSuccess).toBe(false);
    });

    it('rejects null/non-object input', () => {
      expect(validateBackupSnapshot(null).isSuccess).toBe(false);
      expect(validateBackupSnapshot('not json').isSuccess).toBe(false);
      expect(validateBackupSnapshot(undefined).isSuccess).toBe(false);
    });

    it('rejects a backup written by a newer, incompatible format version', () => {
      seedDatabase(db);
      const snapshot = buildBackupSnapshot(db);
      const future = { ...snapshot, formatVersion: BACKUP_FORMAT_VERSION + 1 };
      // Recompute nothing — a version bump alone must be rejected before checksum is even relevant.

      const result = validateBackupSnapshot(future);
      expect(result.isSuccess).toBe(false);
      if (result.isSuccess) return;
      expect(result.error.message).toMatch(/newer version/i);
    });
  });

  describe('applyBackupSnapshot', () => {
    it('restores an empty-database backup, wiping any existing data', () => {
      seedDatabase(db);
      expect(db.select().from(schema.customers).all().length).toBeGreaterThan(0);

      const empty = {
        formatVersion: BACKUP_FORMAT_VERSION,
        createdAt: new Date().toISOString(),
        checksumAlgorithm: 'invora-fnv1a-djb2-v1' as const,
        checksum: '',
        tables: {
          invoiceTypes: [],
          businesses: [],
          customers: [],
          items: [],
          socialLinks: [],
          invoices: [],
          invoiceItems: [],
          payments: [],
          appSettings: [],
        },
      };

      applyBackupSnapshot(db, empty);

      expect(db.select().from(schema.customers).all()).toEqual([]);
      expect(db.select().from(schema.invoices).all()).toEqual([]);
      expect(db.select().from(schema.invoiceTypes).all()).toEqual([]);
    });

    it('restores a backup with existing data onto an empty database', async () => {
      const sourceDb = await createTestDb();
      seedDatabase(sourceDb);
      const snapshot = buildBackupSnapshot(sourceDb);

      // `db` here is still empty — this is the "restore onto a fresh install" path.
      applyBackupSnapshot(db, snapshot);

      const customers = db.select().from(schema.customers).all();
      const invoices = db.select().from(schema.invoices).all();
      expect(customers.length).toBe(snapshot.tables.customers.length);
      expect(invoices.length).toBe(snapshot.tables.invoices.length);
      expect(customers.length).toBeGreaterThan(0);
    });

    it('replaces existing data rather than merging with it', () => {
      seedDatabase(db);
      const before = db.select().from(schema.customers).all();
      expect(before.length).toBeGreaterThan(0);

      // A snapshot from a *different*, smaller dataset (just the invoice types).
      const minimal = {
        formatVersion: BACKUP_FORMAT_VERSION,
        createdAt: new Date().toISOString(),
        checksumAlgorithm: 'invora-fnv1a-djb2-v1' as const,
        checksum: '',
        tables: {
          invoiceTypes: db.select().from(schema.invoiceTypes).all(),
          businesses: [],
          customers: [],
          items: [],
          socialLinks: [],
          invoices: [],
          invoiceItems: [],
          payments: [],
          appSettings: [],
        },
      };

      applyBackupSnapshot(db, minimal);

      expect(db.select().from(schema.customers).all()).toEqual([]);
      expect(db.select().from(schema.invoiceTypes).all().length).toBe(minimal.tables.invoiceTypes.length);
    });

    it('leaves foreign-key enforcement re-enabled after restoring', () => {
      seedDatabase(db);
      const snapshot = buildBackupSnapshot(db);
      applyBackupSnapshot(db, snapshot);

      const pragma = db.all<{ foreign_keys: number }>('PRAGMA foreign_keys');
      expect(pragma[0]?.foreign_keys).toBe(1);
    });
  });
});
