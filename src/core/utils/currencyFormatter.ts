/**
 * Currency formatting per Business.currencyCode / AppSettings.defaultCurrency.
 * All monetary values are rounded to 2 decimal places before formatting or
 * storage to avoid floating-point drift (Section 23).
 */
const CURRENCY_LOCALE: Record<string, string> = {
  USD: 'en-US',
  GBP: 'en-GB',
  EUR: 'en-IE',
};

/** Round to 2 decimal places using cent-safe integer math. */
export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const rounded = roundMoney(amount);
  try {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currencyCode] ?? 'en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(rounded);
  } catch {
    return `${currencyCode} ${rounded.toFixed(2)}`;
  }
}
