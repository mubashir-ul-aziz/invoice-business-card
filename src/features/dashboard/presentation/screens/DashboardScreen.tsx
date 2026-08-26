import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EmptyState } from '../../../../core/components/EmptyState';
import { theme } from '../../../../app/theme/theme';

/** Placeholder for the Dashboard tab. Real content (Screen 3) lands in Phase 3. */
export function DashboardScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title="Dashboard" message="Sales totals, outstanding balances, and recent invoices will appear here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
