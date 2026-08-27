import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Chip } from '../../../../core/components/Chip';
import { AppTextField } from '../../../../core/components/AppTextField';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockAppSettings, CURRENCY_OPTIONS, mockInvoiceTemplates } from '../../data/datasources/mock/mockSettings';

/** Screen 23 — app-level configuration (Section 16). */
export function SettingsScreen() {
  const navigation = useAppNavigation();
  const [currency, setCurrency] = useState(mockAppSettings.defaultCurrency);
  const [taxRate, setTaxRate] = useState(String(mockAppSettings.defaultTaxRate ?? ''));
  const selectedTemplate = mockInvoiceTemplates.find((t) => t.id === mockAppSettings.invoiceTemplateId);

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>Currency & Tax</Text>
        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Default currency</Text>
          <View style={styles.chipRow}>
            {CURRENCY_OPTIONS.map((option) => (
              <Chip key={option.code} label={option.code} selected={currency === option.code} onPress={() => setCurrency(option.code)} />
            ))}
          </View>
          <AppTextField label="Default tax rate (%)" keyboardType="decimal-pad" value={taxRate} onChangeText={setTaxRate} />
        </Card>

        <Text style={styles.sectionLabel}>Invoicing</Text>
        <TouchableOpacity onPress={() => navigation.navigate('InvoiceTemplateSelection')} accessibilityRole="button">
          <Card style={[styles.card, styles.row]}>
            <View style={styles.rowInfo}>
              <Text style={styles.fieldLabel}>Invoice template</Text>
              <Text style={styles.rowValue}>{selectedTemplate?.name}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('InvoiceTypeSelection')} accessibilityRole="button">
          <Card style={[styles.card, styles.row]}>
            <Text style={styles.fieldLabel}>Invoice numbering & types</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>Data</Text>
        <TouchableOpacity onPress={() => navigation.navigate('BackupRestore')} accessibilityRole="button">
          <Card style={[styles.card, styles.row]}>
            <Text style={styles.fieldLabel}>Backup & Restore</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>About</Text>
        <Card style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Version</Text>
            <Text style={styles.rowValue}>1.0.0 (MVP)</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },
  sectionLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary, textTransform: 'uppercase', marginBottom: theme.spacing.sm, marginTop: theme.spacing.md },
  card: { marginBottom: theme.spacing.sm },
  fieldLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowInfo: { flex: 1 },
  rowValue: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
});
