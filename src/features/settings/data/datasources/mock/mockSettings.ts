import { AppSettings, InvoiceTemplate } from '../../../domain/entities/AppSettings';

export const mockAppSettings: AppSettings = {
  defaultCurrency: 'USD',
  defaultTaxRate: 8.25,
  defaultPaymentTermsDays: 30,
  invoiceTemplateId: 'template-classic',
  backupFrequency: 'weekly',
  lastBackupAt: '2026-08-25T09:12:00',
  cloudBackupEnabled: false,
  appLockEnabled: true,
  biometricUnlockEnabled: false,
};

export const PAYMENT_TERMS_OPTIONS = [
  { days: 7, label: 'Net 7' },
  { days: 15, label: 'Net 15' },
  { days: 30, label: 'Net 30' },
  { days: 60, label: 'Net 60' },
];

export const mockInvoiceTemplates: InvoiceTemplate[] = [
  { id: 'template-classic', name: 'Classic', description: 'Clean, single-column layout with a bold header band.', accentColor: '#2563EB' },
  { id: 'template-minimal', name: 'Minimal', description: 'Light, whitespace-forward layout for a modern feel.', accentColor: '#0F172A' },
  { id: 'template-bold', name: 'Bold', description: 'Strong color header, ideal for brand-forward businesses.', accentColor: '#0FA968' },
];

export const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'EUR', label: 'Euro (€)' },
];
