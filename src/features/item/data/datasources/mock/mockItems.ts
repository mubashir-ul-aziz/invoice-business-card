import { Item } from '../../../domain/entities/Item';

export const mockItems: Item[] = [
  { id: 'item-1', name: 'Consulting Session', description: 'One-hour strategy consulting session', sku: 'SVC-100', unit: 'hr', defaultPrice: 175, taxRate: 8, invoiceTypeId: 'type-service-hours' },
  { id: 'item-2', name: 'Project Management (Weekly)', description: 'Dedicated PM support, billed weekly', sku: 'SVC-110', unit: 'wk', defaultPrice: 950, taxRate: 8, invoiceTypeId: 'type-service-hours' },
  { id: 'item-3', name: 'Steel Brackets (Box of 50)', description: 'Galvanized steel mounting brackets', sku: 'HW-2201', unit: 'box', defaultPrice: 64.5, taxRate: 6.25, invoiceTypeId: 'type-quantity' },
  { id: 'item-4', name: 'Packing Foam Rolls', description: 'Industrial packing foam, 100ft roll', sku: 'PK-3390', unit: 'roll', defaultPrice: 38, taxRate: 6.25, invoiceTypeId: 'type-quantity' },
  { id: 'item-5', name: 'Bulk Aggregate (Gravel)', description: 'Crushed gravel, priced per kg', sku: 'MAT-7710', unit: 'kg', defaultPrice: 0.42, taxRate: 0, weight: 1, invoiceTypeId: 'type-weight' },
  { id: 'item-6', name: 'Recycled Steel Scrap', description: 'Sorted steel scrap, priced per kg', sku: 'MAT-7822', unit: 'kg', defaultPrice: 0.9, taxRate: 0, weight: 1, invoiceTypeId: 'type-weight' },
  { id: 'item-7', name: 'Oak Plywood Sheet', description: '4x8 oak veneer plywood sheet', sku: 'LUM-4408', unit: 'sheet', defaultPrice: 54, taxRate: 6.25, length: 8, width: 4, height: 0.06, invoiceTypeId: 'type-dimension' },
  { id: 'item-8', name: 'Custom Crate', description: 'Built-to-spec wooden shipping crate', sku: 'PKG-5510', unit: 'unit', defaultPrice: 120, taxRate: 6.25, length: 4, width: 3, height: 3, invoiceTypeId: 'type-dimension' },
  { id: 'item-9', name: 'Office Desk Chair', description: 'Ergonomic mesh-back office chair', sku: 'FUR-1290', unit: 'pcs', defaultPrice: 189, taxRate: 8.25, invoiceTypeId: 'type-general' },
  { id: 'item-10', name: 'Conference Table (8ft)', description: 'Solid-wood veneer conference table', sku: 'FUR-1350', unit: 'pcs', defaultPrice: 890, taxRate: 8.25, invoiceTypeId: 'type-general' },
  { id: 'item-11', name: 'LED Panel Light', description: '2x4ft dimmable LED panel', sku: 'ELE-3301', unit: 'pcs', defaultPrice: 42.75, taxRate: 8.25, invoiceTypeId: 'type-general' },
  { id: 'item-12', name: 'HVAC Filter (MERV 13)', description: '20x25x1 pleated air filter', sku: 'HVAC-990', unit: 'pcs', defaultPrice: 12.5, taxRate: 8.25, invoiceTypeId: 'type-quantity' },
];
