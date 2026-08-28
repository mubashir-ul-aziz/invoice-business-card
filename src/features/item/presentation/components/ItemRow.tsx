import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { Item } from '../../domain/entities/Item';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';

interface ItemRowProps {
  item: Item;
  /** Display name of `item.invoiceTypeId`'s InvoiceType, if resolved by the caller — omitted if unknown. */
  invoiceTypeName?: string;
  currencyCode: string;
  onPress: () => void;
}

/** A single row in the Items List (Screen 7) — reused nowhere else, but kept as its own component per Section 5. */
export function ItemRow({ item, invoiceTypeName, currencyCode, onPress }: ItemRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconWrap}>
        <Ionicons name="cube-outline" size={20} color={theme.colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {item.sku ? `${item.sku} · ` : ''}
          {invoiceTypeName ?? (item.unit || 'Item')}
        </Text>
      </View>
      <View style={styles.priceWrap}>
        <Text style={styles.price}>{formatCurrency(item.defaultPrice, currencyCode)}</Text>
        {item.unit ? <Text style={styles.unit}>/{item.unit}</Text> : null}
      </View>
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
  priceWrap: { alignItems: 'flex-end' },
  price: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  unit: { ...theme.typography.caption, color: theme.colors.textTertiary },
});
