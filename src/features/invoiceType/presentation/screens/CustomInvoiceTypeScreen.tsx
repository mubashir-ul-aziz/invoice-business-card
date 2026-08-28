import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import {
  INVOICE_FIELD_GROUPS,
  INVOICE_FIELD_HINTS,
  INVOICE_FIELD_LABELS,
  InvoiceFieldKey,
  REQUIRED_INVOICE_FIELDS,
} from '../../../../core/constants/invoiceFieldVocabulary';
import { computeInvoiceTotals, InvoiceItemInput } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { useCustomInvoiceTypeStore } from '../state/customInvoiceTypeStore';

/** Sample line item the Live Preview card renders against — mock data only, never persisted. */
const PREVIEW_SAMPLE = {
  itemName: 'Consulting Session',
  description: 'Weekly strategy sync',
  sku: 'CS-01',
  quantity: 5,
  unit: 'hrs',
  weight: 10,
  length: 20,
  width: 15,
  height: 30,
  unitPrice: 100,
  discount: 50,
  taxRate: 10,
};

function buildPreviewLine(enabledFields: Set<InvoiceFieldKey>): InvoiceItemInput {
  return {
    unitPrice: PREVIEW_SAMPLE.unitPrice,
    quantity: enabledFields.has('quantity') ? PREVIEW_SAMPLE.quantity : undefined,
    weight: enabledFields.has('weight') ? PREVIEW_SAMPLE.weight : undefined,
    length: enabledFields.has('length') ? PREVIEW_SAMPLE.length : undefined,
    width: enabledFields.has('width') ? PREVIEW_SAMPLE.width : undefined,
    height: enabledFields.has('height') ? PREVIEW_SAMPLE.height : undefined,
    discount: enabledFields.has('discount') ? PREVIEW_SAMPLE.discount : undefined,
    taxRate: enabledFields.has('tax') ? PREVIEW_SAMPLE.taxRate : undefined,
  };
}

/** Screen 6 — define which item fields apply for a new custom invoice type (Section 16, Phase 6). */
export function CustomInvoiceTypeScreen() {
  const navigation = useAppNavigation();
  const { name, enabledFields, status, nameError, errorMessage, setName, toggleField, reset, save } =
    useCustomInvoiceTypeStore();

  // Each visit starts from a clean draft rather than carrying over the last type created.
  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currencyCode = mockBusiness.currencyCode;
  const preview = useMemo(() => computeInvoiceTotals([buildPreviewLine(enabledFields)]), [enabledFields]);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && status !== 'saving';

  async function handleSave() {
    const created = await save();
    if (created) navigation.goBack();
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Custom Invoice Type" onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>Configure which fields appear on your invoices.</Text>

      <AppTextField
        label="Type name *"
        placeholder="e.g. Rental, Subscription"
        value={name}
        onChangeText={setName}
        errorText={nameError}
      />

      {/* Live Preview */}
      <View style={styles.previewHeaderRow}>
        <Ionicons name="eye-outline" size={16} color={theme.colors.textSecondary} />
        <Text style={styles.previewHeaderLabel}>Live Preview</Text>
      </View>
      <Card style={styles.previewCard}>
        <Text style={styles.previewItemName}>{PREVIEW_SAMPLE.itemName}</Text>
        {enabledFields.has('description') ? (
          <Text style={styles.previewMuted}>{PREVIEW_SAMPLE.description}</Text>
        ) : null}
        {enabledFields.has('sku') ? <Text style={styles.previewMuted}>SKU: {PREVIEW_SAMPLE.sku}</Text> : null}

        <View style={styles.previewDivider} />

        {enabledFields.has('quantity') || enabledFields.has('unit') ? (
          <PreviewRow
            label="Qty"
            value={[
              enabledFields.has('quantity') ? String(PREVIEW_SAMPLE.quantity) : null,
              enabledFields.has('unit') ? PREVIEW_SAMPLE.unit : null,
            ]
              .filter(Boolean)
              .join(' ')}
          />
        ) : null}
        <PreviewRow label="Unit Price" value={formatCurrency(PREVIEW_SAMPLE.unitPrice, currencyCode)} />
        {enabledFields.has('weight') ? (
          <PreviewRow label="Weight" value={`${PREVIEW_SAMPLE.weight} kg`} />
        ) : null}
        {enabledFields.has('length') ? (
          <PreviewRow label="Length" value={`${PREVIEW_SAMPLE.length} cm`} />
        ) : null}
        {enabledFields.has('width') ? <PreviewRow label="Width" value={`${PREVIEW_SAMPLE.width} cm`} /> : null}
        {enabledFields.has('height') ? (
          <PreviewRow label="Height" value={`${PREVIEW_SAMPLE.height} cm`} />
        ) : null}

        <View style={styles.previewDivider} />

        <PreviewRow label="Subtotal" value={formatCurrency(preview.subtotal, currencyCode)} />
        {enabledFields.has('discount') ? (
          <PreviewRow label="Discount" value={`-${formatCurrency(preview.discountTotal, currencyCode)}`} />
        ) : null}
        {enabledFields.has('tax') ? (
          <PreviewRow label={`Tax (${PREVIEW_SAMPLE.taxRate}%)`} value={formatCurrency(preview.taxTotal, currencyCode)} />
        ) : null}
        <PreviewRow label="Total" value={formatCurrency(preview.total, currencyCode)} emphasize />
      </Card>

      {/* Field groups */}
      {INVOICE_FIELD_GROUPS.map((group) => (
        <View key={group.key} style={styles.group}>
          <Text style={styles.groupLabel}>{group.label}</Text>
          <Card padded={false} style={styles.fieldList}>
            {group.fields.map((field, index) => {
              const isOn = enabledFields.has(field);
              const isRequired = (REQUIRED_INVOICE_FIELDS as readonly string[]).includes(field);
              return (
                <TouchableOpacity
                  key={field}
                  style={[styles.fieldRow, index > 0 && styles.fieldRowDivider]}
                  onPress={() => toggleField(field)}
                  disabled={isRequired}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isOn, disabled: isRequired }}
                >
                  <View style={styles.fieldBody}>
                    <View style={styles.fieldNameRow}>
                      <Text style={styles.fieldLabel}>{INVOICE_FIELD_LABELS[field]}</Text>
                      {isRequired ? (
                        <View style={styles.requiredBadge}>
                          <Text style={styles.requiredBadgeText}>Required</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.fieldHint}>{INVOICE_FIELD_HINTS[field]}</Text>
                  </View>
                  <Ionicons
                    name={isOn ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isOn ? theme.colors.primary : theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>
      ))}

      {errorMessage ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}

      <AppButton
        label="Save Invoice Type"
        disabled={!canSave}
        loading={status === 'saving'}
        onPress={handleSave}
        style={styles.saveButton}
      />
    </ScreenContainer>
  );
}

function PreviewRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.previewRow}>
      <Text style={[styles.previewRowLabel, emphasize && styles.previewRowLabelEmphasis]}>{label}</Text>
      <Text style={[styles.previewRowValue, emphasize && styles.previewRowValueEmphasis]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },

  previewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  previewHeaderLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary },
  previewCard: { backgroundColor: theme.colors.surfaceAlt, marginBottom: theme.spacing.lg },
  previewItemName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  previewMuted: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  previewDivider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  previewRowLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  previewRowValue: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, fontWeight: '600' },
  previewRowLabelEmphasis: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  previewRowValueEmphasis: { ...theme.typography.bodyStrong, color: theme.colors.primary, fontSize: 16 },

  group: { marginBottom: theme.spacing.lg },
  groupLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  fieldList: { borderRadius: theme.radius.lg, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
  },
  fieldRowDivider: { borderTopWidth: 1, borderTopColor: theme.colors.border },
  fieldBody: { flex: 1, marginRight: theme.spacing.sm },
  fieldNameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  fieldLabel: { ...theme.typography.body, color: theme.colors.textPrimary },
  fieldHint: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: 2 },
  requiredBadge: {
    backgroundColor: theme.colors.infoBg,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 1,
  },
  requiredBadgeText: { ...theme.typography.labelSm, fontSize: 10, color: theme.colors.info },

  inlineError: { ...theme.typography.caption, color: theme.colors.danger, marginBottom: theme.spacing.xs },
  saveButton: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xl },
});
