import { Payment } from '../../../domain/entities/Payment';

/**
 * Payments referencing mock invoice IDs (see mockInvoices.ts). Kept in its
 * own module (rather than nested on the invoice) since Payment is a
 * standalone entity queried independently (Section 7/9).
 */
export const mockPayments: Payment[] = [
  { id: 'pay-1', invoiceId: 'inv-1001', amount: 1200, paymentDate: '2026-06-18', method: 'bank_transfer', reference: 'TXN-88231' },
  { id: 'pay-2', invoiceId: 'inv-1002', amount: 640.5, paymentDate: '2026-07-02', method: 'card', reference: 'CARD-4471' },
  { id: 'pay-3', invoiceId: 'inv-1004', amount: 500, paymentDate: '2026-07-20', method: 'cash' },
  { id: 'pay-4', invoiceId: 'inv-1004', amount: 300, paymentDate: '2026-08-05', method: 'bank_transfer', reference: 'TXN-88907' },
  { id: 'pay-5', invoiceId: 'inv-1006', amount: 2140, paymentDate: '2026-07-28', method: 'paypal', reference: 'PP-220156' },
  { id: 'pay-6', invoiceId: 'inv-1009', amount: 350, paymentDate: '2026-08-10', method: 'bank_transfer', reference: 'TXN-89120' },
  { id: 'pay-7', invoiceId: 'inv-1012', amount: 980, paymentDate: '2026-08-15', method: 'card', reference: 'CARD-5502' },
  { id: 'pay-8', invoiceId: 'inv-1014', amount: 1450.75, paymentDate: '2026-08-20', method: 'bank_transfer', reference: 'TXN-89340' },
];
