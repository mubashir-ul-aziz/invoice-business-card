import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { Avatar } from '../../../../core/components/Avatar';
import { Customer } from '../../domain/entities/Customer';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';

interface CustomerRowProps {
  customer: Customer;
  balance: number;
  invoiceCount: number;
  onPress: () => void;
}

export function CustomerRow({ customer, balance, invoiceCount, onPress }: CustomerRowProps) {
  const hasBalance = balance > 0;
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <Avatar name={customer.name} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{customer.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{customer.email ?? customer.phone ?? 'No contact info'}</Text>
        <Text style={styles.invoiceCount}>{invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'}</Text>
      </View>
      <View style={styles.balanceWrap}>
        <Text style={[styles.balance, hasBalance && styles.balanceDue]}>
          {hasBalance ? formatCurrency(balance, 'USD') : 'Settled'}
        </Text>
        {hasBalance ? <Text style={styles.balanceLabel}>Balance due</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  info: { flex: 1 },
  name: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  invoiceCount: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 },
  balanceWrap: { alignItems: 'flex-end' },
  balance: { ...theme.typography.bodyStrong, color: theme.colors.textSecondary },
  balanceDue: { color: theme.colors.warning },
  balanceLabel: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 },
});
