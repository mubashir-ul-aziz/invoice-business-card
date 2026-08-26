import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../app/theme/theme';
import { AppButton } from './AppButton';

interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Consistent "nothing here yet" treatment for every list (Screen 25). */
export function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  title: { ...theme.typography.h3, color: theme.colors.textPrimary, textAlign: 'center' },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  action: { marginTop: theme.spacing.lg, alignSelf: 'stretch' },
});
