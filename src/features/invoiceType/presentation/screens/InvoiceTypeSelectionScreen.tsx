import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoiceTypes } from '../../data/datasources/mock/mockInvoiceTypes';
import { INVOICE_FIELD_LABELS } from '../../../../core/constants/invoiceFieldVocabulary';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';

/** Screen 5 — choose/manage which invoice type(s) the business uses (Section 16). */
export function InvoiceTypeSelectionScreen() {
  const navigation = useAppNavigation();
  const { fromOnboarding } = useAppRoute<'InvoiceTypeSelection'>().params ?? {};
  const [selectedId, setSelectedId] = useState(mockBusiness.defaultInvoiceTypeId ?? mockInvoiceTypes[0].id);

  function handleSetDefault() {
    if (fromOnboarding) {
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } else {
      navigation.goBack();
    }
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Invoice Types" onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
      <FlatList
        data={mockInvoiceTypes}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.customRow}
            onPress={() => navigation.navigate('CustomInvoiceType')}
            accessibilityRole="button"
          >
            <Ionicons name="add-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.customRowLabel}>Create Custom Type</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const isSelected = item.id === selectedId;
          return (
            <TouchableOpacity onPress={() => setSelectedId(item.id)} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}>
              <Card style={[styles.typeCard, isSelected && styles.typeCardSelected]}>
                <View style={styles.typeHeader}>
                  <View style={styles.typeTitleRow}>
                    <Text style={styles.typeName}>{item.name}</Text>
                    {item.isSystemDefined ? (
                      <View style={styles.systemPill}>
                        <Text style={styles.systemPillLabel}>System</Text>
                      </View>
                    ) : null}
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? theme.colors.primary : theme.colors.textTertiary}
                  />
                </View>
                <Text style={styles.typeDescription}>{item.description}</Text>
                <View style={styles.fieldRow}>
                  {item.enabledFields.map((field) => (
                    <View key={field} style={styles.fieldChip}>
                      <Text style={styles.fieldChipLabel}>{INVOICE_FIELD_LABELS[field]}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
      <AppButton label={fromOnboarding ? 'Continue to Dashboard' : 'Set as Default'} onPress={handleSetDefault} style={styles.saveButton} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  listContent: { paddingBottom: theme.spacing.md, gap: theme.spacing.sm },
  typeCard: { marginBottom: theme.spacing.sm },
  typeCardSelected: { borderColor: theme.colors.primary, borderWidth: 1.5 },
  typeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  typeName: { ...theme.typography.bodyStrong, fontSize: 17, color: theme.colors.textPrimary },
  systemPill: { backgroundColor: theme.colors.surfaceAlt, paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.radius.full },
  systemPillLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary },
  typeDescription: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  fieldRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: theme.spacing.sm },
  fieldChip: { backgroundColor: theme.colors.primaryLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: theme.radius.sm },
  fieldChipLabel: { ...theme.typography.caption, color: theme.colors.primaryDark, fontWeight: '600' },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.md },
  customRowLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  saveButton: { marginBottom: theme.spacing.md },
});
