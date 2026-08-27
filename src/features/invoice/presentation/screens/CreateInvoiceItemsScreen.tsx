import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockInvoiceTypes } from '../../../invoiceType/data/datasources/mock/mockInvoiceTypes';
import { mockItems } from '../../../item/data/datasources/mock/mockItems';
import { invoiceTypeHasField } from '../../../invoiceType/domain/usecases/resolveInvoiceTypeFields';
import { computeInvoiceTotals, computeLineTotal } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { WizardSteps } from '../components/WizardSteps';
import { DraftInvoiceLine } from '../../../../app/navigation/types';
import { generateId } from '../../../../core/utils/idGenerator';

/** Screen 15 — Create Invoice, step 2: add line items, fields conditional on invoice type (Section 16, 27). */
export function CreateInvoiceItemsScreen() {
  const navigation = useAppNavigation();
  const { customerId, invoiceTypeId, issueDate, dueDate } = useAppRoute<'CreateInvoiceItems'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);
  const invoiceType = mockInvoiceTypes.find((t) => t.id === invoiceTypeId);

  const [lines, setLines] = useState<DraftInvoiceLine[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const totals = useMemo(() => computeInvoiceTotals(lines), [lines]);

  function addLineFromItem(itemId: string) {
    const item = mockItems.find((i) => i.id === itemId);
    if (!item) return;
    const line: DraftInvoiceLine = {
      key: generateId(),
      itemNameSnapshot: item.name,
      unitSnapshot: item.unit,
      quantity: invoiceTypeHasField(invoiceType, 'quantity') ? 1 : undefined,
      weight: invoiceTypeHasField(invoiceType, 'weight') ? item.weight ?? 1 : undefined,
      length: invoiceTypeHasField(invoiceType, 'length') ? item.length ?? 1 : undefined,
      width: invoiceTypeHasField(invoiceType, 'width') ? item.width ?? 1 : undefined,
      height: invoiceTypeHasField(invoiceType, 'height') ? item.height ?? 1 : undefined,
      unitPrice: item.defaultPrice,
      discount: 0,
      taxRate: invoiceTypeHasField(invoiceType, 'tax') ? item.taxRate ?? 0 : undefined,
    };
    setLines((prev) => [...prev, line]);
    setShowPicker(false);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="New Invoice" subtitle={customer?.name} onBack={() => navigation.goBack()} />
      <WizardSteps currentStep={1} />

      <FlatList
        data={lines}
        keyExtractor={(line) => line.key}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState title="No line items yet" message="Add items from your catalog to build this invoice." />}
        renderItem={({ item }) => (
          <Card style={styles.lineCard}>
            <View style={styles.lineTopRow}>
              <Text style={styles.lineName} numberOfLines={1}>{item.itemNameSnapshot}</Text>
              <TouchableOpacity onPress={() => removeLine(item.key)} accessibilityLabel="Remove line item">
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              </TouchableOpacity>
            </View>
            <Text style={styles.lineMeta}>
              {item.quantity != null ? `Qty ${item.quantity} ${item.unitSnapshot ?? ''} · ` : ''}
              {item.weight != null ? `${item.weight}kg · ` : ''}
              {item.length != null ? `${item.length}×${item.width}×${item.height} · ` : ''}
              {formatCurrency(item.unitPrice, 'USD')} ea
            </Text>
            <Text style={styles.lineTotal}>{formatCurrency(computeLineTotal(item), 'USD')}</Text>
          </Card>
        )}
        ListFooterComponent={
          showPicker ? (
            <Card style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Choose an item</Text>
              {mockItems.map((item) => (
                <TouchableOpacity key={item.id} style={styles.pickerRow} onPress={() => addLineFromItem(item.id)}>
                  <Text style={styles.pickerRowName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.pickerRowPrice}>{formatCurrency(item.defaultPrice, 'USD')}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          ) : (
            <TouchableOpacity style={styles.addRow} onPress={() => setShowPicker(true)} accessibilityRole="button">
              <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.addRowLabel}>Add Line Item</Text>
            </TouchableOpacity>
          )
        }
      />

      <View style={styles.summaryBar}>
        <View>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totals.total, 'USD')}</Text>
        </View>
        <AppButton
          label="Next: Review"
          disabled={lines.length === 0}
          onPress={() => navigation.navigate('InvoiceReview', { customerId, invoiceTypeId, issueDate, dueDate, lines })}
          style={styles.nextButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.md, gap: theme.spacing.sm },
  lineCard: { marginBottom: theme.spacing.sm },
  lineTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, flex: 1, marginRight: theme.spacing.sm },
  lineMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
  lineTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  addRowLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  pickerCard: { marginTop: theme.spacing.xs },
  pickerTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  pickerRowName: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  pickerRowPrice: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm,
  },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  summaryValue: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  nextButton: { minWidth: 160 },
});
