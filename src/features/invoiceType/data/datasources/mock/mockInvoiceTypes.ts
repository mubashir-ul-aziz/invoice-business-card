import { InvoiceType } from '../../../domain/entities/InvoiceType';

/** The 5 system-defined types seeded on first run, plus one example custom type (Section 27). */
export const mockInvoiceTypes: InvoiceType[] = [
  {
    id: 'type-general',
    name: 'General',
    description: 'Simple quantity × price line items with discount and tax.',
    isSystemDefined: true,
    enabledFields: ['quantity', 'unit', 'discount', 'tax'],
  },
  {
    id: 'type-quantity',
    name: 'Quantity',
    description: 'Quantity-based goods with a unit label, discount and tax.',
    isSystemDefined: true,
    enabledFields: ['quantity', 'unit', 'discount', 'tax'],
  },
  {
    id: 'type-weight',
    name: 'Weight',
    description: 'Priced by weight — for bulk or commodity goods.',
    isSystemDefined: true,
    enabledFields: ['quantity', 'weight', 'discount', 'tax'],
  },
  {
    id: 'type-dimension',
    name: 'Dimension',
    description: 'Priced by length × width × height — for materials or freight.',
    isSystemDefined: true,
    enabledFields: ['quantity', 'length', 'width', 'height', 'discount', 'tax'],
  },
  {
    id: 'type-custom-base',
    name: 'Custom',
    description: 'Build your own field set from the vocabulary below.',
    isSystemDefined: true,
    enabledFields: ['quantity', 'discount', 'tax'],
  },
  {
    id: 'type-service-hours',
    name: 'Service Hours',
    description: 'Billed by hours worked, with discount and tax.',
    isSystemDefined: false,
    enabledFields: ['quantity', 'unit', 'discount', 'tax'],
  },
];
