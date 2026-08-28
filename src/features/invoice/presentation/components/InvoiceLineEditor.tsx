import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { AppTextField } from '../../../../core/components/AppTextField';
import { invoiceTypeHasField } from '../../../invoiceType/domain/usecases/resolveInvoiceTypeFields';
import { InvoiceType } from '../../../invoiceType/domain/entities/InvoiceType';
import { DraftInvoiceLine } from '../../../../app/navigation/types';

interface InvoiceLineEditorProps {
  line: DraftInvoiceLine;
  invoiceType: InvoiceType | undefined;
  onChange: (patch: Partial<DraftInvoiceLine>) => void;
}

/** Blank clears the field back to "unset" rather than snapping to 0, so the input can be emptied while typing. */
function numberFieldToPatch(text: string): number | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function numberToText(value: number | undefined): string {
  return value == null ? '' : String(value);
}

/**
 * Inline "edit line" form shown under a line-item card (Screen 15
 * interaction: "Add line, edit line, remove line"). Renders only the fields
 * the selected InvoiceType enables, via `invoiceTypeHasField` — the same
 * shared use-case the Create/Edit Item screen reads (Section 27), so field
 * visibility never diverges between the two screens.
 */
export function InvoiceLineEditor({ line, invoiceType, onChange }: InvoiceLineEditorProps) {
  const hasQuantity = invoiceTypeHasField(invoiceType, 'quantity');
  const hasUnit = invoiceTypeHasField(invoiceType, 'unit');
  const hasWeight = invoiceTypeHasField(invoiceType, 'weight');
  const hasDimensions =
    invoiceTypeHasField(invoiceType, 'length') &&
    invoiceTypeHasField(invoiceType, 'width') &&
    invoiceTypeHasField(invoiceType, 'height');
  const hasDiscount = invoiceTypeHasField(invoiceType, 'discount');
  const hasTax = invoiceTypeHasField(invoiceType, 'tax');

  return (
    <View style={styles.editor}>
      {hasQuantity || hasUnit ? (
        <View style={styles.row}>
          {hasQuantity ? (
            <AppTextField
              label="Quantity"
              keyboardType="decimal-pad"
              value={numberToText(line.quantity)}
              onChangeText={(text) => onChange({ quantity: numberFieldToPatch(text) })}
              containerStyle={styles.rowField}
            />
          ) : null}
          {hasUnit ? (
            <AppTextField
              label="Unit"
              placeholder="pcs, kg, hr"
              value={line.unitSnapshot ?? ''}
              onChangeText={(text) => onChange({ unitSnapshot: text })}
              containerStyle={styles.rowField}
            />
          ) : null}
        </View>
      ) : null}

      {hasWeight ? (
        <AppTextField
          label="Weight (kg)"
          keyboardType="decimal-pad"
          value={numberToText(line.weight)}
          onChangeText={(text) => onChange({ weight: numberFieldToPatch(text) })}
        />
      ) : null}

      {hasDimensions ? (
        <View style={styles.row}>
          <AppTextField
            label="Length"
            keyboardType="decimal-pad"
            value={numberToText(line.length)}
            onChangeText={(text) => onChange({ length: numberFieldToPatch(text) })}
            containerStyle={styles.rowFieldThird}
          />
          <AppTextField
            label="Width"
            keyboardType="decimal-pad"
            value={numberToText(line.width)}
            onChangeText={(text) => onChange({ width: numberFieldToPatch(text) })}
            containerStyle={styles.rowFieldThird}
          />
          <AppTextField
            label="Height"
            keyboardType="decimal-pad"
            value={numberToText(line.height)}
            onChangeText={(text) => onChange({ height: numberFieldToPatch(text) })}
            containerStyle={styles.rowFieldThird}
          />
        </View>
      ) : null}

      <View style={styles.row}>
        <AppTextField
          label="Unit price"
          keyboardType="decimal-pad"
          value={numberToText(line.unitPrice)}
          onChangeText={(text) => onChange({ unitPrice: numberFieldToPatch(text) ?? 0 })}
          containerStyle={styles.rowField}
        />
        {hasDiscount ? (
          <AppTextField
            label="Discount"
            keyboardType="decimal-pad"
            value={numberToText(line.discount)}
            onChangeText={(text) => onChange({ discount: numberFieldToPatch(text) })}
            containerStyle={styles.rowField}
          />
        ) : null}
      </View>

      {hasTax ? (
        <AppTextField
          label="Tax rate (%)"
          keyboardType="decimal-pad"
          value={numberToText(line.taxRate)}
          onChangeText={(text) => onChange({ taxRate: numberFieldToPatch(text) })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  editor: { marginTop: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  row: { flexDirection: 'row', gap: theme.spacing.sm },
  rowField: { flex: 1 },
  rowFieldThird: { flex: 1 },
});
