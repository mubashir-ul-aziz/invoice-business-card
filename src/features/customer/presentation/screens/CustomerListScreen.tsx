import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { SearchBar } from '../../../../core/components/SearchBar';
import { FAB } from '../../../../core/components/FAB';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../data/datasources/mock/mockCustomers';
import { mockInvoices } from '../../../invoice/data/datasources/mock/mockInvoices';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { computeCustomerBalance } from '../../../../core/utils/customerBalance';
import { CustomerRow } from '../components/CustomerRow';

/** Screen 9 — browse/search customers, with computed balance (tab root, Section 16). */
export function CustomerListScreen() {
  const navigation = useAppNavigation();
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return mockCustomers
      .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))
      .map((customer) => ({
        customer,
        balance: computeCustomerBalance(mockInvoices.filter((i) => i.customerId === customer.id), mockPayments),
      }));
  }, [query]);

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Customers</Text>
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search customers" />
      </View>

      <FlatList
        data={rows}
        keyExtractor={({ customer }) => customer.id}
        renderItem={({ item }) => (
          <CustomerRow customer={item.customer} balance={item.balance} onPress={() => navigation.navigate('CustomerDetail', { customerId: item.customer.id })} />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No customers yet"
            message="Add your first customer to start creating invoices."
            actionLabel="Add Customer"
            onAction={() => navigation.navigate('CreateCustomer', undefined)}
          />
        }
      />

      <FAB accessibilityLabel="Add customer" onPress={() => navigation.navigate('CreateCustomer', undefined)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screenTitle: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
  searchWrap: { marginBottom: theme.spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },
});
