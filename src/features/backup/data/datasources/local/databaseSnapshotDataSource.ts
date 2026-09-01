/**
 * Builds, validates, and applies the versioned JSON snapshot that is the
 * actual "backup format" (Section 12/33). This is local `expo-sqlite`/
 * Drizzle I/O, not a Drive concern — `googleDriveBackupRepository.ts` calls
 * this to get bytes to upload, and to apply bytes it downloaded.
 *
 * Every table this app persists (Section 21) except `BackupLog` itself
 * travels in the payload — the log is local audit trail, not user data
 * (Section 21: "the log itself is local; only the backup payload travels to
 * Drive/cloud").
 */
import { Result, ok, err } from '../../../../../core/result/result';
import { Failure, BackupFailure } from '../../../../../core/errors/failures';
import { BACKUP_FORMAT_VERSION } from '../../../domain/entities/GoogleDriveBackup';
import type { AnyInvoraDb } from '../../../../../database/migrate';
import * as schema from '../../../../../database/schema';
import { recalculateInvoiceStatus } from '../../../../invoice/data/repositories/sqliteInvoiceRepository';

export interface BackupSnapshotTables {
  invoiceTypes: (typeof schema.invoiceTypes.$inferSelect)[];
  businesses: (typeof schema.businesses.$inferSelect)[];
  customers: (typeof schema.customers.$inferSelect)[];
  items: (typeof schema.items.$inferSelect)[];
  socialLinks: (typeof schema.socialLinks.$inferSelect)[];
  invoices: (typeof schema.invoices.$inferSelect)[];
  invoiceItems: (typeof schema.invoiceItems.$inferSelect)[];
  payments: (typeof schema.payments.$inferSelect)[];
  appSettings: (typeof schema.appSettings.$inferSelect)[];
}

/** Parent-before-child, matching each table's FK direction (Section 8) — kept even though FK enforcement is briefly suspended while applying (see `applyBackupSnapshot`), so the payload stays sane to read/debug on its own. */
const TABLE_KEYS: (keyof BackupSnapshotTables)[] = [
  'invoiceTypes',
  'businesses',
  'customers',
  'items',
  'socialLinks',
  'invoices',
  'invoiceItems',
  'payments',
  'appSettings',
];

export interface BackupSnapshot {
  formatVersion: number;
  createdAt: string;
  checksumAlgorithm: 'invora-fnv1a-djb2-v1';
  /** Digest of the canonical (stable key order) JSON of `tables` — corruption/truncation detection (Section 33), not a security signature (see `hashString` below). */
  checksum: string;
  tables: BackupSnapshotTables;
}

function readAllTables(db: AnyInvoraDb): BackupSnapshotTables {
  return {
    invoiceTypes: db.select().from(schema.invoiceTypes).all(),
    businesses: db.select().from(schema.businesses).all(),
    customers: db.select().from(schema.customers).all(),
    items: db.select().from(schema.items).all(),
    socialLinks: db.select().from(schema.socialLinks).all(),
    invoices: db.select().from(schema.invoices).all(),
    invoiceItems: db.select().from(schema.invoiceItems).all(),
    payments: db.select().from(schema.payments).all(),
    appSettings: db.select().from(schema.appSettings).all(),
  };
}

/** Stable-key-order JSON so the checksum is deterministic regardless of object property insertion order. */
function canonicalJson(tables: BackupSnapshotTables): string {
  const ordered: Record<string, unknown> = {};
  for (const key of TABLE_KEYS) ordered[key] = tables[key];
  return JSON.stringify(ordered);
}

/**
 * Two independent 32-bit rolling hashes (FNV-1a + djb2) plus the input
 * length, combined into one hex digest. Deliberately not a cryptographic
 * hash and not `expo-crypto` — this only needs to catch accidental
 * corruption/truncation (Section 33), and computing it in plain JS means it
 * behaves identically on-device and under Jest (a native-backed digest
 * would be auto-mocked to a constant in tests, silently defeating every
 * corruption check).
 */
function hashString(input: string): string {
  let fnv = 0x811c9dc5;
  let djb2 = 5381;
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    fnv ^= code;
    fnv = Math.imul(fnv, 0x01000193);
    djb2 = (Math.imul(djb2, 33) + code) | 0;
  }
  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(fnv)}${toHex(djb2)}${toHex(input.length)}`;
}

function computeChecksum(tables: BackupSnapshotTables): string {
  return hashString(canonicalJson(tables));
}

/** Reads the entire local database into a checksummed, versioned snapshot ready to upload. */
export function buildBackupSnapshot(db: AnyInvoraDb): BackupSnapshot {
  const tables = readAllTables(db);
  const checksum = computeChecksum(tables);
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    createdAt: new Date().toISOString(),
    checksumAlgorithm: 'invora-fnv1a-djb2-v1',
    checksum,
    tables,
  };
}

function isRowArray(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every((row) => typeof row === 'object' && row !== null);
}

/**
 * Structural + integrity + version checks (Section 33's four protections),
 * run before anything ever touches the live database:
 *  - malformed/missing shape          -> "corrupted"
 *  - checksum mismatch                -> "corrupted" (catches partial/truncated uploads-or-downloads too)
 *  - `formatVersion` newer than ours  -> "incompatible version"
 * Never throws — every failure path returns a typed `Failure` with a
 * message written for the end user, not a developer.
 */
export function validateBackupSnapshot(raw: unknown): Result<BackupSnapshot, Failure> {
  if (typeof raw !== 'object' || raw === null) {
    return err(new BackupFailure('This backup file is unreadable and can’t be restored.'));
  }
  const candidate = raw as Partial<BackupSnapshot>;

  if (typeof candidate.formatVersion !== 'number' || !Number.isInteger(candidate.formatVersion) || candidate.formatVersion < 1) {
    return err(new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.'));
  }
  if (candidate.formatVersion > BACKUP_FORMAT_VERSION) {
    return err(
      new BackupFailure('This backup was created by a newer version of Invora. Update the app, then try restoring it again.'),
    );
  }
  if (typeof candidate.checksum !== 'string' || !candidate.checksum) {
    return err(new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.'));
  }
  if (typeof candidate.tables !== 'object' || candidate.tables === null) {
    return err(new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.'));
  }
  for (const key of TABLE_KEYS) {
    if (!isRowArray((candidate.tables as unknown as Record<string, unknown>)[key])) {
      return err(new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.'));
    }
  }

  const tables = candidate.tables as BackupSnapshotTables;
  const recomputed = computeChecksum(tables);
  if (recomputed !== candidate.checksum) {
    return err(new BackupFailure('This backup file looks corrupted or incomplete and can’t be restored. Try a different backup.'));
  }

  return ok({
    formatVersion: candidate.formatVersion,
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : new Date().toISOString(),
    checksumAlgorithm: 'invora-fnv1a-djb2-v1',
    checksum: candidate.checksum,
    tables,
  });
}

/**
 * Replaces every row in every backed-up table with the snapshot's rows, in
 * one transaction (Section 33/21 — a killed app or a thrown error mid-way
 * rolls back to exactly the pre-restore state via SQLite's own transactional
 * guarantee, never leaving a half-restored database). Invoice status is
 * recalculated afterward against the current date (Section 26) rather than
 * trusting the snapshot's possibly-stale `status` column.
 *
 * Foreign-key enforcement is briefly suspended around the transaction only
 * (SQLite forbids toggling the pragma inside one) so delete-then-reinsert
 * order across FK'd tables can't itself fail the restore; it's always
 * restored to ON afterward, success or failure.
 */
export function applyBackupSnapshot(db: AnyInvoraDb, snapshot: BackupSnapshot): void {
  db.run('PRAGMA foreign_keys = OFF;');
  try {
    db.transaction((tx) => {
      for (const key of [...TABLE_KEYS].reverse()) {
        tx.delete((schema as Record<string, any>)[key]).run();
      }
      for (const key of TABLE_KEYS) {
        const rows = snapshot.tables[key];
        if (rows.length > 0) {
          tx.insert((schema as Record<string, any>)[key]).values(rows).run();
        }
      }
      for (const invoice of snapshot.tables.invoices) {
        recalculateInvoiceStatus(tx, invoice.id);
      }
    });
  } finally {
    db.run('PRAGMA foreign_keys = ON;');
  }
}
