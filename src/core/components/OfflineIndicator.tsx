import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../app/theme/theme';

interface OfflineIndicatorProps {
  /** Static/mock for now — a later phase wires this to real connectivity status (Section 11). */
  isOffline?: boolean;
}

/**
 * Reassures the user the app is fully usable offline (Section 11) — styled
 * as a calm, neutral status pill rather than a warning, since local-first is
 * the intended design, not a degraded fallback.
 */
export function OfflineIndicator({ isOffline = true }: OfflineIndicatorProps) {
  if (!isOffline) return null;
  return (
    <View style={styles.pill}>
      <View style={styles.dot} />
      <Ionicons name="cloud-offline-outline" size={14} color={theme.colors.textSecondary} />
      <Text style={styles.text}>Offline — all data saved on this device</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 5,
    marginBottom: theme.spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.success,
  },
  text: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' },
});
