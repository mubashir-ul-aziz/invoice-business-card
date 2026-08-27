export type BackupFrequency = 'manual' | 'daily' | 'weekly';

export interface AppSettings {
  defaultCurrency: string;
  defaultTaxRate?: number;
  invoiceTemplateId: string;
  backupFrequency: BackupFrequency;
  lastBackupAt?: string;
  cloudBackupEnabled: boolean;
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
}
