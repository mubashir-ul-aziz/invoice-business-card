import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../app/theme/theme';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
}

/** Floating action button used for the primary "add" action on list screens. */
export function FAB({ onPress, icon = 'add', accessibilityLabel }: FABProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeOpacity={0.85}
    >
      <Ionicons name={icon} size={26} color={theme.colors.textOnPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
