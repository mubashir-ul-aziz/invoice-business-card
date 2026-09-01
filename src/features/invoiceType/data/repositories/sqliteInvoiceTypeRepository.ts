import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, DatabaseFailure, NotFoundFailure, ValidationFailure } from '../../../../core/errors/failures';
import { InvoiceType } from '../../domain/entities/InvoiceType';
import { CreateInvoiceTypeInput, InvoiceTypeRepository } from '../../domain/repositories/InvoiceTypeRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { REQUIRED_INVOICE_FIELDS } from '../../../../core/constants/invoiceFieldVocabulary';
import { syncArray, syncObject } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { invoiceTypes, businesses } from '../../../../database/schema';
import { invoiceTypeFromRow, businessFromRow, now } from '../../../../database/mappers';
import { mockInvoiceTypes } from '../datasources/mock/mockInvoiceTypes';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';

/**
 * SQLite-backed `InvoiceTypeRepository` (Phase 20), replacing
 * `MockInvoiceTypeRepository` behind the same interface (Section 9). The
 * business's selected default type is persisted on `businesses.default_invoice_type_id`
 * — the column Section 7 defines for exactly this — rather than kept only
 * in repository-instance memory, so it now genuinely survives an app
 * restart.
 */
export class SqliteInvoiceTypeRepository implements InvoiceTypeRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getInvoiceTypes(): Promise<Result<InvoiceType[], Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(invoiceTypes).all();
      const types = rows.map(invoiceTypeFromRow);
      syncArray(mockInvoiceTypes, types);
      return ok(types);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load invoice types.', cause));
    }
  }

  async getSelectedInvoiceTypeId(): Promise<Result<string | null, Failure>> {
    try {
      const db = this.db;
      const [businessRow] = db.select().from(businesses).all();
      return ok(businessRow?.defaultInvoiceTypeId ?? null);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load the selected invoice type.', cause));
    }
  }

  async selectInvoiceType(invoiceTypeId: string): Promise<Result<string, Failure>> {
    try {
      const db = this.db;
      const [type] = db.select().from(invoiceTypes).where(eq(invoiceTypes.id, invoiceTypeId)).all();
      if (!type) return err(new NotFoundFailure('That invoice type could not be found.'));

      const [businessRow] = db.select().from(businesses).all();
      if (businessRow) {
        db.update(businesses)
          .set({ defaultInvoiceTypeId: invoiceTypeId, updatedAt: now() })
          .where(eq(businesses.id, businessRow.id))
          .run();
        const [updated] = db.select().from(businesses).where(eq(businesses.id, businessRow.id)).all();
        syncObject(mockBusiness, businessFromRow(updated));
      }
      return ok(invoiceTypeId);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save the selected invoice type.', cause));
    }
  }

  async createInvoiceType(input: CreateInvoiceTypeInput): Promise<Result<InvoiceType, Failure>> {
    const name = input.name.trim();
    if (!name) {
      return err(new ValidationFailure('Give this type a name.', { name: 'Give this type a name.' }));
    }

    // itemName/unitPrice are structural (Section 7) so they're always persisted
    // regardless of what the form toggled.
    const enabledFields = Array.from(new Set([...REQUIRED_INVOICE_FIELDS, ...input.enabledFields]));

    try {
      const db = this.db;
      const id = generateId();
      const timestamp = now();
      db.insert(invoiceTypes)
        .values({
          id,
          name,
          description: `Custom type — ${enabledFields.length} fields selected.`,
          isSystemDefined: false,
          enabledFields: JSON.stringify(enabledFields),
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();

      const [row] = db.select().from(invoiceTypes).where(eq(invoiceTypes.id, id)).all();
      const type = invoiceTypeFromRow(row);
      const allRows = db.select().from(invoiceTypes).all();
      syncArray(mockInvoiceTypes, allRows.map(invoiceTypeFromRow));
      return ok(type);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save the invoice type.', cause));
    }
  }
}
