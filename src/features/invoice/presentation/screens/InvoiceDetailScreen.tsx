import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { ConfirmationDialog } from '../../../../core/components/ConfirmationDialog';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { PAYMENT_METHOD_LABELS } from '../../../payment/domain/entities/Payment';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { describeInvoiceLineQuantity } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { generateId } from '../../../../core/utils/idGenerator';
import { useInvoiceFormStore } from '../state/invoiceFormStore';

const STATUS_LABELS: Record<string, string> = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid', overdue: 'Overdue' };

interface ActionSpec {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

/**
 * Screen 17 — view a saved invoice; hub for payment/sharing actions
 * (Section 16). Shows Invoice/Customer/Total/Paid/Remaining/Due
 * date/Payment status up top, then the standard PDF/WhatsApp/Email/Share
 * link/Record payment/Edit/Duplicate action set, mirroring the Stitch
 * "Invoice Detail" design restyled onto our own theme tokens.
 */
export function InvoiceDetailScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'InvoiceDetail'>().params;
  const loadForDuplicate = useInvoiceFormStore((s) => s.loadForDuplicate);

  // This tab-reachable screen stays mounted while Record Payment is pushed on
  // top of it; re-run on every focus (Phase 13) so a payment recorded there
  // and navigated back from is reflected here without a remount — same
  // convention as CustomerListScreen's focus reload.
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, []),
  );

  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);

  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  const customer = invoice ? mockCustomers.find((c) => c.id === invoice.customerId) : undefined;
  const payments = useMemo(() => mockPayments.filter((p) => p.invoiceId === invoiceId), [invoiceId, refreshKey]);
  const totalPaid = totalPaidForInvoice(invoiceId, mockPayments);
  const currency = mockBusiness.currencyCode;

  if (!invoice) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Invoice" onBack={() => navigation.goBack()} />
        <EmptyState title="Invoice not found" message="This invoice may have been removed." />
      </ScreenContainer>
    );
  }

  const remaining = invoice.total - totalPaid;

  function handleDuplicateConfirm() {
    setShowDuplicateConfirm(false);
    loadForDuplicate({
      customerId: invoice!.customerId,
      invoiceTypeId: invoice!.invoiceTypeId,
      notes: invoice!.notes,
      terms: invoice!.terms,
      lines: invoice!.items.map((item) => ({
        key: generateId(),
        itemNameSnapshot: item.itemNameSnapshot,
        unitSnapshot: item.unitSnapshot,
        quantity: item.quantity,
        weight: item.weight,
        length: item.length,
        width: item.width,
        height: item.height,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate,
      })),
    });
    navigation.navigate('InvoiceReview', undefined);
  }

  const actions: ActionSpec[] = [
    { icon: 'document-text-outline', label: 'PDF', onPress: () => navigation.navigate('InvoiceSharing', { invoiceId }) },
    { icon: 'logo-whatsapp', label: 'WhatsApp', onPress: () => navigation.navigate('InvoiceSharing', { invoiceId }) },
    { icon: 'mail-outline', label: 'Email', onPress: () => navigation.navigate('InvoiceSharing', { invoiceId }) },
    { icon: 'link-outline', label: 'Share link', onPress: () => navigation.navigate('InvoiceSharing', { invoiceId }) },
    { icon: 'cash-outline', label: 'Record payment', onPress: () => navigation.navigate('RecordPayment', { invoiceId }) },
    // Editing a saved invoice in place isn't implemented (no update-by-id
    // repository method exists) — this previously navigated to a blank
    // Create Invoice flow with the invoiceId silently dropped, which looked
    // like "Edit" but actually started an unrelated new invoice. Removed
    // rather than left misleading; "Duplicate" below is the supported way
    // to start a new invoice prefilled from this one.
    { icon: 'copy-outline', label: 'Duplicate', onPress: () => setShowDuplicateConfirm(true) },
  ];

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
            <View style={styles.headerCol}>
              <Text style={styles.metaLabel}>Invoice</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            </View>
            <View style={[styles.headerCol, styles.headerColRight]}>
              <Text style={styles.metaLabel}>Payment status</Text>
              <StatusBadge status={invoice.status} />
            </View>
          </View>

          <View style={styles.headerCol}>
            <Text style={styles.metaLabel}>Customer</Text>
            <Text style={styles.customerName} numberOfLines={1}>{customer?.name ?? 'Unknown customer'}</Text>
          </View>

          <View style={styles.divider} />

          <SummaryRow label="Total" value={formatCurrency(invoice.total, currency)} emphasize />
          <SummaryRow label="Paid" value={formatCurrency(totalPaid, currency)} valueColor={theme.colors.success} />
          <SummaryRow
            label="Remaining"
            value={formatCurrency(Math.max(remaining, 0), currency)}
            valueColor={remaining > 0 ? theme.colors.danger : theme.colors.success}
          />

          <View style={styles.divider} />

          <SummaryRow label="Due date" value={invoice.dueDate ? formatDate(new Date(invoice.dueDate)) : '—'} />
        </Card>

        <Card style={styles.actionsCard}>
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <ActionTile key={action.label} icon={action.icon} label={action.label} onPress={action.onPress} />
            ))}
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Line Items</Text>
        <Card style={styles.linesCard}>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName} numberOfLines={1}>{item.itemNameSnapshot}</Text>
                <Text style={styles.lineMeta}>{describeInvoiceLineQuantity(item)} × {formatCurrency(item.unitPrice, currency)}</Text>
              </View>
              <Text style={styles.lineTotal}>{formatCurrency(item.lineTotal, currency)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <TotalRow label="Subtotal" value={invoice.subtotal} currency={currency} />
          <TotalRow label="Discount" value={-invoice.discountTotal} currency={currency} />
          <TotalRow label="Tax" value={invoice.taxTotal} currency={currency} />
          <TotalRow label="Total" value={invoice.total} currency={currency} emphasize />
        </Card>

        <View style={styles.paymentsSectionHeader}>
          <Text style={styles.sectionLabel}>Payment History</Text>
          <Text style={styles.paidSummary}>{formatCurrency(totalPaid, currency)} paid</Text>
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
                <Text style={[styles.lineTotal, { color: theme.colors.success }]}>+{formatCurrency(payment.amount, currency)}</Text>
              </View>
            ))}
          </Card>
        )}

        {invoice.notes || invoice.terms ? (
          <>
            <Text style={styles.sectionLabel}>Notes & Terms</Text>
            <Card style={styles.linesCard}>
              {invoice.notes ? <Text style={styles.notesText}>{invoice.notes}</Text> : null}
              {invoice.notes && invoice.terms ? <View style={styles.divider} /> : null}
              {invoice.terms ? <Text style={styles.notesText}>{invoice.terms}</Text> : null}
            </Card>
          </>
        ) : null}
      </ScrollView>

      <ConfirmationDialog
        visible={showDuplicateConfirm}
        title="Duplicate invoice?"
        message={`A new draft will be created from ${invoice.invoiceNumber} with the same customer and items. You can review and edit it before saving.`}
        confirmLabel="Duplicate"
        onConfirm={handleDuplicateConfirm}
        onCancel={() => setShowDuplicateConfirm(false)}
      />
    </ScreenContainer>
  );
}

function SummaryRow({ label, value, emphasize, valueColor }: { label: string; value: string; emphasize?: boolean; valueColor?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text
        style={[
          emphasize ? styles.summaryValueEmphasize : styles.summaryValue,
          valueColor ? { color: valueColor } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function TotalRow({ label, value, currency, emphasize }: { label: string; value: number; currency: string; emphasize?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, emphasize && styles.totalLabelEmphasize]}>{label}</Text>
      <Text style={[styles.totalValue, emphasize && styles.totalValueEmphasize]}>{formatCurrency(value, currency)}</Text>
    </View>
  );
}

function ActionTile({ icon, label, onPress }: ActionSpec) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} accessibilityRole="button">
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Text style={styles.actionTileLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xl },
  headerCard: { marginBottom: theme.spacing.md, marginTop: theme.spacing.sm },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing.sm },
  headerCol: { gap: 2 },
  headerColRight: { alignItems: 'flex-end' },
  invoiceNumber: { ...theme.typography.headlineMd, color: theme.colors.textPrimary, marginTop: 2 },
  customerName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  summaryValue: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  summaryValueEmphasize: { ...theme.typography.displayFinancial, fontSize: 24, color: theme.colors.textPrimary },

  actionsCard: { marginBottom: theme.spacing.md },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  actionTile: { width: '25%', alignItems: 'center', gap: 6, paddingVertical: theme.spacing.xs },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTileLabel: { ...theme.typography.caption, color: theme.colors.textPrimary, fontWeight: '600', textAlign: 'center' },

  metaLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  linesCard: { marginBottom: theme.spacing.md },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  lineInfo: { flex: 1, marginRight: theme.spacing.sm },
  lineName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  lineMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  lineTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
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
});
