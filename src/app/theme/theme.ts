import { colors } from './colors';
import { typography } from './typography';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
} as const;

/** Single import surface for theme tokens: `import { theme } from '.../theme'`. */
export const theme = {
  colors,
  typography,
  spacing,
  radius,
} as const;

export type AppTheme = typeof theme;
