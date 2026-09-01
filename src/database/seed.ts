/**
 * First-run seed (Section 6, Phase 20: "seeded with the 5 system
 * InvoiceTypes on first run"). Runs once — gated on `invoice_types` being
 * empty — inside `initializeDatabase()`, after migrations, before any
 * screen mounts.
 *
 * Beyond the 5 system-defined InvoiceTypes (always seeded), this also loads
 * the same demo Business/Customers/Items/Invoices/Payments fixtures the
 * mock-data phases (1-19) shipped with, so the app's first real launch
 * behaves identically to Phase 19 from a user's perspective (Phase 20
 * acceptance criteria) instead of landing on an empty dashboard. This is a
 * deliberate, flagged choice — a production "start empty, go through
 * Welcome -> Create Business" first run is one line to switch to later
 * (drop the non-InvoiceType inserts below) if that's preferred instead.
 */
import * as schema from './schema';
import { now } from './mappers';
import type { AnyInvoraDb } from './migrate';
import { mockInvoiceTypes } from '../features/invoiceType/data/datasources/mock/mockInvoiceTypes';
import { mockBusiness, mockSocialLinks } from '../features/business/data/datasources/mock/mockBusiness';
import { mockCustomers } from '../features/customer/data/datasources/mock/mockCustomers';
import { mockItems } from '../features/item/data/datasources/mock/mockItems';
import { mockInvoices } from '../features/invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../features/payment/data/datasources/mock/mockPayments';
import { mockAppSettings } from '../features/settings/data/datasources/mock/mockSettings';
import { mockBackupLogs } from '../features/backup/data/datasources/mock/mockBackupLogs';
import { APP_SETTINGS_SINGLETON_ID } from './schema/appSettingsTable';

export function seedDatabase(db: AnyInvoraDb): void {
  const existing = db.all<{ id: string }>('SELECT id FROM invoice_types LIMIT 1');
  if (existing.length > 0) return; // already seeded — safe to call on every startup.

  const timestamp = now();

  db.transaction((tx) => {
    for (const type of mockInvoiceTypes) {
      tx.insert(schema.invoiceTypes)
        .values({
          id: type.id,
          name: type.name,
          description: type.description,
          isSystemDefined: type.isSystemDefined,
          enabledFields: JSON.stringify(type.enabledFields),
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
    }

    tx.insert(schema.businesses)
      .values({
        id: mockBusiness.id,
        name: mockBusiness.name,
        logoInitial: mockBusiness.logoInitial,
        logoColor: mockBusiness.logoColor,
        address: mockBusiness.address,
        phone: mockBusiness.phone,
        email: mockBusiness.email,
        website: mockBusiness.website,
        currencyCode: mockBusiness.currencyCode,
        taxNumber: mockBusiness.taxNumber,
        invoicePrefix: mockBusiness.invoicePrefix,
        nextInvoiceNumber: mockBusiness.nextInvoiceNumber,
        defaultInvoiceTypeId: mockBusiness.defaultInvoiceTypeId,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    for (const link of mockSocialLinks) {
      tx.insert(schema.socialLinks)
        .values({ id: link.id, businessId: link.businessId, platform: link.platform, url: link.url, createdAt: timestamp })
        .run();
    }

    for (const customer of mockCustomers) {
      tx.insert(schema.customers)
        .values({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          notes: customer.notes,
          createdAt: customer.createdAt,
          updatedAt: customer.createdAt,
        })
        .run();
    }

    for (const item of mockItems) {
      tx.insert(schema.items)
        .values({
          id: item.id,
          name: item.name,
          description: item.description,
          sku: item.sku,
          unit: item.unit,
          defaultPrice: item.defaultPrice,
          taxRate: item.taxRate,
          weight: item.weight,
          length: item.length,
          width: item.width,
          height: item.height,
          invoiceTypeId: item.invoiceTypeId,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
    }

    for (const invoice of mockInvoices) {
      tx.insert(schema.invoices)
        .values({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          customerId: invoice.customerId,
          invoiceTypeId: invoice.invoiceTypeId,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          subtotal: invoice.subtotal,
          discountTotal: invoice.discountTotal,
          taxTotal: invoice.taxTotal,
          total: invoice.total,
          notes: invoice.notes,
          terms: invoice.terms,
          status: invoice.status,
          createdAt: invoice.issueDate,
          updatedAt: invoice.issueDate,
        })
        .run();

      for (const line of invoice.items) {
        tx.insert(schema.invoiceItems)
          .values({
            id: line.id,
            invoiceId: line.invoiceId,
            itemNameSnapshot: line.itemNameSnapshot,
            itemDescriptionSnapshot: line.descriptionSnapshot,
            unitSnapshot: line.unitSnapshot,
            quantity: line.quantity,
            weight: line.weight,
            length: line.length,
            width: line.width,
            height: line.height,
            unitPrice: line.unitPrice,
            discount: line.discount,
            taxRate: line.taxRate,
            lineTotal: line.lineTotal,
            createdAt: invoice.issueDate,
          })
          .run();
      }
    }

    for (const payment of mockPayments) {
      tx.insert(schema.payments)
        .values({
          id: payment.id,
          invoiceId: payment.invoiceId,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
          createdAt: payment.paymentDate,
        })
        .run();
    }

    tx.insert(schema.appSettings)
      .values({
        id: APP_SETTINGS_SINGLETON_ID,
        defaultCurrency: mockAppSettings.defaultCurrency,
        defaultTaxRate: mockAppSettings.defaultTaxRate,
        defaultPaymentTermsDays: mockAppSettings.defaultPaymentTermsDays,
        invoiceTemplateId: mockAppSettings.invoiceTemplateId,
        backupFrequency: mockAppSettings.backupFrequency,
        lastBackupAt: mockAppSettings.lastBackupAt,
        cloudBackupEnabled: mockAppSettings.cloudBackupEnabled,
        appLockEnabled: mockAppSettings.appLockEnabled,
        biometricUnlockEnabled: mockAppSettings.biometricUnlockEnabled,
        updatedAt: timestamp,
      })
      .run();

    for (const log of mockBackupLogs) {
      tx.insert(schema.backupLogs)
        .values({
          id: log.id,
          type: log.type,
          direction: log.direction,
          status: log.status,
          fileName: log.fileName,
          sizeBytes: log.sizeBytes,
          errorMessage: log.errorMessage,
          createdAt: log.createdAt,
        })
        .run();
    }
  });
}
