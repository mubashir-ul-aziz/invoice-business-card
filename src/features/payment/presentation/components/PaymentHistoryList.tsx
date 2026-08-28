import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { Card } from '../../../../core/components/Card';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { PAYMENT_METHOD_LABELS, Payment, PaymentMethod } from '../../domain/entities/Payment';

/** Shared with the method selector on Record Payment (Screen 18) so the icon never drifts between the two. */
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  bank_transfer: 'business-outline',
  card: 'card-outline',
  paypal: 'logo-paypal',
  other: 'ellipsis-horizontal-circle-outline',
};

interface PaymentHistoryListProps {
  payments: Payment[];
  currencyCode?: string;
  emptyMessage?: string;
}

/**
 * Reusable list of past payments for one invoice (Section 16, Screens 17/18
 * both need this view — this is the one place it's implemented).
 */
export function PaymentHistoryList({
  payments,
  currencyCode = 'USD',
  emptyMessage = 'No payments recorded yet.',
}: PaymentHistoryListProps) {
  if (payments.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      {payments.map((payment, index) => (
        <View key={payment.id} style={[styles.row, index < payments.length - 1 && styles.rowDivider]}>
          <View style={styles.iconWrap}>
            <Ionicons name={PAYMENT_METHOD_ICONS[payment.method]} size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.method}>{PAYMENT_METHOD_LABELS[payment.method]}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {formatDate(new Date(payment.paymentDate))}
              {payment.reference ? ` · ${payment.reference}` : ''}
            </Text>
          </View>
          <Text style={styles.amount}>+{formatCurrency(payment.amount, currencyCode)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.md },
  emptyCard: { marginBottom: theme.spacing.md },
  emptyText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: theme.spacing.sm },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  info: { flex: 1, marginRight: theme.spacing.sm },
  method: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  amount: { ...theme.typography.bodyStrong, color: theme.colors.success },
});
