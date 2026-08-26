import React from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '../../app/theme/theme';

type Variant = 'primary' | 'secondary' | 'destructive';

interface AppButtonProps {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** The single button implementation every screen should use — no ad hoc TouchableOpacity styling per screen. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.base, variantStyles[variant], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? theme.colors.primary : theme.colors.textOnPrimary} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' && styles.labelSecondary]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    ...theme.typography.button,
    color: theme.colors.textOnPrimary,
  },
  labelSecondary: {
    color: theme.colors.primary,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: theme.colors.primary },
  secondary: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  destructive: { backgroundColor: theme.colors.danger },
};
