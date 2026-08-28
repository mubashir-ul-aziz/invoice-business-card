export type BackupFrequency = 'manual' | 'daily' | 'weekly';

export interface AppSettings {
  defaultCurrency: string;
  defaultTaxRate?: number;
  /** Net payment terms applied to new invoices by default, in days (e.g. 30 -> "Net 30"). */
  defaultPaymentTermsDays: number;
  invoiceTemplateId: string;
  backupFrequency: BackupFrequency;
  lastBackupAt?: string;
  cloudBackupEnabled: boolean;
  /** Require unlocking the app on open (Security section, Screen 23). Enforcement lands in a later phase. */
  appLockEnabled: boolean;
  /** Use device fingerprint/face auth for app unlock, layered on top of `appLockEnabled`. */
  biometricUnlockEnabled: boolean;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
}
