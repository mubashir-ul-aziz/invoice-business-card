import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../app/theme/theme';
import { InvoiceStatusKey } from '../../app/theme/colors';

const LABELS: Record<InvoiceStatusKey, string> = {
  paid: 'Paid',
  partial: 'Partial',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
};

interface StatusBadgeProps {
  status: InvoiceStatusKey;
  label?: string;
}

/** Pill-shaped status indicator, the single rendering path for Paid/Partial/Unpaid/Overdue everywhere. */
export function StatusBadge({ status, label }: StatusBadgeProps) {
  const colorSet = theme.statusColors[status];
  return (
    <View style={[styles.badge, { backgroundColor: colorSet.bg }]}>
      <Text style={[styles.label, { color: colorSet.fg }]}>{label ?? LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    alignSelf: 'flex-start',
  },
  label: { ...theme.typography.labelSm },
});
