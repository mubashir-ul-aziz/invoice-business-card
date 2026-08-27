import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../../app/theme/theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Selectable filter chip (status filters, tag toggles). */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.xs + 2,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.surfaceAlt,
  },
  chipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  label: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, fontWeight: '600' },
  labelSelected: { color: theme.colors.primaryDark },
});
