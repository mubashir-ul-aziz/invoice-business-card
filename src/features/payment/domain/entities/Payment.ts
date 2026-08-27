export type PaymentMethod = 'cash' | 'bank_transfer' | 'card' | 'paypal' | 'other';

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  paypal: 'PayPal',
  other: 'Other',
};
