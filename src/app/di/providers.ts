/**
 * Composition root for app-wide, cross-cutting wiring (as opposed to
 * feature-local Zustand stores, which live in
 * `features/*\/presentation/state` and are imported directly by that
 * feature's UI).
 *
 * This is where mock-vs-real repository instances get selected: a screen
 * depends only on the repository interface from `features/*\/domain`, and
 * this file decides which implementation (`Mock*Repository` now,
 * `Sqlite*Repository` from Phase 20 on) actually gets constructed —
 * swapping is a one-line change here, never a UI change (Section 9).
 */
import { BusinessRepository } from '../../features/business/domain/repositories/BusinessRepository';
import { MockBusinessRepository } from '../../features/business/data/repositories/mockBusinessRepository';
import { InvoiceTypeRepository } from '../../features/invoiceType/domain/repositories/InvoiceTypeRepository';
import { MockInvoiceTypeRepository } from '../../features/invoiceType/data/repositories/mockInvoiceTypeRepository';
import { ItemRepository } from '../../features/item/domain/repositories/ItemRepository';
import { MockItemRepository } from '../../features/item/data/repositories/mockItemRepository';
import { CustomerRepository } from '../../features/customer/domain/repositories/CustomerRepository';
import { MockCustomerRepository } from '../../features/customer/data/repositories/mockCustomerRepository';
import { PaymentRepository } from '../../features/payment/domain/repositories/PaymentRepository';
import { MockPaymentRepository } from '../../features/payment/data/repositories/mockPaymentRepository';
import { SettingsRepository } from '../../features/settings/domain/repositories/SettingsRepository';
import { MockSettingsRepository } from '../../features/settings/data/repositories/mockSettingsRepository';

export const businessRepository: BusinessRepository = new MockBusinessRepository();
export const invoiceTypeRepository: InvoiceTypeRepository = new MockInvoiceTypeRepository();
export const itemRepository: ItemRepository = new MockItemRepository();
export const customerRepository: CustomerRepository = new MockCustomerRepository();
export const paymentRepository: PaymentRepository = new MockPaymentRepository();
export const settingsRepository: SettingsRepository = new MockSettingsRepository();
