import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Avatar } from '../../../../core/components/Avatar';
import { SectionHeader } from '../../../../core/components/SectionHeader';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { computeCustomerFinancials } from '../../domain/usecases/computeCustomerFinancials';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';

const WHATSAPP_GREEN = '#25D366';
const WHATSAPP_GREEN_BG = '#DCF8C6';

/** Screen 11 — one customer's relationship with the business: info, quick actions, financials, invoice history (Phase 9). */
export function CustomerDetailScreen() {
  const navigation = useAppNavigation();
  const { customerId } = useAppRoute<'CustomerDetail'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);

  const invoices = useMemo(
    () => mockInvoices.filter((i) => i.customerId === customerId).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [customerId],
  );
  const financials = useMemo(() => computeCustomerFinancials(invoices, mockPayments), [invoices]);
  const payableInvoice = useMemo(() => invoices.find((i) => i.status !== 'paid') ?? invoices[0], [invoices]);

  if (!customer) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Customer" onBack={() => navigation.goBack()} />
        <EmptyState title="Customer not found" message="This customer may have been removed." />
      </ScreenContainer>
    );
  }

  function openExternal(url: string) {
    Linking.openURL(url).catch(() => {
      // Best-effort only — opening an external app/link is never on the offline-required path.
    });
  }

  function callCustomer() {
    if (customer!.phone) openExternal(`tel:${customer!.phone}`);
  }

  function whatsappCustomer() {
    if (customer!.phone) openExternal(`https://wa.me/${customer!.phone.replace(/[^\d]/g, '')}`);
  }

  function emailCustomer() {
    if (customer!.email) openExternal(`mailto:${customer!.email}`);
  }

  function createInvoice() {
    navigation.navigate('CreateInvoiceItems', {
      customerId: customer!.id,
      invoiceTypeId: 'type-general',
      issueDate: new Date().toISOString(),
    });
  }

  function recordPayment() {
    if (payableInvoice) navigation.navigate('RecordPayment', { invoiceId: payableInvoice.id });
  }

  const actions: Array<{
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    accessibilityLabel: string;
    color: string;
    bg: string;
    onPress: () => void;
    disabled?: boolean;
  }> = [
    { key: 'call', icon: 'call-outline', label: 'Call', accessibilityLabel: 'Call customer', color: theme.colors.primary, bg: theme.colors.primaryLight, onPress: callCustomer, disabled: !customer.phone },
    { key: 'whatsapp', icon: 'logo-whatsapp', label: 'WhatsApp', accessibilityLabel: 'Message on WhatsApp', color: WHATSAPP_GREEN, bg: WHATSAPP_GREEN_BG, onPress: whatsappCustomer, disabled: !customer.phone },
    { key: 'email', icon: 'mail-outline', label: 'Email', accessibilityLabel: 'Email customer', color: theme.colors.textSecondary, bg: theme.colors.surfaceAlt, onPress: emailCustomer, disabled: !customer.email },
    { key: 'invoice', icon: 'receipt-outline', label: 'Invoice', accessibilityLabel: 'Create invoice', color: theme.colors.textSecondary, bg: theme.colors.surfaceAlt, onPress: createInvoice },
    { key: 'payment', icon: 'cash-outline', label: 'Payment', accessibilityLabel: 'Record payment', color: theme.colors.textSecondary, bg: theme.colors.surfaceAlt, onPress: recordPayment, disabled: !payableInvoice },
  ];

  return (
    <ScreenContainer>
      <ScreenHeader
        title={customer.name}
        onBack={() => navigation.goBack()}
        rightIcon="create-outline"
        onRightPress={() => navigation.navigate('CreateCustomer', { customerId: customer.id })}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Customer information */}
        <View style={styles.profileRow}>
          <Avatar name={customer.name} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName} numberOfLines={1}>{customer.name}</Text>
            {customer.address ? (
              <View style={styles.contactLine}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.contactText} numberOfLines={1}>{customer.address}</Text>
              </View>
            ) : null}
            {customer.phone ? (
              <View style={styles.contactLine}>
                <Ionicons name="call-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.contactText} numberOfLines={1}>{customer.phone}</Text>
              </View>
            ) : null}
            {customer.email ? (
              <View style={styles.contactLine}>
                <Ionicons name="mail-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={styles.contactText} numberOfLines={1}>{customer.email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Quick actions: Call, WhatsApp, Email, Create Invoice, Record Payment */}
        <View style={styles.actionsRow}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionButton}
              onPress={action.onPress}
              disabled={action.disabled}
              accessibilityRole="button"
              accessibilityLabel={action.accessibilityLabel}
              accessibilityState={{ disabled: action.disabled }}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.bg }, action.disabled && styles.actionIconWrapDisabled]}>
                <Ionicons name={action.icon} size={19} color={action.disabled ? theme.colors.textTertiary : action.color} />
              </View>
              <Text style={[styles.actionLabel, { color: action.disabled ? theme.colors.textTertiary : action.color }]} numberOfLines={1}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Financial summary: Total billed, Total paid, Outstanding, Overdue */}
        <SectionHeader title="Financial Summary" />
        <View style={styles.metricsGrid}>
          <View style={[styles.metricTile, styles.metricTileTall, styles.metricTileNeutral]}>
            <Text style={styles.metricLabel}>Outstanding</Text>
            <Text style={styles.metricValueLg}>{formatCurrency(financials.outstanding, 'USD')}</Text>
          </View>
          <View style={[styles.metricTile, styles.metricTileTall, styles.metricTileDanger]}>
            <View style={styles.metricLabelRow}>
              <Ionicons name="warning-outline" size={13} color={theme.colors.danger} />
              <Text style={[styles.metricLabel, { color: theme.colors.danger }]}>Overdue</Text>
            </View>
            <Text style={[styles.metricValueLg, { color: theme.colors.danger }]}>{formatCurrency(financials.overdue, 'USD')}</Text>
          </View>
          <View style={[styles.metricTile, styles.metricTileNeutral]}>
            <Text style={styles.metricLabel}>Total Billed</Text>
            <Text style={styles.metricValueSm}>{formatCurrency(financials.totalBilled, 'USD')}</Text>
          </View>
          <View style={[styles.metricTile, styles.metricTileNeutral]}>
            <Text style={styles.metricLabel}>Total Paid</Text>
            <Text style={[styles.metricValueSm, { color: theme.colors.success }]}>{formatCurrency(financials.totalPaid, 'USD')}</Text>
          </View>
        </View>

        {/* Invoice history */}
        <SectionHeader title="Recent Invoices" actionLabel="View All" onAction={() => navigation.navigate('CustomerHistory', { customerId: customer.id })} />
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" message="Invoices for this customer will appear here." />
        ) : (
          invoices.slice(0, 5).map((invoice) => (
            <TouchableOpacity key={invoice.id} activeOpacity={0.8} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}>
              <Card style={styles.invoiceRow}>
                <View style={styles.invoiceInfo}>
                  <View style={styles.invoiceNumberRow}>
                    <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                    <StatusBadge status={invoice.status} />
                  </View>
                  <Text style={styles.invoiceDate}>
                    {formatDate(new Date(invoice.issueDate))}
                    {invoice.status === 'overdue' && invoice.dueDate ? ` • Due ${formatDate(new Date(invoice.dueDate))}` : ''}
                  </Text>
                </View>
                <Text style={styles.invoiceTotal}>{formatCurrency(invoice.total, 'USD')}</Text>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {customer.notes ? (
          <>
            <SectionHeader title="Notes" />
            <Card>
              <Text style={styles.notes}>{customer.notes}</Text>
            </Card>
          </>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },
  profileRow: { flexDirection: 'row', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  profileInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  profileName: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginBottom: 2 },
  contactLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, flexShrink: 1 },

  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  actionButton: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: theme.spacing.xs },
  actionIconWrap: { width: 40, height: 40, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  actionIconWrapDisabled: { backgroundColor: theme.colors.surfaceAlt },
  actionLabel: { ...theme.typography.labelSm, fontSize: 11 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  metricTile: { flexBasis: '47%', flexGrow: 1, borderRadius: theme.radius.lg, padding: theme.spacing.md, justifyContent: 'space-between' },
  metricTileTall: { minHeight: 92 },
  metricTileNeutral: { backgroundColor: theme.colors.surfaceAlt, borderWidth: 1, borderColor: theme.colors.border },
  metricTileDanger: { backgroundColor: theme.colors.dangerBg },
  metricLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary, textTransform: 'uppercase' },
  metricLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricValueLg: { ...theme.typography.displayFinancial, fontSize: 22, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
  metricValueSm: { ...theme.typography.headlineMd, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },

  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  invoiceInfo: { flex: 1, gap: 4 },
  invoiceNumberRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  invoiceNumber: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  invoiceDate: { ...theme.typography.caption, color: theme.colors.textSecondary },
  invoiceTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  notes: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
});
