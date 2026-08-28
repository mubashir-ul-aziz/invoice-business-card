import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { Chip } from '../../../../core/components/Chip';
import { AppTextField } from '../../../../core/components/AppTextField';
import { AppButton } from '../../../../core/components/AppButton';
import { ConfirmationDialog } from '../../../../core/components/ConfirmationDialog';
import { SettingsRow } from '../../../business/presentation/components/SettingsRow';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { useSettingsStore } from '../state/settingsStore';
import { CURRENCY_OPTIONS, PAYMENT_TERMS_OPTIONS, mockInvoiceTemplates } from '../../data/datasources/mock/mockSettings';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { mockInvoiceTypes } from '../../../invoiceType/data/datasources/mock/mockInvoiceTypes';

type PickerKind = 'currency' | 'paymentTerms' | 'tax' | null;

/** Screen 23 — app-level configuration, grouped into Business / Invoice / Backup / Security / Account (Section 16). */
export function SettingsScreen() {
  const navigation = useAppNavigation();
  const settings = useSettingsStore();
  const [activePicker, setActivePicker] = useState<PickerKind>(null);
  const [taxDraft, setTaxDraft] = useState(String(settings.defaultTaxRate ?? ''));
  const [confirmLogoutVisible, setConfirmLogoutVisible] = useState(false);

  const selectedTemplate = mockInvoiceTemplates.find((t) => t.id === settings.invoiceTemplateId);
  const selectedInvoiceType = mockInvoiceTypes.find((t) => t.id === mockBusiness.defaultInvoiceTypeId);
  const paymentTermsLabel =
    PAYMENT_TERMS_OPTIONS.find((o) => o.days === settings.defaultPaymentTermsDays)?.label ?? `Net ${settings.defaultPaymentTermsDays}`;

  function openTaxPicker() {
    setTaxDraft(String(settings.defaultTaxRate ?? ''));
    setActivePicker('tax');
  }

  function saveTax() {
    const parsed = Number(taxDraft.trim());
    settings.update({ defaultTaxRate: taxDraft.trim().length > 0 && Number.isFinite(parsed) ? parsed : undefined });
    setActivePicker(null);
  }

  function comingSoon(title: string, message: string) {
    Alert.alert(title, message);
  }

  function handleLogout() {
    setConfirmLogoutVisible(false);
    comingSoon('Logged out', "Account sign-in isn't set up yet — this is a placeholder for a future update.");
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Settings" onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionCard title="Business">
          <SettingsRow
            icon="storefront-outline"
            label="Business Profile"
            onPress={() => navigation.navigate('CreateBusiness', { mode: 'edit' })}
          />
          <Divider />
          <SettingsRow icon="card-outline" label="Digital Business Card" onPress={() => navigation.navigate('DigitalBusinessCard')} />
        </SectionCard>

        <SectionCard title="Invoice">
          <SettingsRow
            icon="document-text-outline"
            label="Invoice Type"
            value={selectedInvoiceType?.name}
            onPress={() => navigation.navigate('InvoiceTypeSelection')}
          />
          <Divider />
          <SettingsRow
            icon="list-outline"
            label="Invoice Numbering"
            value={`${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`}
            onPress={() => navigation.navigate('CreateBusiness', { mode: 'edit' })}
          />
          <Divider />
          <SettingsRow icon="cash-outline" label="Currency" value={settings.defaultCurrency} onPress={() => setActivePicker('currency')} />
          <Divider />
          <SettingsRow
            icon="receipt-outline"
            label="Tax"
            value={settings.defaultTaxRate != null ? `${settings.defaultTaxRate}%` : 'Not set'}
            onPress={openTaxPicker}
          />
          <Divider />
          <SettingsRow icon="calendar-outline" label="Payment Terms" value={paymentTermsLabel} onPress={() => setActivePicker('paymentTerms')} />
          <Divider />
          <SettingsRow
            icon="color-palette-outline"
            label="Invoice Template"
            value={selectedTemplate?.name}
            onPress={() => navigation.navigate('InvoiceTemplateSelection')}
          />
        </SectionCard>

        <SectionCard title="Backup">
          <SettingsRow
            icon="sync-outline"
            iconColor={theme.colors.success}
            label="Backup & Restore"
            onPress={() => navigation.navigate('BackupRestore')}
          />
          <Divider />
          <SettingsRow
            icon="cloud-upload-outline"
            iconColor={theme.colors.success}
            label="Google Drive Backup"
            value={settings.cloudBackupEnabled ? 'Enabled' : 'Off'}
            onPress={() => navigation.navigate('BackupRestore')}
          />
          <Divider />
          <SettingsRow
            icon="cloud-outline"
            iconColor={theme.colors.success}
            label="Cloud Backup"
            onPress={() => comingSoon('Cloud Backup', 'Optional cloud backup is coming in a future update.')}
          />
        </SectionCard>

        <SectionCard title="Security">
          <ToggleRow
            icon="lock-closed-outline"
            label="App Lock"
            value={settings.appLockEnabled}
            onValueChange={(next) => settings.update({ appLockEnabled: next })}
          />
          <Divider />
          <ToggleRow
            icon="finger-print-outline"
            label="Biometric Unlock"
            description="Use fingerprint or face to unlock"
            value={settings.biometricUnlockEnabled}
            onValueChange={(next) => settings.update({ biometricUnlockEnabled: next })}
          />
        </SectionCard>

        <SectionCard title="Account">
          <SettingsRow
            icon="person-outline"
            label="Account"
            onPress={() => comingSoon('Account', 'Account management is coming in a future update.')}
          />
          <Divider />
          <SettingsRow
            icon="diamond-outline"
            label="Subscription"
            value="Free"
            onPress={() => comingSoon('Subscription', 'Subscription plans are coming in a future update.')}
          />
          <Divider />
          <TouchableOpacity style={styles.logoutRow} onPress={() => setConfirmLogoutVisible(true)} accessibilityRole="button">
            <View style={styles.logoutIconCircle}>
              <Ionicons name="log-out-outline" size={18} color={theme.colors.danger} />
            </View>
            <Text style={styles.logoutLabel}>Logout</Text>
          </TouchableOpacity>
        </SectionCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Invora v1.0.0 (MVP)</Text>
        </View>
      </ScrollView>

      <PickerSheet visible={activePicker === 'currency'} title="Default currency" onClose={() => setActivePicker(null)}>
        <View style={styles.chipRow}>
          {CURRENCY_OPTIONS.map((option) => (
            <Chip
              key={option.code}
              label={option.label}
              selected={settings.defaultCurrency === option.code}
              onPress={() => {
                settings.update({ defaultCurrency: option.code });
                setActivePicker(null);
              }}
            />
          ))}
        </View>
      </PickerSheet>

      <PickerSheet visible={activePicker === 'paymentTerms'} title="Default payment terms" onClose={() => setActivePicker(null)}>
        <View style={styles.chipRow}>
          {PAYMENT_TERMS_OPTIONS.map((option) => (
            <Chip
              key={option.days}
              label={option.label}
              selected={settings.defaultPaymentTermsDays === option.days}
              onPress={() => {
                settings.update({ defaultPaymentTermsDays: option.days });
                setActivePicker(null);
              }}
            />
          ))}
        </View>
      </PickerSheet>

      <PickerSheet visible={activePicker === 'tax'} title="Default tax rate" onClose={() => setActivePicker(null)}>
        <AppTextField
          label="Tax rate (%)"
          keyboardType="decimal-pad"
          value={taxDraft}
          onChangeText={setTaxDraft}
          errorText={settings.fieldErrors.defaultTaxRate}
        />
        <AppButton label="Save" onPress={saveTax} />
      </PickerSheet>

      <ConfirmationDialog
        visible={confirmLogoutVisible}
        title="Log out?"
        message="Account sign-in isn't set up yet — this is a placeholder for a future update."
        confirmLabel="Logout"
        destructive
        onCancel={() => setConfirmLogoutVisible(false)}
        onConfirm={handleLogout}
      />
    </ScreenContainer>
  );
}

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

/** One rounded, outlined group of rows with an uppercase section label — the recurring Stitch "Settings" list pattern. */
function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{title}</Text>
      <Card style={styles.sectionCard} padded={false}>
        {children}
      </Card>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

interface ToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}

/** A settings row ending in a switch instead of a chevron (App Lock, Biometric Unlock). */
function ToggleRow({ icon, label, description, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIconCircle}>
        <Ionicons name={icon} size={18} color={theme.colors.textSecondary} />
      </View>
      <View style={styles.toggleTextCol}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description ? <Text style={styles.toggleDescription}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
        thumbColor={value ? theme.colors.primary : undefined}
      />
    </View>
  );
}

interface PickerSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

/** Bottom-sheet-style modal used for the inline Currency / Payment Terms / Tax pickers (no dedicated sub-screens for these in the nav stack). */
function PickerSheet({ visible, title, onClose, children }: PickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={styles.sheetBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheetCard}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
              <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xxl },

  section: { marginTop: theme.spacing.md },
  sectionLabel: {
    ...theme.typography.labelSm,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: theme.spacing.sm,
    marginLeft: theme.spacing.xs,
  },
  sectionCard: { overflow: 'hidden' },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: theme.spacing.md + 36 + 10 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
  },
  toggleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextCol: { flex: 1, minWidth: 0 },
  toggleLabel: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  toggleDescription: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 1 },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm + 4,
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.md,
  },
  logoutIconCircle: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: { ...theme.typography.bodyMd, color: theme.colors.danger, fontWeight: '600' },

  footer: { alignItems: 'center', paddingVertical: theme.spacing.lg },
  footerText: { ...theme.typography.labelSm, color: theme.colors.textTertiary },

  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap', marginBottom: theme.spacing.sm },

  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: { ...StyleSheet.absoluteFill, backgroundColor: theme.colors.overlay },
  sheetCard: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  sheetTitle: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
});
