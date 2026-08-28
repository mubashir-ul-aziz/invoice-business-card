import React, { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { SearchBar } from '../../../../core/components/SearchBar';
import { Chip } from '../../../../core/components/Chip';
import { FAB } from '../../../../core/components/FAB';
import { EmptyState } from '../../../../core/components/EmptyState';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { filterCustomers, CustomerFilter } from '../../domain/usecases/filterCustomers';
import { useCustomerListStore } from '../state/customerListStore';
import { CustomerRow } from '../components/CustomerRow';

const FILTERS: Array<{ key: CustomerFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'overdue', label: 'Overdue' },
];

/** Screen 9 — browse/search/filter customers, with computed balance (tab root, Section 16, Phase 8). */
export function CustomerListScreen() {
  const navigation = useAppNavigation();
  const { customers, activityByCustomerId, status, errorMessage, searchQuery, filter, load, setSearchQuery, setFilter } =
    useCustomerListStore();

  // Reload on every focus (not just first mount) so a customer created/edited
  // via Create Customer and navigated back from is reflected immediately —
  // this tab-root screen stays mounted across that round trip.
  useFocusEffect(
    useCallback(() => {
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const filtered = useMemo(
    () => filterCustomers(customers, activityByCustomerId, searchQuery, filter),
    [customers, activityByCustomerId, searchQuery, filter],
  );

  if (status === 'loading' || status === 'idle') {
    return (
      <ScreenContainer>
        <Text style={styles.screenTitle}>Customers</Text>
        <LoadingState label="Loading customers…" />
      </ScreenContainer>
    );
  }

  if (status === 'error' && customers.length === 0) {
    return (
      <ScreenContainer>
        <Text style={styles.screenTitle}>Customers</Text>
        <ErrorState message={errorMessage ?? 'Could not load customers.'} onRetry={load} />
      </ScreenContainer>
    );
  }

  const hasAnyCustomers = customers.length > 0;

  return (
    <ScreenContainer>
      <Text style={styles.screenTitle}>Customers</Text>
      <View style={styles.searchWrap}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search customers" />
      </View>

      {hasAnyCustomers ? (
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          style={styles.filterList}
          renderItem={({ item }) => <Chip label={item.label} selected={filter === item.key} onPress={() => setFilter(item.key)} />}
        />
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(customer) => customer.id}
        renderItem={({ item }) => {
          const activity = activityByCustomerId[item.id];
          return (
            <CustomerRow
              customer={item}
              balance={activity?.balance ?? 0}
              invoiceCount={activity?.invoiceCount ?? 0}
              onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            />
          );
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          hasAnyCustomers ? (
            <EmptyState title="No customers found" message="Try a different search or filter." />
          ) : (
            <EmptyState
              title="No customers yet"
              message="Add your first customer to start creating invoices."
              actionLabel="Add Customer"
              onAction={() => navigation.navigate('CreateCustomer', undefined)}
            />
          )
        }
      />

      <FAB accessibilityLabel="Add customer" onPress={() => navigation.navigate('CreateCustomer', undefined)} />
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
