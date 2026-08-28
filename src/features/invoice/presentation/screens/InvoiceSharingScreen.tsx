import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Chip } from '../../../../core/components/Chip';
import { AppButton } from '../../../../core/components/AppButton';
import { EmptyState } from '../../../../core/components/EmptyState';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { mockCustomers } from '../../../customer/data/datasources/mock/mockCustomers';
import { mockPayments } from '../../../payment/data/datasources/mock/mockPayments';
import { totalPaidForInvoice } from '../../../../core/utils/customerBalance';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';
import { generateInvoicePdf, previewInvoicePdf, toPdfInvoiceData } from '../../../../pdf/invoicePdfBuilder';
import { INVOICE_TEMPLATE_LIST, DEFAULT_INVOICE_TEMPLATE_ID } from '../../../../pdf/templates';
import { InvoiceTemplateId } from '../../../../pdf/types';
import { buildInvoiceShareLink } from '../../../../pdf/shareLink';
import { isFileSharingAvailable, shareInvoicePdfFile, shareLinkByEmail, shareLinkToWhatsApp } from '../../../../pdf/shareInvoice';

type BusyAction = 'preview' | 'generate' | 'whatsapp' | 'email' | 'more' | 'copy' | null;

interface GeneratedPdf {
  templateId: InvoiceTemplateId;
  uri: string;
  fileName: string;
}

/**
 * Screen 19 — export/share an invoice (Section 16, 19, 28). PDF generation
 * is fully local (`expo-print`); the PDF layer is only ever handed
 * already-resolved domain objects (Invoice/Business/Customer) built here,
 * never touched from inside `src/pdf/**`.
 */
export function InvoiceSharingScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'InvoiceSharing'>().params;
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  const customer = invoice ? mockCustomers.find((c) => c.id === invoice.customerId) : undefined;

  const [templateId, setTemplateId] = useState<InvoiceTemplateId>(DEFAULT_INVOICE_TEMPLATE_ID);
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [generated, setGenerated] = useState<GeneratedPdf | null>(null);
  const [copied, setCopied] = useState(false);

  const currency = mockBusiness.currencyCode;
  const shareLink = useMemo(() => (invoice ? buildInvoiceShareLink(invoice.id) : null), [invoice]);

  const pdfData = useMemo(() => {
    if (!invoice || !customer) return null;
    const totalPaid = totalPaidForInvoice(invoice.id, mockPayments);
    return toPdfInvoiceData(invoice, mockBusiness, customer, totalPaid);
  }, [invoice, customer]);

  if (!invoice || !customer || !pdfData || !shareLink) {
    return (
      <ScreenContainer>
        <ScreenHeader title="Share Invoice" onBack={() => navigation.goBack()} />
        <EmptyState title="Invoice not found" message="This invoice may have been removed." />
      </ScreenContainer>
    );
  }

  const shareMessage = `Invoice ${invoice.invoiceNumber} from ${mockBusiness.name} — ${formatCurrency(invoice.total, currency)}. View: ${shareLink.url}`;

  async function ensurePdfGenerated(): Promise<GeneratedPdf> {
    if (generated && generated.templateId === templateId) return generated;
    const { uri, fileName } = await generateInvoicePdf(pdfData!, templateId);
    const next: GeneratedPdf = { templateId, uri, fileName };
    setGenerated(next);
    return next;
  }

  async function runAction(action: Exclude<BusyAction, null>, task: () => Promise<void>) {
    if (busyAction) return;
    setBusyAction(action);
    try {
      await task();
    } catch (error) {
      Alert.alert('Something went wrong', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusyAction(null);
    }
  }

  const handlePreview = () => runAction('preview', () => previewInvoicePdf(pdfData!, templateId));

  const handleGenerate = () =>
    runAction('generate', async () => {
      await ensurePdfGenerated();
    });

  const handleWhatsApp = () => runAction('whatsapp', () => shareLinkToWhatsApp(shareMessage));

  const handleEmail = () =>
    runAction('email', () => shareLinkByEmail(`Invoice ${invoice.invoiceNumber}`, shareMessage));

  const handleMore = () =>
    runAction('more', async () => {
      const available = await isFileSharingAvailable();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing isn’t supported on this device — try Preview instead to save the PDF.');
        return;
      }
      const file = await ensurePdfGenerated();
      await shareInvoicePdfFile(file.uri, `Share ${invoice.invoiceNumber}`);
    });

  const handleCopyLink = () =>
    runAction('copy', async () => {
      await Clipboard.setStringAsync(shareLink.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });

  const isGenerated = generated?.templateId === templateId;

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Share Invoice" subtitle={invoice.invoiceNumber} onBack={() => navigation.goBack()} />

      <Text style={styles.sectionLabel}>Template</Text>
      <View style={styles.templateRow}>
        {INVOICE_TEMPLATE_LIST.map((template) => (
          <Chip
            key={template.id}
            label={template.name}
            selected={templateId === template.id}
            onPress={() => setTemplateId(template.id)}
          />
        ))}
      </View>

      <Card style={styles.previewCard}>
        <View style={styles.previewIcon}>
          <Ionicons name="document-text" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle} numberOfLines={1}>
            {isGenerated ? generated!.fileName : `${invoice.invoiceNumber}.pdf`}
          </Text>
          <Text style={styles.previewMeta}>
            {formatCurrency(invoice.total, currency)}{isGenerated ? ' · Ready to share' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.previewButton} onPress={handlePreview} accessibilityRole="button" disabled={busyAction !== null}>
          {busyAction === 'preview' ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Ionicons name="eye-outline" size={22} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      </Card>

      <AppButton
        label={busyAction === 'generate' ? 'Generating PDF…' : isGenerated ? 'Regenerate PDF' : 'Generate PDF'}
        variant="secondary"
        loading={busyAction === 'generate'}
        disabled={busyAction !== null && busyAction !== 'generate'}
        onPress={handleGenerate}
        style={styles.generateButton}
      />

      <Text style={styles.sectionLabel}>Share via</Text>
      <View style={styles.targetsRow}>
        <ShareTarget
          icon="logo-whatsapp"
          label="WhatsApp"
          color="#25D366"
          loading={busyAction === 'whatsapp'}
          disabled={busyAction !== null && busyAction !== 'whatsapp'}
          onPress={handleWhatsApp}
        />
        <ShareTarget
          icon="mail-outline"
          label="Email"
          color={theme.colors.primary}
          loading={busyAction === 'email'}
          disabled={busyAction !== null && busyAction !== 'email'}
          onPress={handleEmail}
        />
        <ShareTarget
          icon="ellipsis-horizontal-circle-outline"
          label="More"
          color={theme.colors.textSecondary}
          loading={busyAction === 'more'}
          disabled={busyAction !== null && busyAction !== 'more'}
          onPress={handleMore}
        />
      </View>

      <TouchableOpacity style={styles.linkRow} onPress={handleCopyLink} accessibilityRole="button" disabled={busyAction !== null}>
        {busyAction === 'copy' ? (
          <ActivityIndicator size="small" color={theme.colors.textSecondary} />
        ) : (
          <Ionicons name={copied ? 'checkmark-circle' : 'link-outline'} size={18} color={copied ? theme.colors.success : theme.colors.textSecondary} />
        )}
        <Text style={styles.linkText} numberOfLines={1}>
          {copied ? 'Link copied to clipboard' : shareLink.url}
        </Text>
        {!copied ? <Text style={styles.copyLabel}>Copy</Text> : null}
      </TouchableOpacity>
      <Text style={styles.linkHint}>
        WhatsApp/Email send this reference instantly; use Share PDF (More) to attach the full document.
      </Text>
    </ScreenContainer>
  );
}

interface ShareTargetProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  loading?: boolean;
  disabled?: boolean;
  onPress: () => void;
}

function ShareTarget({ icon, label, color, loading, disabled, onPress }: ShareTargetProps) {
  return (
    <TouchableOpacity style={styles.target} onPress={onPress} accessibilityRole="button" disabled={disabled}>
      <View style={[styles.targetIcon, { backgroundColor: `${color}1A` }, disabled && !loading && styles.targetIconDisabled]}>
        {loading ? <ActivityIndicator size="small" color={color} /> : <Ionicons name={icon} size={24} color={color} />}
      </View>
      <Text style={styles.targetLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm },
  templateRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  previewIcon: {
    width: 52, height: 52, borderRadius: theme.radius.md, backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInfo: { flex: 1 },
  previewTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  previewMeta: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  previewButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  generateButton: { marginBottom: theme.spacing.lg },
  targetsRow: { flexDirection: 'row', gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  target: { alignItems: 'center', gap: 6 },
  targetIcon: { width: 56, height: 56, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  targetIconDisabled: { opacity: 0.4 },
  targetLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm + 4,
  },
  linkText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1 },
  copyLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
  linkHint: { ...theme.typography.caption, color: theme.colors.textTertiary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg },
});
