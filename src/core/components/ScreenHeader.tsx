import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../app/theme/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
}

/** Consistent top bar (back button + title + optional right action) reused across all non-tab-root screens. */
export function ScreenHeader({ title, subtitle, onBack, rightLabel, onRightPress, rightIcon }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} hitSlop={8} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.side, styles.rightSide]}>
        {rightIcon && onRightPress ? (
          <TouchableOpacity accessibilityRole="button" onPress={onRightPress} hitSlop={8} style={styles.iconButton}>
            <Ionicons name={rightIcon} size={22} color={theme.colors.primary} />
          </TouchableOpacity>
        ) : rightLabel && onRightPress ? (
          <TouchableOpacity accessibilityRole="button" onPress={onRightPress} hitSlop={8}>
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.touchTarget,
    paddingVertical: theme.spacing.sm,
  },
  side: { minWidth: 40, alignItems: 'flex-start', justifyContent: 'center' },
  rightSide: { alignItems: 'flex-end' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  titleWrap: { flex: 1, alignItems: 'center' },
  title: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  subtitle: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  rightLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
});
