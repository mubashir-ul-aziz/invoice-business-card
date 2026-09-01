/**
 * Row <-> domain entity conversions shared by the Sqlite*Repository classes
 * and `seed.ts`. Repositories return domain entities, never raw Drizzle row
 * types (Section 9) — every mapping direction lives here, once, instead of
 * duplicated per repository.
 */
import { Business, SocialLink } from '../features/business/domain/entities/Business';
import { InvoiceType } from '../features/invoiceType/domain/entities/InvoiceType';
import { InvoiceFieldKey } from '../core/constants/invoiceFieldVocabulary';
import { Customer } from '../features/customer/domain/entities/Customer';
import { Item } from '../features/item/domain/entities/Item';
import { Invoice, InvoiceItem, InvoiceStatus } from '../features/invoice/domain/entities/Invoice';
import { Payment, PaymentMethod } from '../features/payment/domain/entities/Payment';
import { AppSettings, BackupFrequency } from '../features/settings/domain/entities/AppSettings';
import { BackupLogEntry, BackupType, BackupDirection, BackupStatus } from '../features/backup/domain/entities/BackupLog';
import * as schema from './schema';

export function now(): string {
  return new Date().toISOString();
}

// ---- Business / SocialLink ----

export function businessFromRow(row: typeof schema.businesses.$inferSelect): Business {
  return {
    id: row.id,
    name: row.name,
    logoInitial: row.logoInitial,
    logoColor: row.logoColor,
    address: row.address ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    currencyCode: row.currencyCode,
    taxNumber: row.taxNumber ?? undefined,
    invoicePrefix: row.invoicePrefix,
    nextInvoiceNumber: row.nextInvoiceNumber,
    defaultInvoiceTypeId: row.defaultInvoiceTypeId ?? undefined,
  };
}

export function socialLinkFromRow(row: typeof schema.socialLinks.$inferSelect): SocialLink {
  return { id: row.id, businessId: row.businessId, platform: row.platform, url: row.url };
}

// ---- InvoiceType ----

export function invoiceTypeFromRow(row: typeof schema.invoiceTypes.$inferSelect): InvoiceType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    isSystemDefined: row.isSystemDefined,
    enabledFields: JSON.parse(row.enabledFields) as InvoiceFieldKey[],
  };
}

// ---- Customer ----

export function customerFromRow(row: typeof schema.customers.$inferSelect): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.createdAt,
  };
}

// ---- Item ----

export function itemFromRow(row: typeof schema.items.$inferSelect): Item {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    sku: row.sku ?? undefined,
    unit: row.unit ?? undefined,
    defaultPrice: row.defaultPrice,
    taxRate: row.taxRate ?? undefined,
    weight: row.weight ?? undefined,
    length: row.length ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    invoiceTypeId: row.invoiceTypeId ?? undefined,
  };
}

// ---- Invoice / InvoiceItem ----

export function invoiceItemFromRow(row: typeof schema.invoiceItems.$inferSelect): InvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    itemNameSnapshot: row.itemNameSnapshot,
    descriptionSnapshot: row.itemDescriptionSnapshot ?? undefined,
    unitSnapshot: row.unitSnapshot ?? undefined,
    quantity: row.quantity ?? undefined,
    weight: row.weight ?? undefined,
    length: row.length ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    unitPrice: row.unitPrice,
    discount: row.discount ?? undefined,
    taxRate: row.taxRate ?? undefined,
    lineTotal: row.lineTotal,
  };
}

export function invoiceFromRow(
  row: typeof schema.invoices.$inferSelect,
  itemRows: (typeof schema.invoiceItems.$inferSelect)[],
): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    customerId: row.customerId,
    invoiceTypeId: row.invoiceTypeId,
    issueDate: row.issueDate,
    dueDate: row.dueDate ?? undefined,
    subtotal: row.subtotal,
    discountTotal: row.discountTotal,
    taxTotal: row.taxTotal,
    total: row.total,
    notes: row.notes ?? undefined,
    terms: row.terms ?? undefined,
    status: row.status as InvoiceStatus,
    items: itemRows.filter((item) => item.invoiceId === row.id).map(invoiceItemFromRow),
  };
}

// ---- Payment ----

export function paymentFromRow(row: typeof schema.payments.$inferSelect): Payment {
  return {
    id: row.id,
    invoiceId: row.invoiceId,
    amount: row.amount,
    paymentDate: row.paymentDate,
    method: row.method as PaymentMethod,
    reference: row.reference ?? undefined,
    notes: row.notes ?? undefined,
  };
}

// ---- AppSettings ----

export function appSettingsFromRow(row: typeof schema.appSettings.$inferSelect): AppSettings {
  return {
    defaultCurrency: row.defaultCurrency,
    defaultTaxRate: row.defaultTaxRate ?? undefined,
    defaultPaymentTermsDays: row.defaultPaymentTermsDays,
    invoiceTemplateId: row.invoiceTemplateId,
    backupFrequency: row.backupFrequency as BackupFrequency,
    lastBackupAt: row.lastBackupAt ?? undefined,
    cloudBackupEnabled: row.cloudBackupEnabled,
    appLockEnabled: row.appLockEnabled,
    biometricUnlockEnabled: row.biometricUnlockEnabled,
  };
}

// ---- BackupLog ----

export function backupLogFromRow(row: typeof schema.backupLogs.$inferSelect): BackupLogEntry {
  return {
    id: row.id,
    type: row.type as BackupType,
    direction: row.direction as BackupDirection,
    status: row.status as BackupStatus,
    fileName: row.fileName ?? undefined,
    sizeBytes: row.sizeBytes ?? undefined,
    errorMessage: row.errorMessage ?? undefined,
    createdAt: row.createdAt,
  };
}
