import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { EmptyState } from '../../../../core/components/EmptyState';
import { theme } from '../../../../app/theme/theme';

/** Placeholder for the Business tab. Real content (Screen 4) lands in Phase 4. */
export function BusinessScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <EmptyState title="Business" message="Your business profile, digital card, and settings links will appear here." />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
});
