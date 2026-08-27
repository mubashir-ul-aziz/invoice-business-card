/**
 * Centralized color palette, matching the "Kinetic Ledger" design system
 * pulled from the connected Google Stitch project (Invora). Screens/components
 * must reference these tokens (via theme.ts) instead of hard-coding hex
 * values, so restyling stays a one-file change (Phase 0 acceptance criteria).
 */
export const colors = {
  // Brand / actions
  primary: '#2563EB',
  primaryDark: '#004AC6',
  primaryLight: '#DBE1FF',
  secondary: '#0FA968',

  // Surfaces
  background: '#F7F9FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  surfaceSunken: '#EEF1F4',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#5D6B82',
  textTertiary: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Status
  danger: '#EF4444',
  dangerBg: '#FFDAD6',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  success: '#10B981',
  successBg: '#D1FAE5',
  info: '#2563EB',
  infoBg: '#DBEAFE',

  overlay: 'rgba(15, 23, 42, 0.5)',
} as const;

export type AppColors = typeof colors;

/** Semantic colors for invoice/payment status badges, kept in one place. */
export const statusColors = {
  paid: { fg: colors.success, bg: colors.successBg },
  partial: { fg: colors.warning, bg: colors.warningBg },
  unpaid: { fg: colors.textSecondary, bg: colors.surfaceAlt },
  overdue: { fg: colors.danger, bg: colors.dangerBg },
} as const;

export type InvoiceStatusKey = keyof typeof statusColors;
