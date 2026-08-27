import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { Item } from '../../domain/entities/Item';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';

interface ItemRowProps {
  item: Item;
  onPress: () => void;
}

export function ItemRow({ item, onPress }: ItemRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconWrap}>
        <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.meta} numberOfLines={1}>{item.sku ? `${item.sku} · ` : ''}{item.unit ?? 'unit'}</Text>
      </View>
      <Text style={styles.price}>{formatCurrency(item.defaultPrice, 'USD')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  meta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  price: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
});
