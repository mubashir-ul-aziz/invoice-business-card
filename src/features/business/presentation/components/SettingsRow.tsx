import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';

interface SettingsRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
}

/**
 * One tappable row inside a settings-style card: leading icon, label +
 * secondary value, trailing chevron. Shared by every section on the
 * Business screen (profile fields, social links, invoice settings) so the
 * row look-and-feel stays defined in exactly one place.
 */
export function SettingsRow({ icon, iconColor, label, value, onPress, showChevron = true }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={iconColor ?? theme.colors.textSecondary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {value ? (
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
      </View>
      {onPress && showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  label: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  value: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 1 },
});
