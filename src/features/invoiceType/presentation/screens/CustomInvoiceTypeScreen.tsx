import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { INVOICE_FIELD_LABELS, INVOICE_FIELD_VOCABULARY, InvoiceFieldKey } from '../../../../core/constants/invoiceFieldVocabulary';

/** Screen 6 — define which item fields apply for a new custom invoice type (Section 16). */
export function CustomInvoiceTypeScreen() {
  const navigation = useAppNavigation();
  const [name, setName] = useState('');
  const [enabledFields, setEnabledFields] = useState<Set<InvoiceFieldKey>>(new Set(['quantity', 'discount', 'tax']));

  function toggleField(field: InvoiceFieldKey) {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  }

  const nameError = name.trim().length === 0 ? 'Give this type a name' : undefined;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Custom Invoice Type" onBack={() => navigation.goBack()} />

      <AppTextField label="Type name *" placeholder="e.g. Rental, Subscription" value={name} onChangeText={setName} errorText={nameError} />

      <Text style={styles.sectionLabel}>Fields to include</Text>
      <Text style={styles.sectionHint}>Choose which fields line items on this invoice type will collect.</Text>

      <View style={styles.fieldList}>
        {INVOICE_FIELD_VOCABULARY.map((field) => {
          const isOn = enabledFields.has(field);
          return (
            <TouchableOpacity
              key={field}
              style={styles.fieldRow}
              onPress={() => toggleField(field)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isOn }}
            >
              <Text style={styles.fieldLabel}>{INVOICE_FIELD_LABELS[field]}</Text>
              <Ionicons name={isOn ? 'checkbox' : 'square-outline'} size={22} color={isOn ? theme.colors.primary : theme.colors.textTertiary} />
            </TouchableOpacity>
          );
        })}
      </View>

      <AppButton
        label="Save Custom Type"
        disabled={!!nameError || enabledFields.size === 0}
        onPress={() => navigation.goBack()}
        style={styles.saveButton}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
  sectionHint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2, marginBottom: theme.spacing.sm },
  fieldList: { gap: 1, borderRadius: theme.radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  fieldLabel: { ...theme.typography.body, color: theme.colors.textPrimary },
  saveButton: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xl },
});
