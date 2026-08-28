import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { LoadingState } from '../../../../core/components/LoadingState';
import { ErrorState } from '../../../../core/components/ErrorState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { invoiceTypeHasField } from '../../../invoiceType/domain/usecases/resolveInvoiceTypeFields';
import { useItemFormStore } from '../state/itemFormStore';

/** Screen 8 — Create/Edit Item, with fields conditional on the selected invoice type (Section 16, 27, Phase 7). */
export function CreateItemScreen() {
  const navigation = useAppNavigation();
  const route = useAppRoute<'CreateItem'>();
  const itemId = route.params?.itemId;
  const isEdit = !!itemId;

  const {
    name,
    description,
    sku,
    unit,
    defaultPrice,
    taxRate,
    weight,
    length,
    width,
    height,
    invoiceTypeId,
    status,
    invoiceTypes,
    fieldErrors,
    errorMessage,
    setField,
    startCreate,
    loadForEdit,
    save,
  } = useItemFormStore();

  useEffect(() => {
    if (itemId) {
      loadForEdit(itemId);
    } else {
      startCreate();
    }
    // Only re-run if the screen's target item actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  const selectedType = useMemo(
    () => invoiceTypes.find((type) => type.id === invoiceTypeId),
    [invoiceTypes, invoiceTypeId],
  );

  const nameError = fieldErrors.name || (name.trim().length === 0 ? 'Item name is required' : undefined);
  const priceError =
    fieldErrors.defaultPrice ||
    (defaultPrice.trim().length === 0
      ? 'Default price is required'
      : Number.isNaN(Number(defaultPrice))
        ? 'Enter a valid price'
        : undefined);
  const canSave = !nameError && !priceError && status !== 'saving';

  async function handleSave() {
    const saved = await save();
    if (saved) navigation.goBack();
  }

  if (status === 'loading') {
    return (
      <ScreenContainer>
        <ScreenHeader title={isEdit ? 'Edit Item' : 'Add Item'} onBack={() => navigation.goBack()} />
        <LoadingState label="Loading item…" />
      </ScreenContainer>
    );
  }

  if (isEdit && status === 'error' && !name) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Edit Item" onBack={() => navigation.goBack()} />
        <ErrorState message={errorMessage || 'Could not load this item.'} onRetry={() => loadForEdit(itemId!)} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title={isEdit ? 'Edit Item' : 'Add Item'} onBack={() => navigation.goBack()} />

      <AppTextField
        label="Item name *"
        placeholder="e.g. Consulting Session"
        value={name}
        onChangeText={(text) => setField('name', text)}
        errorText={nameError}
      />
      <AppTextField
        label="Description"
        placeholder="Optional"
        value={description}
        onChangeText={(text) => setField('description', text)}
        multiline
      />
      <AppTextField label="SKU / Code" placeholder="Optional" value={sku} onChangeText={(text) => setField('sku', text)} />

      <Text style={styles.fieldLabel}>Invoice type</Text>
      <View style={styles.chipRow}>
        {invoiceTypes.map((type) => (
          <Chip
            key={type.id}
            label={type.name}
            selected={invoiceTypeId === type.id}
            onPress={() => setField('invoiceTypeId', type.id)}
          />
        ))}
      </View>

      <View style={styles.row}>
        <AppTextField
          label="Unit"
          placeholder="pcs, kg, hr"
          value={unit}
          onChangeText={(text) => setField('unit', text)}
          containerStyle={styles.rowField}
        />
        <AppTextField
          label="Default price *"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={defaultPrice}
          onChangeText={(text) => setField('defaultPrice', text)}
          errorText={priceError}
          containerStyle={styles.rowField}
        />
      </View>

      {invoiceTypeHasField(selectedType, 'tax') ? (
        <AppTextField
          label="Tax rate (%)"
          placeholder="0"
          keyboardType="decimal-pad"
          value={taxRate}
          onChangeText={(text) => setField('taxRate', text)}
        />
      ) : null}

      {invoiceTypeHasField(selectedType, 'weight') ? (
        <AppTextField
          label="Weight (kg)"
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={weight}
          onChangeText={(text) => setField('weight', text)}
        />
      ) : null}

      {invoiceTypeHasField(selectedType, 'length') &&
      invoiceTypeHasField(selectedType, 'width') &&
      invoiceTypeHasField(selectedType, 'height') ? (
        <View style={styles.row}>
          <AppTextField
            label="Length"
            keyboardType="decimal-pad"
            value={length}
            onChangeText={(text) => setField('length', text)}
            containerStyle={styles.rowFieldThird}
          />
          <AppTextField
            label="Width"
            keyboardType="decimal-pad"
            value={width}
            onChangeText={(text) => setField('width', text)}
            containerStyle={styles.rowFieldThird}
          />
          <AppTextField
            label="Height"
            keyboardType="decimal-pad"
            value={height}
            onChangeText={(text) => setField('height', text)}
            containerStyle={styles.rowFieldThird}
          />
        </View>
      ) : null}

      {status === 'error' && errorMessage && Object.keys(fieldErrors).length === 0 ? (
        <Text style={styles.formError}>{errorMessage}</Text>
      ) : null}

      <View style={styles.actions}>
        <AppButton label="Cancel" variant="secondary" onPress={() => navigation.goBack()} style={styles.actionButton} />
        <AppButton
          label="Save Item"
          disabled={!canSave}
          loading={status === 'saving'}
          onPress={handleSave}
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
  formError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.sm },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md, marginBottom: theme.spacing.xl },
  actionButton: { flex: 1 },
});
