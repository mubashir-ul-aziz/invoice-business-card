import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../app/theme/theme';

interface LoadingStateProps {
  label?: string;
}

/** Consistent loading treatment for async operations (Screen 26). */
export function LoadingState({ label = 'Loading…' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  label: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
});
