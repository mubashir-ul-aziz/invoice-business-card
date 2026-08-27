import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Chip } from '../../../../core/components/Chip';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { InvoiceStatus } from '../../../invoice/domain/entities/Invoice';

type TimelineEntry =
  | { kind: 'invoice'; id: string; date: string; invoiceNumber: string; total: number; status: InvoiceStatus }
  | { kind: 'payment'; id: string; date: string; invoiceNumber: string; amount: number };

const FILTERS: Array<{ key: InvoiceStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'partial', label: 'Partial' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'overdue', label: 'Overdue' },
];

/** Screen 12 — full chronological invoice + payment history for a customer (Section 16). */
export function CustomerHistoryScreen() {
  const navigation = useAppNavigation();
  const { customerId } = useAppRoute<'CustomerHistory'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  const invoices = useMemo(
    () => mockInvoices.filter((i) => i.customerId === customerId && (filter === 'all' || i.status === filter)),
    [customerId, filter],
  );

  const timeline = useMemo<TimelineEntry[]>(() => {
    const invoiceEntries: TimelineEntry[] = invoices.map((i) => ({
      kind: 'invoice', id: i.id, date: i.issueDate, invoiceNumber: i.invoiceNumber, total: i.total, status: i.status,
    }));
    const invoiceIds = new Set(invoices.map((i) => i.id));
    const paymentEntries: TimelineEntry[] = mockPayments
      .filter((p) => invoiceIds.has(p.invoiceId))
      .map((p) => ({
        kind: 'payment',
        id: p.id,
        date: p.paymentDate,
        invoiceNumber: invoices.find((i) => i.id === p.invoiceId)?.invoiceNumber ?? '',
        amount: p.amount,
      }));
    return [...invoiceEntries, ...paymentEntries].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [invoices]);

  return (
    <ScreenContainer>
      <ScreenHeader title="History" subtitle={customer?.name} onBack={() => navigation.goBack()} />

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => <Chip label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />}
        style={styles.filterList}
      />

      <FlatList
        data={timeline}
        keyExtractor={(entry) => entry.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No history yet" message="Invoice and payment activity will appear here." />}
        renderItem={({ item }) => (
          <Card style={styles.entryCard}>
            <View style={[styles.entryIcon, item.kind === 'payment' && styles.entryIconPayment]}>
              <Ionicons name={item.kind === 'payment' ? 'cash-outline' : 'document-text-outline'} size={18} color={item.kind === 'payment' ? theme.colors.success : theme.colors.primary} />
            </View>
            <View style={styles.entryInfo}>
              <Text style={styles.entryTitle}>{item.kind === 'payment' ? `Payment received · ${item.invoiceNumber}` : item.invoiceNumber}</Text>
              <Text style={styles.entryDate}>{formatDate(new Date(item.date))}</Text>
            </View>
            {item.kind === 'invoice' ? (
              <View style={styles.entryRight}>
                <Text style={styles.entryAmount}>{formatCurrency(item.total, 'USD')}</Text>
                <StatusBadge status={item.status} />
              </View>
            ) : (
              <Text style={[styles.entryAmount, { color: theme.colors.success }]}>+{formatCurrency(item.amount, 'USD')}</Text>
            )}
          </Card>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterList: { flexGrow: 0, marginBottom: theme.spacing.sm },
  filterRow: { gap: theme.spacing.sm, paddingVertical: 2 },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl, gap: theme.spacing.sm },
  entryCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  entryIcon: {
    width: 36, height: 36, borderRadius: theme.radius.md, backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  entryIconPayment: { backgroundColor: theme.colors.successBg },
  entryInfo: { flex: 1 },
  entryTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  entryDate: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  entryRight: { alignItems: 'flex-end', gap: 4 },
  entryAmount: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
});
