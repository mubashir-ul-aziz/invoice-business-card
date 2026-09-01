import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Chip } from '../../../../core/components/Chip';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { InvoiceStatus } from '../../../invoice/domain/entities/Invoice';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '../../../payment/domain/entities/Payment';

type EventFilter = 'all' | 'invoice' | 'payment';

type TimelineEntry =
  | { kind: 'invoice'; id: string; date: string; invoiceNumber: string; total: number; status: InvoiceStatus; dueDate?: string }
  | { kind: 'payment'; id: string; date: string; invoiceNumber: string; amount: number; method: PaymentMethod };

const FILTERS: Array<{ key: EventFilter; label: string }> = [
  { key: 'all', label: 'All Events' },
  { key: 'invoice', label: 'Invoices' },
  { key: 'payment', label: 'Payments' },
];

const METHOD_ICON: Record<PaymentMethod, keyof typeof Ionicons.glyphMap> = {
  cash: 'cash-outline',
  bank_transfer: 'business-outline',
  card: 'card-outline',
  paypal: 'logo-paypal',
  other: 'ellipsis-horizontal-outline',
};

/** Screen 12 — chronological invoice + payment timeline for a customer, with event-type filters (Phase 9). */
export function CustomerHistoryScreen() {
  const navigation = useAppNavigation();
  const { customerId } = useAppRoute<'CustomerHistory'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);
  const [filter, setFilter] = useState<EventFilter>('all');

  // Re-run on every focus so a payment/invoice recorded elsewhere and
  // navigated back from is reflected here — same convention as
  // InvoiceDetailScreen's focus reload.
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, []),
  );

  const customerInvoices = useMemo(() => mockInvoices.filter((i) => i.customerId === customerId), [customerId, refreshKey]);
  const customerInvoiceIds = useMemo(() => new Set(customerInvoices.map((i) => i.id)), [customerInvoices]);
  const customerPayments = useMemo(
    () => mockPayments.filter((p) => customerInvoiceIds.has(p.invoiceId)),
    [customerInvoiceIds],
  );

  const timeline = useMemo<TimelineEntry[]>(() => {
    const invoiceEntries: TimelineEntry[] = customerInvoices.map((i) => ({
      kind: 'invoice', id: i.id, date: i.issueDate, invoiceNumber: i.invoiceNumber, total: i.total, status: i.status, dueDate: i.dueDate,
    }));
    const paymentEntries: TimelineEntry[] = customerPayments.map((p) => ({
      kind: 'payment',
      id: p.id,
      date: p.paymentDate,
      invoiceNumber: customerInvoices.find((i) => i.id === p.invoiceId)?.invoiceNumber ?? '',
      amount: p.amount,
      method: p.method,
    }));
    const merged = filter === 'all' ? [...invoiceEntries, ...paymentEntries]
      : filter === 'invoice' ? invoiceEntries
      : paymentEntries;
    return merged.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [customerInvoices, customerPayments, filter]);

  const payableInvoice = useMemo(
    () => customerInvoices.find((i) => i.status !== 'paid'),
    [customerInvoices],
  );

  return (
    <ScreenContainer>
      <ScreenHeader title={customer?.name ?? 'History'} subtitle="Customer History" onBack={() => navigation.goBack()} />

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
        keyExtractor={(entry) => `${entry.kind}-${entry.id}`}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No history yet" message="Invoice and payment activity will appear here." />}
        ListFooterComponent={
          payableInvoice ? (
            <AppButton
              label="Log New Payment"
              variant="secondary"
              onPress={() => navigation.navigate('RecordPayment', { invoiceId: payableInvoice.id })}
              style={styles.logPaymentButton}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={styles.entryRow}>
            <View style={styles.railColumn}>
              <View style={[styles.entryIcon, item.kind === 'payment' && styles.entryIconPayment]}>
                <Ionicons
                  name={item.kind === 'payment' ? 'checkmark-circle' : 'receipt-outline'}
                  size={18}
                  color={item.kind === 'payment' ? theme.colors.primary : theme.colors.textSecondary}
                />
              </View>
              {index < timeline.length - 1 ? <View style={styles.railLine} /> : null}
            </View>

            <TouchableOpacity
              activeOpacity={item.kind === 'invoice' ? 0.8 : 1}
              disabled={item.kind !== 'invoice'}
              onPress={() => item.kind === 'invoice' && navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
              style={styles.entryCard}
            >
              <View style={styles.entryTop}>
                <View style={styles.entryTopLeft}>
                  <Text style={styles.entryDate}>{formatDate(new Date(item.date))}</Text>
                  <Text style={styles.entryTitle}>
                    {item.kind === 'payment' ? 'Payment Received' : `Invoice ${item.invoiceNumber}`}
                  </Text>
                  {item.kind === 'payment' ? (
                    <View style={styles.methodRow}>
                      <Ionicons name={METHOD_ICON[item.method]} size={13} color={theme.colors.textSecondary} />
                      <Text style={styles.methodText}>{PAYMENT_METHOD_LABELS[item.method]}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.entryAmount, item.kind === 'payment' && { color: theme.colors.success }]}>
                  {item.kind === 'payment' ? '+' : ''}{formatCurrency(item.kind === 'payment' ? item.amount : item.total, 'USD')}
                </Text>
              </View>
              {item.kind === 'invoice' ? (
                <View style={styles.statusRow}>
                  <StatusBadge status={item.status} />
                  {item.status === 'overdue' && item.dueDate ? (
                    <Text style={styles.dueText}>Due {formatDate(new Date(item.dueDate))}</Text>
                  ) : null}
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterList: { flexGrow: 0, marginBottom: theme.spacing.sm },
  filterRow: { gap: theme.spacing.sm, paddingVertical: 2 },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },

  entryRow: { flexDirection: 'row', gap: theme.spacing.sm },
  railColumn: { width: 36, alignItems: 'center' },
  entryIcon: {
    width: 36, height: 36, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  entryIconPayment: { backgroundColor: theme.colors.primaryLight },
  railLine: { flex: 1, width: 2, backgroundColor: theme.colors.border, marginVertical: 4, minHeight: 24 },

  entryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  entryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm },
  entryTopLeft: { flex: 1 },
  entryDate: { ...theme.typography.labelSm, color: theme.colors.textTertiary, textTransform: 'none' },
  entryTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  methodText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  entryAmount: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  dueText: { ...theme.typography.caption, color: theme.colors.textSecondary },

  logPaymentButton: { marginTop: theme.spacing.sm },
});
