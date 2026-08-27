import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { PAYMENT_METHOD_LABELS } from '../../../payment/domain/entities/Payment';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';

/** Screen 17 — view a saved invoice; hub for payment/sharing actions (Section 16). */
export function InvoiceDetailScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'InvoiceDetail'>().params;
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  const customer = invoice ? mockCustomers.find((c) => c.id === invoice.customerId) : undefined;
  const payments = useMemo(() => mockPayments.filter((p) => p.invoiceId === invoiceId), [invoiceId]);
  const totalPaid = totalPaidForInvoice(invoiceId, mockPayments);

  if (!invoice) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />
        <EmptyState title="Invoice not found" message="This invoice may have been removed." />
      </ScreenContainer>
    );
  }

  const remaining = invoice.total - totalPaid;

  return (
    <ScreenContainer>
      <ScreenHeader
        title={invoice.invoiceNumber}
        subtitle={customer?.name}
        onBack={() => navigation.goBack()}
        rightIcon="share-outline"
        onRightPress={() => navigation.navigate('InvoiceSharing', { invoiceId })}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <View style={styles.headerTopRow}>
            <StatusBadge status={invoice.status} />
            <Text style={styles.total}>{formatCurrency(invoice.total, 'USD')}</Text>
          </View>
          <View style={styles.metaRow}>
            <MetaItem label="Issued" value={formatDate(new Date(invoice.issueDate))} />
            <MetaItem label="Due" value={invoice.dueDate ? formatDate(new Date(invoice.dueDate)) : '—'} />
            <MetaItem label="Balance" value={formatCurrency(Math.max(remaining, 0), 'USD')} />
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Line Items</Text>
        <Card style={styles.linesCard}>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName} numberOfLines={1}>{item.itemNameSnapshot}</Text>
                <Text style={styles.lineMeta}>
                  {item.quantity != null ? `Qty ${item.quantity} ${item.unitSnapshot ?? ''} × ${formatCurrency(item.unitPrice, 'USD')}` : formatCurrency(item.unitPrice, 'USD')}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatCurrency(item.lineTotal, 'USD')}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <TotalRow label="Subtotal" value={invoice.subtotal} />
          <TotalRow label="Discount" value={-invoice.discountTotal} />
          <TotalRow label="Tax" value={invoice.taxTotal} />
          <TotalRow label="Total" value={invoice.total} emphasize />
        </Card>

        <View style={styles.paymentsSectionHeader}>
          <Text style={styles.sectionLabel}>Payment History</Text>
          <Text style={styles.paidSummary}>{formatCurrency(totalPaid, 'USD')} paid</Text>
        </View>
        {payments.length === 0 ? (
          <Card style={styles.emptyPayments}>
            <Text style={styles.emptyPaymentsText}>No payments recorded yet.</Text>
          </Card>
        ) : (
          <Card style={styles.linesCard}>
            {payments.map((payment) => (
              <View key={payment.id} style={styles.lineRow}>
                <View style={styles.lineInfo}>
                  <Text style={styles.lineName}>{PAYMENT_METHOD_LABELS[payment.method]}</Text>
                  <Text style={styles.lineMeta}>{formatDate(new Date(payment.paymentDate))}{payment.reference ? ` · ${payment.reference}` : ''}</Text>
                </View>
                <Text style={[styles.lineTotal, { color: theme.colors.success }]}>+{formatCurrency(payment.amount, 'USD')}</Text>
              </View>
            ))}
          </Card>
        )}

        {invoice.notes ? (
          <>
            <Text style={styles.sectionLabel}>Notes</Text>
            <Card style={styles.linesCard}>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>

      <View style={styles.actionBar}>
        <ActionButton icon="cash-outline" label="Payment" onPress={() => navigation.navigate('RecordPayment', { invoiceId })} />
        <ActionButton icon="share-social-outline" label="Share" onPress={() => navigation.navigate('InvoiceSharing', { invoiceId })} />
        <ActionButton icon="create-outline" label="Edit" onPress={() => navigation.navigate('CreateInvoiceCustomer')} />
        <ActionButton icon="document-text-outline" label="PDF" onPress={() => navigation.navigate('InvoiceSharing', { invoiceId })} />
      </View>
    </ScreenContainer>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function TotalRow({ label, value, emphasize }: { label: string; value: number; emphasize?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, emphasize && styles.totalLabelEmphasize]}>{label}</Text>
      <Text style={[styles.totalValue, emphasize && styles.totalValueEmphasize]}>{formatCurrency(value, 'USD')}</Text>
    </View>
  );
}

function ActionButton({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.md },
  headerCard: { marginBottom: theme.spacing.md },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  total: { ...theme.typography.displayFinancial, fontSize: 26, color: theme.colors.textPrimary },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTopWidth: 1, borderTopColor: theme.colors.border },
  metaItem: {},
  metaLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  metaValue: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  linesCard: { marginBottom: theme.spacing.md },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  lineInfo: { flex: 1, marginRight: theme.spacing.sm },
  lineName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  lineMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  lineTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  totalLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  totalLabelEmphasize: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  totalValue: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  totalValueEmphasize: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  paymentsSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.xs },
  paidSummary: { ...theme.typography.bodyMd, color: theme.colors.success, fontWeight: '600' },
  emptyPayments: { marginBottom: theme.spacing.md },
  emptyPaymentsText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  notesText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  actionBar: {
    flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xs,
  },
  actionButton: { alignItems: 'center', gap: 4, paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.sm },
  actionButtonLabel: { ...theme.typography.caption, color: theme.colors.primary, fontWeight: '600' },
});
