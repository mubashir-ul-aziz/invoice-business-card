import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { ConfirmationDialog } from '../../../../core/components/ConfirmationDialog';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { MOCK_TODAY } from '../../../invoice/data/datasources/mock/mockInvoices';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from '../../domain/entities/Payment';
import { PAYMENT_METHOD_ICONS, PaymentHistoryList } from '../components/PaymentHistoryList';
import { toIsoDate, usePaymentFormStore } from '../state/paymentFormStore';

const METHODS: PaymentMethod[] = ['cash', 'bank_transfer', 'card', 'paypal', 'other'];
const TODAY_ISO = toIsoDate(MOCK_TODAY);
const YESTERDAY_ISO = toIsoDate(new Date(MOCK_TODAY.getTime() - 24 * 60 * 60 * 1000));

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

/** Screen 18 — log a payment against an invoice (Section 16, Phase 13). */
export function RecordPaymentScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'RecordPayment'>().params;

  const {
    invoiceNumber,
    invoiceStatus,
    remainingBalance,
    payments,
    status,
    amount,
    paymentDate,
    method,
    reference,
    notes,
    fieldErrors,
    errorMessage,
    load,
    setField,
    save,
  } = usePaymentFormStore();

  const [confirmOverpayment, setConfirmOverpayment] = useState(false);

  useEffect(() => {
    load(invoiceId);
    // Only re-run if the target invoice actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const amountNumber = Number(amount);
  const amountError =
    fieldErrors.amount ||
    (amount.trim().length === 0
      ? 'Enter an amount'
      : Number.isNaN(amountNumber) || amountNumber <= 0
      ? 'Enter a valid amount'
      : undefined);
  const dateError =
    fieldErrors.paymentDate || (isValidIsoDate(paymentDate) ? undefined : 'Use the YYYY-MM-DD format');
  const isOverpayment = !amountError && remainingBalance > 0 && amountNumber > remainingBalance;
  const canSave = !amountError && !dateError && status !== 'saving';

  async function handleSave() {
    if (!canSave) return;
    if (isOverpayment && !confirmOverpayment) {
      setConfirmOverpayment(true);
      return;
    }
    setConfirmOverpayment(false);
    const saved = await save();
    if (saved) navigation.navigate('InvoiceDetail', { invoiceId });
  }

  if (status === 'loading' && !invoiceNumber) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Record Payment" onBack={() => navigation.goBack()} />
        <LoadingState label="Loading invoice…" />
      </ScreenContainer>
    );
  }

  if (status === 'error' && !invoiceNumber) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Record Payment" onBack={() => navigation.goBack()} />
        <ErrorState message={errorMessage || 'Could not load this invoice.'} onRetry={() => load(invoiceId)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Record Payment" subtitle={invoiceNumber} onBack={() => navigation.goBack()} />

      <Card style={styles.balanceCard}>
        {invoiceStatus ? <StatusBadge status={invoiceStatus} /> : null}
        <Text style={styles.balanceLabel}>Remaining balance</Text>
        <Text style={styles.balanceValue}>{formatCurrency(Math.max(remainingBalance, 0), 'USD')}</Text>
      </Card>

      <AppTextField
        label="Amount *"
        placeholder="0.00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={(text) => setField('amount', text)}
        errorText={amountError}
      />
      {isOverpayment ? (
        <Text style={styles.overpaymentHint}>
          This exceeds the remaining balance — it will be recorded as an overpayment.
        </Text>
      ) : null}

      <Text style={styles.fieldLabel}>Payment date</Text>
      <View style={styles.chipRow}>
        <DateChip label="Today" selected={paymentDate === TODAY_ISO} onPress={() => setField('paymentDate', TODAY_ISO)} />
        <DateChip
          label="Yesterday"
          selected={paymentDate === YESTERDAY_ISO}
          onPress={() => setField('paymentDate', YESTERDAY_ISO)}
        />
      </View>
      <AppTextField
        placeholder="YYYY-MM-DD"
        value={paymentDate}
        onChangeText={(text) => setField('paymentDate', text)}
        errorText={dateError}
        containerStyle={styles.dateInput}
      />

      <Text style={styles.fieldLabel}>Method</Text>
      <View style={styles.methodGrid}>
        {METHODS.map((m) => (
          <MethodOption key={m} methodKey={m} selected={method === m} onPress={() => setField('method', m)} />
        ))}
      </View>

      <AppTextField
        label="Reference"
        placeholder="Transaction ID (optional)"
        value={reference}
        onChangeText={(text) => setField('reference', text)}
      />
      <AppTextField
        label="Notes"
        placeholder="Optional"
        value={notes}
        onChangeText={(text) => setField('notes', text)}
        multiline
      />

      {status === 'error' && errorMessage && Object.keys(fieldErrors).length === 0 ? (
        <Text style={styles.formError}>{errorMessage}</Text>
      ) : null}

      <AppButton
        label="Save Payment"
        disabled={!canSave}
        loading={status === 'saving'}
        onPress={handleSave}
        style={styles.saveButton}
      />

      <Text style={styles.sectionLabel}>Payment History</Text>
      <PaymentHistoryList payments={payments} />

      <ConfirmationDialog
        visible={confirmOverpayment}
        title="Record overpayment?"
        message={`This payment exceeds the remaining balance of ${formatCurrency(remainingBalance, 'USD')}. It will be recorded as an overpayment.`}
        confirmLabel="Record Payment"
        onConfirm={handleSave}
        onCancel={() => setConfirmOverpayment(false)}
      />
    </ScreenContainer>
  );
}

function DateChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.dateChip, selected && styles.dateChipSelected]}
    >
      <Text style={[styles.dateChipLabel, selected && styles.dateChipLabelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MethodOption({
  methodKey,
  selected,
  onPress,
}: {
  methodKey: PaymentMethod;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.methodOption, selected && styles.methodOptionSelected]}
    >
      <Ionicons
        name={PAYMENT_METHOD_ICONS[methodKey]}
        size={18}
        color={selected ? theme.colors.primary : theme.colors.textSecondary}
      />
      <Text style={[styles.methodLabel, selected && styles.methodLabelSelected]}>
        {PAYMENT_METHOD_LABELS[methodKey]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  balanceCard: { marginBottom: theme.spacing.md, alignItems: 'center', gap: 4 },
  balanceLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 4 },
  balanceValue: { ...theme.typography.displayFinancial, fontSize: 28, color: theme.colors.textPrimary },
  overpaymentHint: {
    ...theme.typography.caption,
    color: theme.colors.warning,
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  dateChip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
  },
  dateChipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  dateChipLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, fontWeight: '600' },
  dateChipLabelSelected: { color: theme.colors.primaryDark },
  dateInput: { marginBottom: theme.spacing.md },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  methodOption: {
    flexBasis: '30%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
    minHeight: theme.touchTarget,
  },
  methodOptionSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  methodLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, fontWeight: '600', flexShrink: 1 },
  methodLabelSelected: { color: theme.colors.primaryDark },
  formError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  saveButton: { marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
});
