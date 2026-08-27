import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation, useAppRoute } from '../../../../app/navigation/hooks';
import { mockInvoices } from '../../data/datasources/mock/mockInvoices';
import { formatCurrency } from '../../../../core/utils/currencyFormatter';

const SHARE_TARGETS: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = [
  { icon: 'logo-whatsapp', label: 'WhatsApp', color: '#25D366' },
  { icon: 'mail-outline', label: 'Email', color: theme.colors.primary },
  { icon: 'ellipsis-horizontal-circle-outline', label: 'More', color: theme.colors.textSecondary },
];

/** Screen 19 — export/share an invoice (Section 16). PDF generation is out of scope for Stage 1. */
export function InvoiceSharingScreen() {
  const navigation = useAppNavigation();
  const { invoiceId } = useAppRoute<'InvoiceSharing'>().params;
  const invoice = mockInvoices.find((i) => i.id === invoiceId);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleGeneratePdf() {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 900);
  }

  function handleCopyLink() {
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Share Invoice" subtitle={invoice?.invoiceNumber} onBack={() => navigation.goBack()} />

      <Card style={styles.previewCard}>
        <View style={styles.previewIcon}>
          <Ionicons name="document-text" size={28} color={theme.colors.primary} />
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>{invoice?.invoiceNumber}.pdf</Text>
          <Text style={styles.previewMeta}>{invoice ? formatCurrency(invoice.total, 'USD') : ''}</Text>
        </View>
      </Card>

      <AppButton
        label={generating ? 'Generating PDF…' : 'Generate PDF'}
        variant="secondary"
        loading={generating}
        onPress={handleGeneratePdf}
        style={styles.generateButton}
      />

      <Text style={styles.sectionLabel}>Share via</Text>
      <View style={styles.targetsRow}>
        {SHARE_TARGETS.map((target) => (
          <TouchableOpacity key={target.label} style={styles.target} accessibilityRole="button">
            <View style={[styles.targetIcon, { backgroundColor: `${target.color}1A` }]}>
              <Ionicons name={target.icon} size={24} color={target.color} />
            </View>
            <Text style={styles.targetLabel}>{target.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.linkRow} onPress={handleCopyLink} accessibilityRole="button">
        <Ionicons name={copied ? 'checkmark-circle' : 'link-outline'} size={18} color={copied ? theme.colors.success : theme.colors.textSecondary} />
        <Text style={styles.linkText} numberOfLines={1}>
          {copied ? 'Link copied to clipboard' : `invora.app/i/${invoice?.id ?? ''}`}
        </Text>
        {!copied ? <Text style={styles.copyLabel}>Copy</Text> : null}
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md },
  previewIcon: {
    width: 52, height: 52, borderRadius: theme.radius.md, backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  previewInfo: { flex: 1 },
  previewTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  previewMeta: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  generateButton: { marginBottom: theme.spacing.lg },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  targetsRow: { flexDirection: 'row', gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  target: { alignItems: 'center', gap: 6 },
  targetIcon: { width: 56, height: 56, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt, borderRadius: theme.radius.md, padding: theme.spacing.sm + 4,
  },
  linkText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1 },
  copyLabel: { ...theme.typography.bodyStrong, color: theme.colors.primary },
});
