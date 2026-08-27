import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../app/theme/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

/** Shared search input used at the top of every list screen. */
export function SearchBar({ value, onChangeText, placeholder = 'Search' }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={theme.colors.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
        accessibilityLabel={placeholder}
      />
      {value.length > 0 ? (
        <Ionicons
          name="close-circle"
          size={18}
          color={theme.colors.textSecondary}
          onPress={() => onChangeText('')}
          suppressHighlighting
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.sm + 4,
    height: theme.touchTarget,
    gap: theme.spacing.sm,
  },
  input: { flex: 1, ...theme.typography.bodyLg, color: theme.colors.textPrimary, height: '100%' },
});
