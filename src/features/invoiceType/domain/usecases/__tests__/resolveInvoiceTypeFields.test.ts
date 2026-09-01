import { resolveInvoiceTypeFields, invoiceTypeHasField } from '../resolveInvoiceTypeFields';
import { InvoiceType } from '../../entities/InvoiceType';

function type(enabledFields: InvoiceType['enabledFields']): InvoiceType {
  return { id: 'type-1', name: 'Test', description: '', isSystemDefined: false, enabledFields };
}

describe('resolveInvoiceTypeFields (Section 27)', () => {
  it('returns the enabled fields as a Set', () => {
    const fields = resolveInvoiceTypeFields(type(['quantity', 'unit', 'discount', 'tax']));
    expect(fields).toEqual(new Set(['quantity', 'unit', 'discount', 'tax']));
  });

  it('returns an empty Set for an undefined invoice type', () => {
    expect(resolveInvoiceTypeFields(undefined)).toEqual(new Set());
  });

  it('returns an empty Set when enabledFields is empty', () => {
    expect(resolveInvoiceTypeFields(type([]))).toEqual(new Set());
  });
});

describe('invoiceTypeHasField', () => {
  const weightType = type(['quantity', 'weight', 'discount', 'tax']);

  it('is true for a field present in enabledFields', () => {
    expect(invoiceTypeHasField(weightType, 'weight')).toBe(true);
  });

  it('is false for a field absent from enabledFields', () => {
    expect(invoiceTypeHasField(weightType, 'length')).toBe(false);
  });

  it('is false for an undefined invoice type', () => {
    expect(invoiceTypeHasField(undefined, 'quantity')).toBe(false);
  });
});
