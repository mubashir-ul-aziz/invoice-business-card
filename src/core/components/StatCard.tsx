import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { theme } from '../../app/theme/theme';
import { Card } from './Card';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  style?: StyleProp<ViewStyle>;
}

const TONE_COLOR: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: theme.colors.textPrimary,
  success: theme.colors.success,
  warning: theme.colors.warning,
  danger: theme.colors.danger,
};

/** Dashboard summary tile (Total sales / Paid / Outstanding / Overdue). */
export function StatCard({ label, value, tone = 'neutral', style }: StatCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: TONE_COLOR[tone] }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140 },
  label: { ...theme.typography.labelSm, color: theme.colors.textSecondary, textTransform: 'uppercase' },
  value: { ...theme.typography.displayFinancial, fontSize: 24, marginTop: theme.spacing.xs },
});
