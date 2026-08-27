import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { AppTextField } from '../../../../core/components/AppTextField';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { computeInvoiceTotals, computeLineTotal } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { WizardSteps } from '../components/WizardSteps';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';

/** Screen 16 — final check before saving: totals, notes, terms (Section 16). */
export function InvoiceReviewScreen() {
  const navigation = useAppNavigation();
  const { customerId, lines, issueDate, dueDate } = useAppRoute<'InvoiceReview'>().params;
  const customer = mockCustomers.find((c) => c.id === customerId);
  const totals = computeInvoiceTotals(lines);

  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Net 30');

  const nextInvoiceNumber = `${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`;

  function handleSave() {
    // Stage 1: no persistence yet — land on an existing mock invoice to show the Detail screen.
    navigation.navigate('InvoiceDetail', { invoiceId: mockInvoices[0].id });
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Review Invoice" subtitle={nextInvoiceNumber} onBack={() => navigation.goBack()} />
      <WizardSteps currentStep={2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.summaryCard}>
          <Row label="Customer" value={customer?.name ?? '—'} />
          <Row label="Issue date" value={formatDate(new Date(issueDate))} />
          <Row label="Due date" value={dueDate ? formatDate(new Date(dueDate)) : '—'} />
        </Card>

        <Text style={styles.sectionLabel}>Line Items ({lines.length})</Text>
        <Card style={styles.linesCard}>
          {lines.map((line) => (
            <View key={line.key} style={styles.lineRow}>
              <Text style={styles.lineName} numberOfLines={1}>{line.itemNameSnapshot}</Text>
              <Text style={styles.lineTotal}>{formatCurrency(computeLineTotal(line), 'USD')}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.totalsCard}>
          <Row label="Subtotal" value={formatCurrency(totals.subtotal, 'USD')} />
          <Row label="Discount" value={`- ${formatCurrency(totals.discountTotal, 'USD')}`} />
          <Row label="Tax" value={formatCurrency(totals.taxTotal, 'USD')} />
          <View style={styles.divider} />
          <Row label="Total" value={formatCurrency(totals.total, 'USD')} emphasize />
        </Card>

        <AppTextField label="Notes" placeholder="Visible to your customer" value={notes} onChangeText={setNotes} multiline />
        <AppTextField label="Terms" placeholder="e.g. Net 30" value={terms} onChangeText={setTerms} />
      </ScrollView>

      <AppButton label="Save Invoice" onPress={handleSave} style={styles.saveButton} />
    </ScreenContainer>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, emphasize && styles.rowLabelEmphasize]}>{label}</Text>
      <Text style={[styles.rowValue, emphasize && styles.rowValueEmphasize]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.md },
  summaryCard: { marginBottom: theme.spacing.md, gap: theme.spacing.xs },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  linesCard: { marginBottom: theme.spacing.md },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1, marginRight: theme.spacing.sm },
  lineTotal: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  totalsCard: { marginBottom: theme.spacing.md, gap: 6 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  rowLabelEmphasize: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  rowValue: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  rowValueEmphasize: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  saveButton: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },
});
