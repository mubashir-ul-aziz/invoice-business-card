export interface Item {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit?: string;
  defaultPrice: number;
  taxRate?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  invoiceTypeId?: string;
}
