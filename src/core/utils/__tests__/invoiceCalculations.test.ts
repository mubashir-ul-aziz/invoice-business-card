import { computeLineTotal, computeInvoiceTotals, deriveInvoiceStatus, describeInvoiceLineQuantity } from '../invoiceCalculations';

describe('computeLineTotal (Section 23)', () => {
  it('computes a plain quantity line: qty * unitPrice, taxed after discount', () => {
    // subtotal 100, discount 10 -> taxable 90, tax 10% -> 9, total 99
    expect(computeLineTotal({ quantity: 5, unitPrice: 20, discount: 10, taxRate: 10 })).toBe(99);
  });

  it('uses weight as the quantity-equivalent for Weight-type lines', () => {
    expect(computeLineTotal({ weight: 3, unitPrice: 10 })).toBe(30);
  });

  it('uses quantity * length * width * height for Dimension-type lines', () => {
    // 2 * 2 * 3 * 4 = 48 units * unitPrice 5 = 240
    expect(computeLineTotal({ quantity: 2, length: 2, width: 3, height: 4, unitPrice: 5 })).toBe(240);
  });

  it('defaults quantity-equivalent to 1 when nothing is specified', () => {
    expect(computeLineTotal({ unitPrice: 15 })).toBe(15);
  });

  it('applies no discount/tax when omitted', () => {
    expect(computeLineTotal({ quantity: 4, unitPrice: 2.5 })).toBe(10);
  });

  it('rounds to 2 decimal places, avoiding floating-point drift', () => {
    expect(computeLineTotal({ quantity: 3, unitPrice: 0.1, taxRate: 0 })).toBe(0.3);
  });
});

describe('computeInvoiceTotals (Section 23)', () => {
  it('sums subtotal/discount/tax/total across multiple lines', () => {
    const totals = computeInvoiceTotals([
      { quantity: 2, unitPrice: 50, discount: 0, taxRate: 10 }, // subtotal 100, tax 10, total 110
      { quantity: 1, unitPrice: 30, discount: 5, taxRate: 0 }, // subtotal 30, discount 5, total 25
    ]);
    expect(totals).toEqual({ subtotal: 130, discountTotal: 5, taxTotal: 10, total: 135 });
  });

  it('returns all zeros for an empty line list', () => {
    expect(computeInvoiceTotals([])).toEqual({ subtotal: 0, discountTotal: 0, taxTotal: 0, total: 0 });
  });

  it('total = subtotal - discountTotal + taxTotal', () => {
    const totals = computeInvoiceTotals([{ quantity: 10, unitPrice: 9.99, discount: 2, taxRate: 8.5 }]);
    expect(totals.total).toBeCloseTo(totals.subtotal - totals.discountTotal + totals.taxTotal, 2);
  });
});

describe('deriveInvoiceStatus (Section 26)', () => {
  const now = new Date('2026-09-01T00:00:00Z');

  it('is unpaid when nothing has been paid and not past due', () => {
    expect(deriveInvoiceStatus(100, 0, '2026-09-10', now)).toBe('unpaid');
  });

  it('is overdue when nothing has been paid and past due', () => {
    expect(deriveInvoiceStatus(100, 0, '2026-08-01', now)).toBe('overdue');
  });

  it('is unpaid (not overdue) with no due date at all, regardless of payment', () => {
    expect(deriveInvoiceStatus(100, 0, undefined, now)).toBe('unpaid');
  });

  it('is partial when partially paid and not past due', () => {
    expect(deriveInvoiceStatus(100, 40, '2026-09-10', now)).toBe('partial');
  });

  it('is overdue when partially paid and past due', () => {
    expect(deriveInvoiceStatus(100, 40, '2026-08-01', now)).toBe('overdue');
  });

  it('is paid once totalPaid covers the total, even past the due date', () => {
    expect(deriveInvoiceStatus(100, 100, '2026-08-01', now)).toBe('paid');
  });

  it('is paid on overpayment (totalPaid exceeds total)', () => {
    expect(deriveInvoiceStatus(100, 150, '2026-08-01', now)).toBe('paid');
  });
});

describe('describeInvoiceLineQuantity', () => {
  it('describes a dimension line as L×W×H with a qty prefix when qty != 1', () => {
    expect(describeInvoiceLineQuantity({ unitPrice: 1, quantity: 2, length: 2, width: 3, height: 4, unitSnapshot: 'cm' })).toBe('2 × 2×3×4 cm');
  });

  it('omits the qty prefix when quantity is 1', () => {
    expect(describeInvoiceLineQuantity({ unitPrice: 1, quantity: 1, length: 2, width: 3, height: 4 })).toBe('2×3×4');
  });

  it('describes a weight line', () => {
    expect(describeInvoiceLineQuantity({ unitPrice: 1, weight: 5, unitSnapshot: 'kg' })).toBe('5 kg');
  });

  it('describes a plain quantity line', () => {
    expect(describeInvoiceLineQuantity({ unitPrice: 1, quantity: 3, unitSnapshot: 'pcs' })).toBe('3 pcs');
  });

  it('falls back to "1 unit" when nothing is set', () => {
    expect(describeInvoiceLineQuantity({ unitPrice: 1 })).toBe('1 unit');
  });
});
