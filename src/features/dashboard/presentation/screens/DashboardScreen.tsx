import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { StatCard } from '../../../../core/components/StatCard';
import { SectionHeader } from '../../../../core/components/SectionHeader';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { computeDashboardSummary } from '../../domain/usecases/computeDashboardSummary';
import { InvoiceRow } from '../../../invoice/presentation/components/InvoiceRow';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { useResponsive } from '../../../../app/theme/useResponsive';

/** Screen 3 — at-a-glance business health (tab root, Section 16). */
export function DashboardScreen() {
  const navigation = useAppNavigation();
  const { isDesktop } = useResponsive();

  const summary = useMemo(() => computeDashboardSummary(mockInvoices, mockPayments), []);
  const customerNameById = useMemo(() => new Map(mockCustomers.map((c) => [c.id, c.name])), []);
  const recentInvoices = useMemo(
    () => [...mockInvoices].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1)).slice(0, 5),
    [],
  );

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{mockBusiness.name}</Text>
            <Text style={styles.subGreeting}>Here's how business is going</Text>
          </View>
          <View style={styles.logoCircle}>
            <Text style={styles.logoInitial}>{mockBusiness.logoInitial}</Text>
          </View>
        </View>

        <View style={[styles.statGrid, isDesktop && styles.statGridDesktop]}>
          <StatCard label="Total Sales" value={formatCurrency(summary.totalSales, 'USD')} />
          <StatCard label="Paid" value={formatCurrency(summary.totalPaid, 'USD')} tone="success" />
          <StatCard label="Outstanding" value={formatCurrency(summary.totalOutstanding, 'USD')} tone="warning" />
          <StatCard label="Overdue" value={formatCurrency(summary.totalOverdue, 'USD')} tone="danger" />
        </View>

        <View style={styles.quickActions}>
          <QuickAction icon="add-circle" label="New Invoice" onPress={() => navigation.navigate('CreateInvoiceCustomer')} />
          <QuickAction icon="person-add" label="New Customer" onPress={() => navigation.navigate('CreateCustomer', undefined)} />
          <QuickAction icon="card" label="Business Card" onPress={() => navigation.navigate('DigitalBusinessCard')} />
        </View>

        <SectionHeader title="Recent Invoices" actionLabel="See all" onAction={() => navigation.navigate('MainTabs', { screen: 'Invoices' })} />
        {recentInvoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            message="Create your first invoice to see it here."
            actionLabel="New Invoice"
            onAction={() => navigation.navigate('CreateInvoiceCustomer')}
          />
        ) : (
          recentInvoices.map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              customerName={customerNameById.get(invoice.customerId) ?? 'Unknown customer'}
              onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: invoice.id })}
            />
          ))
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress} accessibilityRole="button">
      <Ionicons name={icon} size={22} color={theme.colors.primary} />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
  greeting: { ...theme.typography.headlineLg, color: theme.colors.textPrimary },
  subGreeting: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  logoCircle: {
    width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { ...theme.typography.bodyStrong, color: theme.colors.textOnPrimary },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.lg },
  statGridDesktop: { flexWrap: 'nowrap' },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-between', backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.lg, padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  quickAction: { alignItems: 'center', gap: 6, flex: 1 },
  quickActionLabel: { ...theme.typography.caption, color: theme.colors.textPrimary, fontWeight: '600', textAlign: 'center' },
});
