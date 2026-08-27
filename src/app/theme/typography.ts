/**
 * Centralized text styles matching the Stitch "Kinetic Ledger" type scale
 * (Inter). Custom font files aren't loaded in Stage 1 (no new font-loading
 * dependency yet) — the platform default sans-serif is used, which is
 * visually close to Inter, while sizes/weights/letter-spacing match exactly
 * so restyling with a real Inter font later is a one-file change.
 */
export const typography = {
  displayFinancial: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.4 },
  headlineLg: { fontSize: 24, fontWeight: '600' as const },
  headlineMd: { fontSize: 20, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, fontWeight: '400' as const },
  labelSm: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4 },

  // Legacy aliases kept so existing components compile unchanged.
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
} as const;

export type AppTypography = typeof typography;
