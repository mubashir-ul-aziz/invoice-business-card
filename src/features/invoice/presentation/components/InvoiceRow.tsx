import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { Card } from '../../../../core/components/Card';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { Invoice } from '../../domain/entities/Invoice';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';

interface InvoiceRowProps {
  invoice: Invoice;
  customerName: string;
  onPress: () => void;
}

export function InvoiceRow({ invoice, customerName, onPress }: InvoiceRowProps) {
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button">
      <Card style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <StatusBadge status={invoice.status} />
        </View>
        <Text style={styles.customerName} numberOfLines={1}>{customerName}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.date}>{formatDate(new Date(invoice.issueDate))}</Text>
          <Text style={styles.total}>{formatCurrency(invoice.total, 'USD')}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: theme.spacing.sm },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNumber: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  customerName: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm },
  date: { ...theme.typography.caption, color: theme.colors.textTertiary },
  total: { ...theme.typography.headlineMd, fontSize: 18, color: theme.colors.textPrimary },
});
