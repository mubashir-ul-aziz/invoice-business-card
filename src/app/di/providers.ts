/**
 * Composition root for app-wide, cross-cutting wiring (as opposed to
 * feature-local Zustand stores, which live in
 * `features/*\/presentation/state` and are imported directly by that
 * feature's UI).
 *
 * This is where mock-vs-real repository instances get selected: a screen
 * depends only on the repository interface from `features/*\/domain`, and
 * this file decides which implementation (`Mock*Repository` through Phase
 * 19, `Sqlite*Repository` from Phase 20 on) actually gets constructed —
 * swapping is a one-line change here, never a UI change (Section 9). The
 * `Mock*Repository` classes remain in the codebase for tests only (Phase 20
 * acceptance criteria) — nothing below constructs one anymore.
 */
import { BusinessRepository } from '../../features/business/domain/repositories/BusinessRepository';
import { SqliteBusinessRepository } from '../../features/business/data/repositories/sqliteBusinessRepository';
import { InvoiceTypeRepository } from '../../features/invoiceType/domain/repositories/InvoiceTypeRepository';
import { SqliteInvoiceTypeRepository } from '../../features/invoiceType/data/repositories/sqliteInvoiceTypeRepository';
import { ItemRepository } from '../../features/item/domain/repositories/ItemRepository';
import { SqliteItemRepository } from '../../features/item/data/repositories/sqliteItemRepository';
import { CustomerRepository } from '../../features/customer/domain/repositories/CustomerRepository';
import { SqliteCustomerRepository } from '../../features/customer/data/repositories/sqliteCustomerRepository';
import { InvoiceRepository } from '../../features/invoice/domain/repositories/InvoiceRepository';
import { SqliteInvoiceRepository } from '../../features/invoice/data/repositories/sqliteInvoiceRepository';
import { PaymentRepository } from '../../features/payment/domain/repositories/PaymentRepository';
import { SqlitePaymentRepository } from '../../features/payment/data/repositories/sqlitePaymentRepository';
import { SettingsRepository } from '../../features/settings/domain/repositories/SettingsRepository';
import { SqliteSettingsRepository } from '../../features/settings/data/repositories/sqliteSettingsRepository';
import { BackupLogRepository } from '../../features/backup/domain/repositories/BackupLogRepository';
import { SqliteBackupLogRepository } from '../../features/backup/data/repositories/sqliteBackupLogRepository';

export const businessRepository: BusinessRepository = new SqliteBusinessRepository();
export const invoiceTypeRepository: InvoiceTypeRepository = new SqliteInvoiceTypeRepository();
export const itemRepository: ItemRepository = new SqliteItemRepository();
export const customerRepository: CustomerRepository = new SqliteCustomerRepository();
export const invoiceRepository: InvoiceRepository = new SqliteInvoiceRepository();
export const paymentRepository: PaymentRepository = new SqlitePaymentRepository();
export const settingsRepository: SettingsRepository = new SqliteSettingsRepository();
export const backupLogRepository: BackupLogRepository = new SqliteBackupLogRepository();
