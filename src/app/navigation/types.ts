import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Root stack: the tab shell (MainTabs) plus every full-screen flow that
 * isn't a tab root (Section 15). Draft invoice data is threaded through
 * route params across the 3-step creation wizard since no form store exists
 * yet in this UI-only stage (Stage 2 introduces persisted draft state).
 */
/** A single draft invoice line as the creation wizard passes it between steps (Stage 1: no draft store yet). */
export interface DraftInvoiceLine {
  key: string;
  itemNameSnapshot: string;
  unitSnapshot?: string;
  quantity?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<TabParamList> | undefined;
  Welcome: undefined;
  CreateBusiness: { mode?: 'create' | 'edit' } | undefined;
  InvoiceTypeSelection: { fromOnboarding?: boolean } | undefined;
  CustomInvoiceType: undefined;
  ItemList: undefined;
  CreateItem: { itemId?: string } | undefined;
  CreateCustomer: { customerId?: string } | undefined;
  CustomerDetail: { customerId: string };
  CustomerHistory: { customerId: string };
  CreateInvoiceCustomer: undefined;
  CreateInvoiceItems: {
    customerId: string;
    invoiceTypeId: string;
    issueDate: string;
    dueDate?: string;
  };
  InvoiceReview: {
    customerId: string;
    invoiceTypeId: string;
    issueDate: string;
    dueDate?: string;
    lines: DraftInvoiceLine[];
  };
  InvoiceDetail: { invoiceId: string };
  RecordPayment: { invoiceId: string };
  InvoiceSharing: { invoiceId: string };
  DigitalBusinessCard: undefined;
  QRCode: undefined;
  BackupRestore: undefined;
  Settings: undefined;
  InvoiceTemplateSelection: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

export type TabParamList = {
  Dashboard: undefined;
  Invoices: undefined;
  Customers: undefined;
  Business: undefined;
};
