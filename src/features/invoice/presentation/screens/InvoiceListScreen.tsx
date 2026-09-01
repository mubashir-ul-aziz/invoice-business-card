import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { SearchBar } from '../../../../core/components/SearchBar';
import { Chip } from '../../../../core/components/Chip';
import { FAB } from '../../../../core/components/FAB';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { InvoiceRow } from '../components/InvoiceRow';
import { InvoiceStatus } from '../../domain/entities/Invoice';

const FILTERS: Array<{ key: InvoiceStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'partial', label: 'Partial' },
  { key: 'unpaid', label: 'Unpaid' },
  { key: 'overdue', label: 'Overdue' },
];

/** Screen 13 — browse/search/filter all invoices (tab root, Section 16). */
export function InvoiceListScreen() {
  const navigation = useAppNavigation();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  // This tab-root screen stays mounted while Create Invoice/Invoice Detail
  // are pushed on top of it; re-run on every focus so an invoice
  // created/edited there and navigated back from is reflected immediately —
  // same convention as InvoiceDetailScreen's focus reload.
  const [refreshKey, setRefreshKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((key) => key + 1);
    }, []),
  );

  const customerNameById = useMemo(() => new Map(mockCustomers.map((c) => [c.id, c.name])), [refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockInvoices
      .filter((invoice) => filter === 'all' || invoice.status === filter)
      .filter((invoice) => {
        if (!q) return true;
        const customerName = customerNameById.get(invoice.customerId)?.toLowerCase() ?? '';
        return invoice.invoiceNumber.toLowerCase().includes(q) || customerName.includes(q);
      })
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [query, filter, customerNameById, refreshKey]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Invoices</Text>
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search invoices" />
      </View>

      <FlatList
        horizontal
        data={FILTERS}
        keyExtractor={(f) => f.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterList}
        renderItem={({ item }) => <Chip label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />}
      />

      <FlatList
        data={filtered}
        keyExtractor={(invoice) => invoice.id}
        renderItem={({ item }) => (
          <InvoiceRow
            invoice={item}
            customerName={customerNameById.get(item.customerId) ?? 'Unknown customer'}
            onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No invoices found"
            message={query || filter !== 'all' ? 'Try a different search or filter.' : 'Create your first invoice to get started.'}
            actionLabel={query || filter !== 'all' ? undefined : 'New Invoice'}
            onAction={query || filter !== 'all' ? undefined : () => navigation.navigate('CreateInvoiceCustomer')}
          />
        }
      />

      <FAB accessibilityLabel="New invoice" onPress={() => navigation.navigate('CreateInvoiceCustomer')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenTitle: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
  searchWrap: { marginBottom: theme.spacing.sm },
  filterList: { flexGrow: 0, marginBottom: theme.spacing.sm },
  filterRow: { gap: theme.spacing.sm, paddingVertical: 2 },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },
});
