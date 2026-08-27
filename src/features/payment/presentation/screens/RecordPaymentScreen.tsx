import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../data/datasources/mock/mockPayments';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../domain/entities/Payment';

const METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'card', 'paypal', 'other'];

/** Screen 18 — log a payment against an invoice (Section 16). */
export function RecordPaymentScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'RecordPayment'>().params;
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  const totalPaid = totalPaidForInvoice(invoiceId, mockPayments);
  const remaining = Math.max((invoice?.total ?? 0) - totalPaid, 0);

  const [amount, setAmount] = useState(remaining > 0 ? remaining.toFixed(2) : '');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const amountNumber = Number(amount);
  const amountError = amount.trim().length === 0
    ? 'Enter an amount'
    : Number.isNaN(amountNumber) || amountNumber <= 0
    ? 'Enter a valid amount'
    : undefined;
  const isOverpayment = !amountError && amountNumber > remaining && remaining > 0;

  const today = useMemo(() => new Date('2026-08-27'), []);

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Record Payment" subtitle={invoice?.invoiceNumber} onBack={() => navigation.goBack()} />

      <Card style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Remaining balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(remaining, 'USD')}</Text>
      </Card>

      <AppTextField
        label="Amount *"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
        errorText={amountError}
      />
      {isOverpayment ? <Text style={styles.overpaymentHint}>This exceeds the remaining balance — it will be recorded as an overpayment.</Text> : null}

      <Text style={styles.fieldLabel}>Payment date</Text>
      <View style={styles.dateBox}>
        <Text style={styles.dateValue}>{today.toDateString()}</Text>
      </View>

      <Text style={styles.fieldLabel}>Method</Text>
      <View style={styles.chipRow}>
        {METHODS.map((m) => (
          <Chip key={m} label={PAYMENT_METHOD_LABELS[m]} selected={method === m} onPress={() => setMethod(m)} />
        ))}
      </View>

      <AppTextField label="Reference" placeholder="Transaction ID (optional)" value={reference} onChangeText={setReference} />
      <AppTextField label="Notes" placeholder="Optional" value={notes} onChangeText={setNotes} multiline />

      <AppButton
        label="Save Payment"
        disabled={!!amountError}
        onPress={() => navigation.navigate('InvoiceDetail', { invoiceId })}
        style={styles.saveButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  balanceCard: { marginBottom: theme.spacing.md, alignItems: 'center' },
  balanceLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  balanceValue: { ...theme.typography.displayFinancial, fontSize: 28, color: theme.colors.textPrimary, marginTop: 4 },
  overpaymentHint: { ...theme.typography.caption, color: theme.colors.warning, marginTop: -theme.spacing.sm, marginBottom: theme.spacing.md },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  dateBox: { backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm + 4, marginBottom: theme.spacing.md },
  dateValue: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
});
