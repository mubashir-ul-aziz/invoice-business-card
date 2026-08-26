import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../app/theme/theme';
import { AppButton } from './AppButton';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Consistent error treatment for every failed async operation (Screen 27).
 * Pass `Failure.message` from a Result — never a raw/unhandled exception.
 */
export function ErrorState({ message, onRetry, onDismiss }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {onRetry ? <AppButton label="Retry" onPress={onRetry} style={styles.actionButton} /> : null}
        {onDismiss ? (
          <AppButton label="Dismiss" variant="secondary" onPress={onDismiss} style={styles.actionButton} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  title: { ...theme.typography.h3, color: theme.colors.danger },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  actions: { flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  actionButton: { flex: 1 },
});
