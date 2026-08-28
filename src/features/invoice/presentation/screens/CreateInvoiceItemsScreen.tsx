import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { SearchBar } from '../../../../core/components/SearchBar';
import { EmptyState } from '../../../../core/components/EmptyState';
import { LoadingState } from '../../../../core/components/LoadingState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { filterItems } from '../../../item/domain/usecases/filterItems';
import { computeInvoiceTotals, computeLineTotal } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { WizardSteps } from '../components/WizardSteps';
import { InvoiceLineEditor } from '../components/InvoiceLineEditor';
import { useInvoiceFormStore } from '../state/invoiceFormStore';

/** Screen 15 — Create Invoice, step 2: add line items, fields conditional on invoice type (Section 16, 27). */
export function CreateInvoiceItemsScreen() {
  const navigation = useAppNavigation();
  const preset = useAppRoute<'CreateInvoiceItems'>().params;
  const currencyCode = mockBusiness.currencyCode;

  const {
    customers,
    items,
    invoiceTypes,
    referenceStatus,
    customerId,
    invoiceTypeId,
    lines,
    editingLineKey,
    presetDraft,
    addLineFromItem,
    updateLine,
    removeLine,
    setEditingLineKey,
    loadReferenceData,
  } = useInvoiceFormStore();

  const [showPicker, setShowPicker] = useState(false);
  const [itemQuery, setItemQuery] = useState('');

  useEffect(() => {
    // Direct-entry shortcut (e.g. Customer Detail's "New Invoice" quick
    // action) skips Step 1 — seed a fresh draft for that customer instead of
    // reusing whatever the wizard's shared draft last held.
    if (preset?.customerId) {
      presetDraft(preset);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh the catalog on every focus so an item created via "+ Add New
  // Item" below is available as soon as this screen regains focus.
  useFocusEffect(
    useCallback(() => {
      loadReferenceData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const customer = customers.find((c) => c.id === customerId);
  const invoiceType = invoiceTypes.find((t) => t.id === invoiceTypeId);
  const totals = useMemo(() => computeInvoiceTotals(lines), [lines]);
  const filteredItems = useMemo(() => filterItems(items, itemQuery, null), [items, itemQuery]);

  function addItem(itemId: string) {
    addLineFromItem(itemId);
    setShowPicker(false);
    setItemQuery('');
  }

  if (referenceStatus === 'loading' || referenceStatus === 'idle') {
    return (
      <ScreenContainer>
        <ScreenHeader title="New Invoice" onBack={() => navigation.goBack()} />
        <WizardSteps currentStep={1} />
        <LoadingState label="Loading catalog…" />
      </ScreenContainer>
    );
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
        renderItem={({ item }) => {
          const expanded = item.key === editingLineKey;
          return (
            <Card style={styles.lineCard}>
              <View style={styles.lineTopRow}>
                <TouchableOpacity
                  style={styles.lineTitleTap}
                  onPress={() => setEditingLineKey(expanded ? undefined : item.key)}
                  accessibilityRole="button"
                  accessibilityLabel={expanded ? 'Collapse line item' : 'Edit line item'}
                >
                  <Text style={styles.lineName} numberOfLines={1}>{item.itemNameSnapshot}</Text>
                  <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeLine(item.key)} accessibilityLabel="Remove line item" hitSlop={8} style={styles.removeButton}>
                  <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                </TouchableOpacity>
              </View>
              <Text style={styles.lineMeta}>
                {item.quantity != null ? `Qty ${item.quantity} ${item.unitSnapshot ?? ''} · ` : ''}
                {item.weight != null ? `${item.weight}kg · ` : ''}
                {item.length != null ? `${item.length}×${item.width}×${item.height} · ` : ''}
                {formatCurrency(item.unitPrice, currencyCode)} ea
              </Text>
              <Text style={styles.lineTotal}>{formatCurrency(computeLineTotal(item), currencyCode)}</Text>

              {expanded ? (
                <InvoiceLineEditor
                  line={item}
                  invoiceType={invoiceType}
                  onChange={(patch) => updateLine(item.key, patch)}
                />
              ) : null}
            </Card>
          );
        }}
        ListFooterComponent={
          showPicker ? (
            <Card style={styles.pickerCard}>
              <Text style={styles.pickerTitle}>Choose an item</Text>
              <SearchBar value={itemQuery} onChangeText={setItemQuery} placeholder="Search catalog" />
              <TouchableOpacity
                style={styles.newItemRow}
                onPress={() => navigation.navigate('CreateItem', undefined)}
                accessibilityRole="button"
              >
                <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.newItemLabel}>Add new item</Text>
              </TouchableOpacity>
              {filteredItems.length === 0 ? (
                <Text style={styles.pickerEmpty}>No items match "{itemQuery}".</Text>
              ) : (
                filteredItems.map((item) => (
                  <TouchableOpacity key={item.id} style={styles.pickerRow} onPress={() => addItem(item.id)}>
                    <Text style={styles.pickerRowName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.pickerRowPrice}>{formatCurrency(item.defaultPrice, currencyCode)}</Text>
                  </TouchableOpacity>
                ))
              )}
              <AppButton label="Close" variant="secondary" onPress={() => setShowPicker(false)} style={styles.closePickerButton} />
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
          <Text style={styles.summaryValue}>{formatCurrency(totals.total, currencyCode)}</Text>
        </View>
        <AppButton
          label="Next: Review"
          disabled={lines.length === 0}
          onPress={() => navigation.navigate('InvoiceReview', undefined)}
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
  lineTopRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  lineTitleTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  lineName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, flex: 1 },
  removeButton: { marginLeft: theme.spacing.xs },
  lineMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 4 },
  lineTotal: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: theme.spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  addRowLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  pickerCard: { marginTop: theme.spacing.xs, gap: theme.spacing.sm },
  pickerTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  newItemRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  newItemLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  pickerEmpty: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, paddingVertical: theme.spacing.sm },
  pickerRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  pickerRowName: { ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 },
  pickerRowPrice: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  closePickerButton: { marginTop: theme.spacing.xs },
  summaryBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: theme.spacing.md, paddingBottom: theme.spacing.sm,
  },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  summaryValue: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  nextButton: { minWidth: 160 },
});
