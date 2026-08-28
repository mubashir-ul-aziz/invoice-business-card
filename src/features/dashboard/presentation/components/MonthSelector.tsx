import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { Card } from '../../../../core/components/Card';

interface MonthSelectorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

/** Steps the dashboard's reporting period one month at a time (Phase 3: Month selector). */
export function MonthSelector({ label, onPrevious, onNext, canGoPrevious, canGoNext }: MonthSelectorProps) {
  return (
    <Card style={styles.card} padded={false}>
      <TouchableOpacity
        onPress={onPrevious}
        disabled={!canGoPrevious}
        style={styles.arrowButton}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={20} color={canGoPrevious ? theme.colors.textPrimary : theme.colors.textTertiary} />
      </TouchableOpacity>

      <View style={styles.labelWrap}>
        <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.label}>{label}</Text>
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={!canGoNext}
        style={styles.arrowButton}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        hitSlop={8}
      >
        <Ionicons name="chevron-forward" size={20} color={canGoNext ? theme.colors.textPrimary : theme.colors.textTertiary} />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  arrowButton: {
    width: theme.touchTarget,
    height: theme.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
});
