import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { AppTextField } from '../../../../core/components/AppTextField';
import { Avatar } from '../../../../core/components/Avatar';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { computeInvoiceTotals, computeLineTotal, describeInvoiceLineQuantity } from '../../../../core/utils/invoiceCalculations';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { formatDate } from '../../../../core/utils/dateFormatter';
import { WizardSteps } from '../components/WizardSteps';
import { useInvoiceFormStore } from '../state/invoiceFormStore';

/** Screens the 3-step wizard may have pushed before landing here (Step 1 is
 * skipped by the "New Invoice" quick action on Customer Detail, so anywhere
 * from 1 to 3 of these can be on the stack). */
const WIZARD_ROUTE_NAMES = new Set(['CreateInvoiceCustomer', 'CreateInvoiceItems', 'InvoiceReview']);

/**
 * Screen 16 — final check before saving: business info, customer, invoice
 * number, dates, items, totals, notes/terms (Section 16). Laid out as a
 * document-style preview matching the Stitch "Review Invoice" design,
 * restyled onto our own theme tokens (Section 5's one-file restyle rule).
 */
export function InvoiceReviewScreen() {
  const navigation = useAppNavigation();
  const { customers, customerId, issueDate, dueDate, lines, notes, terms, setNotes, setTerms, submit } =
    useInvoiceFormStore();

  const customer = customers.find((c) => c.id === customerId);
  const totals = computeInvoiceTotals(lines);
  const currency = mockBusiness.currencyCode;
  const invoiceNumber = `${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`;

  if (!customerId || lines.length === 0) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Review Invoice" onBack={() => navigation.goBack()} />
        <WizardSteps currentStep={2} />
        <EmptyState
          title="Nothing to review yet"
          message="Add a customer and at least one line item before reviewing the invoice."
          actionLabel="Back to Items"
          onAction={() => navigation.goBack()}
        />
      </ScreenContainer>
    );
  }

  function handleSave() {
    // Appends the draft to the mock Invoice repository (in-memory only — no
    // SQLite yet) with InvoiceItem snapshot fields populated, and clears the draft.
    const savedInvoice = submit();
    if (!savedInvoice) return;

    // The draft is cleared by `submit()`, so simply navigating would leave
    // the wizard screens behind it stale (Review's own empty-draft guard
    // above, or an emptied Items step) — pressing back from Invoice Detail
    // would land in that dead end. Drop every wizard screen from the stack
    // first so back returns to wherever the invoice was started from. Reuse
    // the surviving route objects as-is (not just name/params) so MainTabs'
    // nested state — which tab was active, that tab's own stack — survives
    // the reset instead of resetting to the Dashboard tab.
    const state = navigation.getState();
    const baseRoutes = (state?.routes ?? []).filter((route) => !WIZARD_ROUTE_NAMES.has(route.name));
    navigation.reset({
      index: baseRoutes.length,
      routes: [...baseRoutes, { name: 'InvoiceDetail', params: { invoiceId: savedInvoice.id } }] as never,
    });
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Invoice Review" subtitle="Step 3 of 3" onBack={() => navigation.goBack()} />
      <WizardSteps currentStep={2} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.documentCard}>
          <View style={styles.docHeaderRow}>
            <View style={styles.docHeaderBusiness}>
              <Avatar name={mockBusiness.name} size={36} />
              <View style={styles.docHeaderBusinessText}>
                <Text style={styles.businessName} numberOfLines={1}>{mockBusiness.name}</Text>
                {mockBusiness.website ? <Text style={styles.businessTagline} numberOfLines={1}>{mockBusiness.website}</Text> : null}
              </View>
            </View>
            <View style={styles.docHeaderInvoice}>
              <Text style={styles.invoiceLabel}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoiceNumber}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.partiesRow}>
            <View style={styles.partyCol}>
              <Text style={styles.partyLabel}>FROM</Text>
              <Text style={styles.partyName} numberOfLines={1}>{mockBusiness.name}</Text>
              {mockBusiness.address ? <Text style={styles.partyMeta}>{mockBusiness.address}</Text> : null}
              {mockBusiness.email ? <Text style={styles.partyMeta} numberOfLines={1}>{mockBusiness.email}</Text> : null}
            </View>
            <View style={[styles.partyCol, styles.partyColRight]}>
              <Text style={styles.partyLabel}>BILL TO</Text>
              <Text style={styles.partyName} numberOfLines={1}>{customer?.name ?? '—'}</Text>
              {customer?.phone ? <Text style={styles.partyMeta}>{customer.phone}</Text> : null}
              {customer?.email ? <Text style={styles.partyMeta} numberOfLines={1}>{customer.email}</Text> : null}
            </View>
          </View>

          <View style={styles.dateRow}>
            <DateBlock label="Issue Date" value={formatDate(new Date(issueDate))} />
            <DateBlock label="Due Date" value={dueDate ? formatDate(new Date(dueDate)) : '—'} align="right" />
          </View>

          <View style={styles.divider} />

          <Text style={styles.itemsLabel}>Items ({lines.length})</Text>
          {lines.map((line) => (
            <View key={line.key} style={styles.lineRow}>
              <View style={styles.lineInfo}>
                <Text style={styles.lineName} numberOfLines={1}>{line.itemNameSnapshot}</Text>
                <Text style={styles.lineMeta}>
                  {describeInvoiceLineQuantity(line)} × {formatCurrency(line.unitPrice, currency)}
                </Text>
              </View>
              <Text style={styles.lineTotal}>{formatCurrency(computeLineTotal(line), currency)}</Text>
            </View>
          ))}

          <View style={styles.divider} />

          <Row label="Subtotal" value={formatCurrency(totals.subtotal, currency)} />
          {totals.discountTotal > 0 ? <Row label="Discount" value={`- ${formatCurrency(totals.discountTotal, currency)}`} /> : null}
          <Row label="Tax" value={formatCurrency(totals.taxTotal, currency)} />
          <View style={styles.divider} />
          <Row label="Total Due" value={formatCurrency(totals.total, currency)} emphasize />
        </Card>

        <AppTextField label="Notes" placeholder="Visible to your customer" value={notes} onChangeText={setNotes} multiline />
        <AppTextField label="Terms" placeholder="e.g. Net 30" value={terms} onChangeText={setTerms} />
      </ScrollView>

      <View style={styles.footerRow}>
        <AppButton label="Edit" variant="secondary" onPress={() => navigation.goBack()} style={styles.editButton} />
        <AppButton label="Save Invoice" onPress={handleSave} style={styles.saveButton} />
      </View>
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

function DateBlock({ label, value, align }: { label: string; value: string; align?: 'left' | 'right' }) {
  return (
    <View style={align === 'right' ? styles.dateBlockRight : styles.dateBlock}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.md },

  documentCard: { marginBottom: theme.spacing.md, marginTop: theme.spacing.sm },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.sm },

  docHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  docHeaderBusiness: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, flex: 1, marginRight: theme.spacing.sm },
  docHeaderBusinessText: { flex: 1 },
  businessName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  businessTagline: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 1 },
  docHeaderInvoice: { alignItems: 'flex-end' },
  invoiceLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary },
  invoiceNumber: { ...theme.typography.bodyStrong, color: theme.colors.primary, marginTop: 2 },

  partiesRow: { flexDirection: 'row', gap: theme.spacing.md },
  partyCol: { flex: 1, gap: 2 },
  partyColRight: { alignItems: 'flex-end' },
  partyLabel: { ...theme.typography.labelSm, color: theme.colors.textTertiary },
  partyName: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },
  partyMeta: { ...theme.typography.caption, color: theme.colors.textSecondary },

  dateRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.spacing.sm },
  dateBlock: { alignItems: 'flex-start' },
  dateBlockRight: { alignItems: 'flex-end' },
  dateLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  dateValue: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginTop: 2 },

  itemsLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  lineInfo: { flex: 1, marginRight: theme.spacing.sm },
  lineName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, fontWeight: '600' },
  lineMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  lineTotal: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },

  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  rowLabel: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  rowLabelEmphasize: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  rowValue: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  rowValueEmphasize: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },

  footerRow: {
    flexDirection: 'row', gap: theme.spacing.sm,
    marginTop: theme.spacing.sm, marginBottom: theme.spacing.md,
  },
  editButton: { flex: 1 },
  saveButton: { flex: 2 },
});
