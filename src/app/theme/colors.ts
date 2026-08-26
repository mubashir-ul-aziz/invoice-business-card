/**
 * Centralized color palette. Screens/components must reference these tokens
 * (via theme.ts) instead of hard-coding hex values, so restyling stays a
 * one-file change (Phase 0 acceptance criteria, Section 5).
 */
export const colors = {
  primary: '#2F6FED',
  primaryDark: '#1E4FBF',
  secondary: '#0FA968',
  background: '#FFFFFF',
  surface: '#F5F7FA',
  border: '#E2E6EC',
  textPrimary: '#101828',
  textSecondary: '#5D6B82',
  textOnPrimary: '#FFFFFF',
  danger: '#D92D20',
  warning: '#DC6803',
  success: '#12B76A',
  overlay: 'rgba(16, 24, 40, 0.5)',
} as const;

export type AppColors = typeof colors;
