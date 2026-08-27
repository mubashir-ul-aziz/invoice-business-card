import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { SearchBar } from '../../../../core/components/SearchBar';
import { FAB } from '../../../../core/components/FAB';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockItems } from '../../data/datasources/mock/mockItems';
import { ItemRow } from '../components/ItemRow';

/** Screen 7 — browse/search/manage the item catalog (Section 16). */
export function ItemListScreen() {
  const navigation = useAppNavigation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockItems;
    return mockItems.filter((item) => item.name.toLowerCase().includes(q) || item.sku?.toLowerCase().includes(q));
  }, [query]);

  return (
    <ScreenContainer>
      <ScreenHeader title="Items" onBack={() => navigation.goBack()} />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search items" />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ItemRow item={item} onPress={() => navigation.navigate('CreateItem', { itemId: item.id })} />}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No items yet"
            message="Add the products or services you sell so they're ready to add to invoices."
            actionLabel="Add Item"
            onAction={() => navigation.navigate('CreateItem', undefined)}
          />
        }
      />

      <FAB accessibilityLabel="Add item" onPress={() => navigation.navigate('CreateItem', undefined)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchWrap: { marginBottom: theme.spacing.sm },
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.xxl },
});
