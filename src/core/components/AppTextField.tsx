import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { theme } from '../../app/theme/theme';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  errorText?: string;
}

/** The single text-input implementation every form should use. */
export function AppTextField({ label, errorText, style, ...inputProps }: AppTextFieldProps) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, errorText ? styles.inputError : null, style]}
        {...inputProps}
      />
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.md },
  label: {
    ...theme.typography.bodyStrong,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  inputError: { borderColor: theme.colors.danger },
  errorText: {
    ...theme.typography.caption,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
  },
});
