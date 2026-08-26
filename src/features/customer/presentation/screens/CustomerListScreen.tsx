import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EmptyState } from '../../../../core/components/EmptyState';
import { theme } from '../../../../app/theme/theme';

/** Placeholder for the Customers tab. Real content (Screen 9) lands in Phase 8. */
export function CustomerListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title="Customers" message="Your customer list, with balances, will appear here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
