import { colors, statusColors } from './colors';
import { typography } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

/** Minimum interactive touch target (Stitch spec: 48px). */
export const touchTarget = 48;

/** Breakpoints used by useResponsive() to adapt layout across phone/tablet/desktop web. */
export const breakpoints = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
} as const;

/** Single import surface for theme tokens: `import { theme } from '.../theme'`. */
export const theme = {
  colors,
  statusColors,
  typography,
  spacing,
  radius,
  touchTarget,
  breakpoints,
} as const;

export type AppTheme = typeof theme;
