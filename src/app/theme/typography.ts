/** Centralized text styles. Keep to a small, fixed scale for a simple, professional feel. */
export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

export type AppTypography = typeof typography;
