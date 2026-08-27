import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Avatar } from '../../../../core/components/Avatar';
import { AppButton } from '../../../../core/components/AppButton';
import { SectionHeader } from '../../../../core/components/SectionHeader';
import { StatusBadge } from '../../../../core/components/StatusBadge';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { computeCustomerBalance } from '../../../../core/utils/customerBalance';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';

/** Screen 11 — one customer's relationship with the business (Section 16). */
export function CustomerDetailScreen() {
  const navigation = useAppNavigation();
  const { customerId } = useAppRoute<'CustomerDetail'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);

  const invoices = useMemo(
    () => mockInvoices.filter((i) => i.customerId === customerId).sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)),
    [customerId],
  );
  const balance = useMemo(() => computeCustomerBalance(invoices, mockPayments), [invoices]);

  if (!customer) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Customer" onBack={() => navigation.goBack()} />
        <EmptyState title="Customer not found" message="This customer may have been removed." />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScreenHeader
        title={customer.name}
        onBack={() => navigation.goBack()}
        rightIcon="create-outline"
        onRightPress={() => navigation.navigate('CreateCustomer', { customerId: customer.id })}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <View style={styles.profileRow}>
            <Avatar name={customer.name} size={56} />
            <View style={styles.profileInfo}>
              {customer.email ? <ContactLine icon="mail-outline" text={customer.email} /> : null}
              {customer.phone ? <ContactLine icon="call-outline" text={customer.phone} /> : null}
              {customer.address ? <ContactLine icon="location-outline" text={customer.address} /> : null}
            </View>
          </View>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Outstanding balance</Text>
            <Text style={[styles.balanceValue, balance > 0 && { color: theme.colors.warning }]}>
              {formatCurrency(balance, 'USD')}
            </Text>
          </View>
        </Card>

        <View style={styles.quickActions}>
          <AppButton
            label="New Invoice"
            onPress={() => navigation.navigate('CreateInvoiceItems', { customerId: customer.id, invoiceTypeId: 'type-general', issueDate: new Date().toISOString() })}
            style={styles.quickAction}
          />
          <AppButton
            label="Record Payment"
            variant="secondary"
            onPress={() => invoices[0] && navigation.navigate('RecordPayment', { invoiceId: invoices[0].id })}
            style={styles.quickAction}
          />
        </View>

        <SectionHeader title="Recent Invoices" actionLabel="History" onAction={() => navigation.navigate('CustomerHistory', { customerId: customer.id })} />
        {invoices.length === 0 ? (
          <EmptyState title="No invoices yet" message="Invoices for this customer will appear here." />
        ) : (
          invoices.slice(0, 5).map((invoice) => (
            <TouchableOpacity key={invoice.id} onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}>
              <Card style={styles.invoiceRow}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                  <Text style={styles.invoiceDate}>{formatDate(new Date(invoice.issueDate))}</Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invoiceTotal}>{formatCurrency(invoice.total, 'USD')}</Text>
                  <StatusBadge status={invoice.status} />
                </View>
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

function ContactLine({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.contactLine}>
      <Ionicons name={icon} size={14} color={theme.colors.textSecondary} />
      <Text style={styles.contactText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },
  headerCard: { marginBottom: theme.spacing.md },
  profileRow: { flexDirection: 'row', gap: theme.spacing.md },
  profileInfo: { flex: 1, justifyContent: 'center', gap: 4 },
  contactLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, flexShrink: 1 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  balanceLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  balanceValue: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  quickActions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  quickAction: { flex: 1 },
  invoiceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.sm },
  invoiceInfo: {},
  invoiceNumber: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  invoiceDate: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  invoiceRight: { alignItems: 'flex-end', gap: 4 },
  invoiceTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  notes: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
});
