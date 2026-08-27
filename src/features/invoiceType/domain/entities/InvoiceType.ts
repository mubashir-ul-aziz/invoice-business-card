import { InvoiceFieldKey } from '../../../../core/constants/invoiceFieldVocabulary';

export interface InvoiceType {
  id: string;
  name: string;
  description: string;
  isSystemDefined: boolean;
  enabledFields: InvoiceFieldKey[];
}
