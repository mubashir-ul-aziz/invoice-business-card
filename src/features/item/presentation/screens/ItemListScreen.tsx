import React, { useEffect, useMemo } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { SearchBar } from '../../../../core/components/SearchBar';
import { FAB } from '../../../../core/components/FAB';
import { EmptyState } from '../../../../core/components/EmptyState';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { Chip } from '../../../../core/components/Chip';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { filterItems } from '../../domain/usecases/filterItems';
import { useItemListStore } from '../state/itemListStore';
import { ItemRow } from '../components/ItemRow';

/** Screen 7 — browse/search/filter the item catalog (Section 16, Phase 7). */
export function ItemListScreen() {
  const navigation = useAppNavigation();
  const { items, invoiceTypes, status, errorMessage, searchQuery, selectedTypeId, load, setSearchQuery, setSelectedTypeId } =
    useItemListStore();

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => filterItems(items, searchQuery, selectedTypeId),
    [items, searchQuery, selectedTypeId],
  );

  const typeNameById = useMemo(() => new Map(invoiceTypes.map((type) => [type.id, type.name])), [invoiceTypes]);
  const currencyCode = mockBusiness.currencyCode;

  if (status === 'loading' || status === 'idle') {
    return (
      <ScreenContainer>
        <ScreenHeader title="Items" onBack={() => navigation.goBack()} />
        <LoadingState label="Loading items…" />
      </ScreenContainer>
    );
  }

  if (status === 'error' && items.length === 0) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Items" onBack={() => navigation.goBack()} />
        <ErrorState message={errorMessage ?? 'Could not load items.'} onRetry={load} />
      </ScreenContainer>
    );
  }

  const hasAnyItems = items.length > 0;

  return (
    <ScreenContainer>
      <ScreenHeader title="Items" onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Search items or SKU" />
      </View>

      {hasAnyItems ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
          style={styles.chipScroll}
        >
          <Chip label="All Items" selected={selectedTypeId === null} onPress={() => setSelectedTypeId(null)} />
          {invoiceTypes.map((type) => (
            <Chip
              key={type.id}
              label={type.name}
              selected={selectedTypeId === type.id}
              onPress={() => setSelectedTypeId(type.id)}
            />
          ))}
        </ScrollView>
      ) : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ItemRow
            item={item}
            invoiceTypeName={item.invoiceTypeId ? typeNameById.get(item.invoiceTypeId) : undefined}
            currencyCode={currencyCode}
            onPress={() => navigation.navigate('CreateItem', { itemId: item.id })}
          />
        )}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          hasAnyItems ? (
            <EmptyState title="No items found" message="Try adjusting your search or filter." />
          ) : (
            <EmptyState
              title="No items yet"
              message="Add the products or services you sell so they're ready to add to invoices."
              actionLabel="Add Item"
              onAction={() => navigation.navigate('CreateItem', undefined)}
            />
          )
        }
      />

      <FAB accessibilityLabel="Add item" onPress={() => navigation.navigate('CreateItem', undefined)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: { marginBottom: theme.spacing.sm },
  chipScroll: { flexGrow: 0, marginBottom: theme.spacing.sm },
  chipRow: { gap: theme.spacing.sm, paddingRight: theme.spacing.md },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },
});
