import { eq } from 'drizzle-orm';
import { Result, ok, err } from '../../../../core/result/result';
import { Failure, ValidationFailure, DatabaseFailure, NotFoundFailure } from '../../../../core/errors/failures';
import { Business } from '../../domain/entities/Business';
import { BusinessInput, BusinessRepository } from '../../domain/repositories/BusinessRepository';
import { generateId } from '../../../../core/utils/idGenerator';
import { syncArray, syncObject } from '../../../../core/utils/syncCache';
import { getDb } from '../../../../database/client';
import type { AnyInvoraDb } from '../../../../database/migrate';
import { businesses, socialLinks } from '../../../../database/schema';
import { businessFromRow, socialLinkFromRow, now } from '../../../../database/mappers';
import { mockBusiness, mockSocialLinks } from '../datasources/mock/mockBusiness';

function validate(input: BusinessInput): ValidationFailure | undefined {
  const fieldErrors: Record<string, string> = {};
  if (!input.name.trim()) fieldErrors.name = 'Business name is required';
  if (!input.email || !input.email.trim()) fieldErrors.email = 'Business email is required';
  else if (!/^\S+@\S+\.\S+$/.test(input.email.trim())) fieldErrors.email = 'Enter a valid email address';
  if (Object.keys(fieldErrors).length > 0) {
    return new ValidationFailure('Please fix the highlighted fields.', fieldErrors);
  }
  return undefined;
}

/**
 * SQLite-backed `BusinessRepository` (Phase 20), replacing
 * `MockBusinessRepository` behind the same interface (Section 9). Also
 * keeps the shared `mockBusiness`/`mockSocialLinks` fixtures in sync on
 * every read/write (see `core/utils/syncCache`) so the handful of screens
 * that still read them directly (Business, Digital Card, QR, Invoice
 * Review/Sharing) keep working unchanged, backed by real persisted data.
 */
export class SqliteBusinessRepository implements BusinessRepository {
  /** `db` is injectable so tests can pass an in-memory `sql.js`-backed instance instead of the real `expo-sqlite` client. */
  constructor(private readonly db: AnyInvoraDb = getDb()) {}

  async getBusiness(): Promise<Result<Business | null, Failure>> {
    try {
      const db = this.db;
      const rows = db.select().from(businesses).all();
      const links = db.select().from(socialLinks).all();
      syncArray(mockSocialLinks, links.map(socialLinkFromRow));

      if (rows.length === 0) return ok(null);
      const business = businessFromRow(rows[0]);
      syncObject(mockBusiness, business);
      return ok(business);
    } catch (cause) {
      return err(new DatabaseFailure('Could not load the business profile.', cause));
    }
  }

  async createBusiness(input: BusinessInput): Promise<Result<Business, Failure>> {
    const failure = validate(input);
    if (failure) return err(failure);

    try {
      const db = this.db;
      const existingRows = db.select().from(businesses).all();
      const timestamp = now();

      // MVP is single-business: onboarding fleshes out the already-seeded row
      // rather than minting an unrelated new id (mirrors the mock repository's
      // convention so `SocialLink.businessId` never orphans).
      if (existingRows.length > 0) {
        const existing = existingRows[0];
        db.update(businesses)
          .set({
            name: input.name,
            logoInitial: input.logoInitial,
            logoColor: input.logoColor,
            address: input.address,
            phone: input.phone,
            email: input.email,
            website: input.website,
            currencyCode: input.currencyCode,
            taxNumber: input.taxNumber,
            invoicePrefix: input.invoicePrefix,
            updatedAt: timestamp,
          })
          .where(eq(businesses.id, existing.id))
          .run();
        const [row] = db.select().from(businesses).where(eq(businesses.id, existing.id)).all();
        const business = businessFromRow(row);
        syncObject(mockBusiness, business);
        return ok(business);
      }

      const id = generateId();
      db.insert(businesses)
        .values({
          id,
          name: input.name,
          logoInitial: input.logoInitial,
          logoColor: input.logoColor,
          address: input.address,
          phone: input.phone,
          email: input.email,
          website: input.website,
          currencyCode: input.currencyCode,
          taxNumber: input.taxNumber,
          invoicePrefix: input.invoicePrefix,
          nextInvoiceNumber: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
      const [row] = db.select().from(businesses).where(eq(businesses.id, id)).all();
      const business = businessFromRow(row);
      syncObject(mockBusiness, business);
      return ok(business);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save the business profile.', cause));
    }
  }

  async updateBusiness(id: string, input: BusinessInput): Promise<Result<Business, Failure>> {
    const failure = validate(input);
    if (failure) return err(failure);

    try {
      const db = this.db;
      const [existing] = db.select().from(businesses).where(eq(businesses.id, id)).all();
      if (!existing) return err(new NotFoundFailure('No business profile exists to update yet.'));

      db.update(businesses)
        .set({
          name: input.name,
          logoInitial: input.logoInitial,
          logoColor: input.logoColor,
          address: input.address,
          phone: input.phone,
          email: input.email,
          website: input.website,
          currencyCode: input.currencyCode,
          taxNumber: input.taxNumber,
          invoicePrefix: input.invoicePrefix,
          updatedAt: now(),
        })
        .where(eq(businesses.id, id))
        .run();

      const [row] = db.select().from(businesses).where(eq(businesses.id, id)).all();
      const business = businessFromRow(row);
      syncObject(mockBusiness, business);
      return ok(business);
    } catch (cause) {
      return err(new DatabaseFailure('Could not save the business profile.', cause));
    }
  }
}
