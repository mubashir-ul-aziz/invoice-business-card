import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

/** Fixed id of the one singleton AppSettings row (Section 7 — "id text PK (singleton row)"). */
export const APP_SETTINGS_SINGLETON_ID = 'app-settings';

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey(),
  defaultCurrency: text('default_currency').notNull(),
  defaultTaxRate: real('default_tax_rate'),
  defaultPaymentTermsDays: integer('default_payment_terms_days').notNull(),
  invoiceTemplateId: text('invoice_template_id').notNull(),
  backupFrequency: text('backup_frequency', { enum: ['manual', 'daily', 'weekly'] }).notNull(),
  lastBackupAt: text('last_backup_at'),
  cloudBackupEnabled: integer('cloud_backup_enabled', { mode: 'boolean' }).notNull().default(false),
  appLockEnabled: integer('app_lock_enabled', { mode: 'boolean' }).notNull().default(false),
  biometricUnlockEnabled: integer('biometric_unlock_enabled', { mode: 'boolean' }).notNull().default(false),
  updatedAt: text('updated_at').notNull(),
});
