import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockItems } from '../../data/datasources/mock/mockItems';
import { mockInvoiceTypes } from '../../../invoiceType/data/datasources/mock/mockInvoiceTypes';
import { invoiceTypeHasField } from '../../../invoiceType/domain/usecases/resolveInvoiceTypeFields';

/** Screen 8 — Create/Edit Item, with fields conditional on the selected invoice type (Section 16, 27). */
export function CreateItemScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateItem'>();
  const existing = route.params?.itemId ? mockItems.find((i) => i.id === route.params?.itemId) : undefined;
  const isEdit = !!existing;

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [sku, setSku] = useState(existing?.sku ?? '');
  const [unit, setUnit] = useState(existing?.unit ?? '');
  const [price, setPrice] = useState(existing ? String(existing.defaultPrice) : '');
  const [taxRate, setTaxRate] = useState(existing?.taxRate != null ? String(existing.taxRate) : '');
  const [weight, setWeight] = useState(existing?.weight != null ? String(existing.weight) : '');
  const [length, setLength] = useState(existing?.length != null ? String(existing.length) : '');
  const [width, setWidth] = useState(existing?.width != null ? String(existing.width) : '');
  const [height, setHeight] = useState(existing?.height != null ? String(existing.height) : '');
  const [invoiceTypeId, setInvoiceTypeId] = useState(existing?.invoiceTypeId ?? mockInvoiceTypes[0].id);

  const selectedType = useMemo(() => mockInvoiceTypes.find((t) => t.id === invoiceTypeId), [invoiceTypeId]);
  const nameError = name.trim().length === 0 ? 'Item name is required' : undefined;
  const priceError = price.trim().length > 0 && Number.isNaN(Number(price)) ? 'Enter a valid price' : undefined;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={isEdit ? 'Edit Item' : 'Add Item'} onBack={() => navigation.goBack()} />

      <AppTextField label="Item name *" placeholder="e.g. Consulting Session" value={name} onChangeText={setName} errorText={nameError} />
      <AppTextField label="Description" placeholder="Optional" value={description} onChangeText={setDescription} multiline />
      <AppTextField label="SKU" placeholder="Optional" value={sku} onChangeText={setSku} />

      <Text style={styles.fieldLabel}>Invoice type</Text>
      <View style={styles.chipRow}>
        {mockInvoiceTypes.map((type) => (
          <Chip key={type.id} label={type.name} selected={invoiceTypeId === type.id} onPress={() => setInvoiceTypeId(type.id)} />
        ))}
      </View>

      <View style={styles.row}>
        <AppTextField label="Unit" placeholder="pcs, kg, hr" value={unit} onChangeText={setUnit} containerStyle={styles.rowField} />
        <AppTextField
          label="Default price *"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
          errorText={priceError}
          containerStyle={styles.rowField}
        />
      </View>

      {invoiceTypeHasField(selectedType, 'tax') ? (
        <AppTextField label="Tax rate (%)" placeholder="0" keyboardType="decimal-pad" value={taxRate} onChangeText={setTaxRate} />
      ) : null}

      {invoiceTypeHasField(selectedType, 'weight') ? (
        <AppTextField label="Weight (kg)" placeholder="0.00" keyboardType="decimal-pad" value={weight} onChangeText={setWeight} />
      ) : null}

      {invoiceTypeHasField(selectedType, 'length') && invoiceTypeHasField(selectedType, 'width') && invoiceTypeHasField(selectedType, 'height') ? (
        <View style={styles.row}>
          <AppTextField label="Length" keyboardType="decimal-pad" value={length} onChangeText={setLength} containerStyle={styles.rowFieldThird} />
          <AppTextField label="Width" keyboardType="decimal-pad" value={width} onChangeText={setWidth} containerStyle={styles.rowFieldThird} />
          <AppTextField label="Height" keyboardType="decimal-pad" value={height} onChangeText={setHeight} containerStyle={styles.rowFieldThird} />
        </View>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={styles.actionButton} />
        <AppButton
          label="Save Item"
          disabled={!!nameError || !!priceError}
          onPress={() => navigation.goBack()}
          style={styles.actionButton}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  rowField: { flex: 1 },
  rowFieldThird: { flex: 1 },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  actionButton: { flex: 1 },
});
