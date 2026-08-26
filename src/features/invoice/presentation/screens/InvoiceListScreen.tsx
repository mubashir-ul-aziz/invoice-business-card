import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EmptyState } from '../../../../core/components/EmptyState';
import { theme } from '../../../../app/theme/theme';

/** Placeholder for the Invoices tab. Real content (Screen 13) lands in Phase 10. */
export function InvoiceListScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title="Invoices" message="Your invoices will be listed here, with search and status filters." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
