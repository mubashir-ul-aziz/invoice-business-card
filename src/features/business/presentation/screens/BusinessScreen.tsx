import React, { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness, mockSocialLinks } from '../../data/datasources/mock/mockBusiness';
import { SocialPlatform } from '../../domain/entities/Business';
import { mockAppSettings, PAYMENT_TERMS_OPTIONS } from '../../../settings/data/datasources/mock/mockSettings';
import { formatDateTime } from '../../../../core/utils/dateFormatter';
import { RootStackParamList } from '../../../../app/navigation/types';
import { SettingsRow } from '../components/SettingsRow';

const CURRENCY_SYMBOL: Record<string, string> = { USD: '$', GBP: '£', EUR: '€' };

const SOCIAL_ICON: Record<SocialPlatform, keyof typeof Ionicons.glyphMap> = {
  whatsapp: 'logo-whatsapp',
  facebook: 'logo-facebook',
  instagram: 'logo-instagram',
  google_maps: 'location-outline',
  website: 'globe-outline',
  other: 'link-outline',
};

const SOCIAL_LABEL: Record<SocialPlatform, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  instagram: 'Instagram',
  google_maps: 'Google Maps',
  website: 'Website',
  other: 'Link',
};

// The Business screen surfaces these four platforms directly (Phase 4 scope);
// "website" is already shown on the profile/card, so it isn't repeated here.
const SOCIAL_ORDER: SocialPlatform[] = ['whatsapp', 'facebook', 'instagram', 'google_maps'];

interface MoreLink {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: keyof RootStackParamList;
}

const MORE_LINKS: MoreLink[] = [
  { icon: 'pricetags-outline', label: 'Invoice Types', route: 'InvoiceTypeSelection' },
  { icon: 'cube-outline', label: 'Items Catalog', route: 'ItemList' },
  { icon: 'options-outline', label: 'All Settings', route: 'Settings' },
];

/** Screen 4 — Business/Company hub: the central configuration area for the business (tab root). */
export function BusinessScreen() {
  const navigation = useAppNavigation();
  const [cloudSyncEnabled, setCloudSyncEnabled] = useState(mockAppSettings.cloudBackupEnabled);
  const [backingUp, setBackingUp] = useState(false);

  const paymentTermsLabel =
    PAYMENT_TERMS_OPTIONS.find((o) => o.days === mockAppSettings.defaultPaymentTermsDays)?.label ??
    `Net ${mockAppSettings.defaultPaymentTermsDays}`;
  const currencySymbol = CURRENCY_SYMBOL[mockBusiness.currencyCode] ?? '';
  const socialLinks = mockSocialLinks.filter((link) => SOCIAL_ORDER.includes(link.platform));

  function goToEditProfile() {
    navigation.navigate('CreateBusiness', { mode: 'edit' });
  }

  function openSocialLink(url: string) {
    Linking.openURL(url).catch(() => {
      // Best-effort only — opening an external app/link is never on the offline-required path.
    });
  }

  function handleBackupNow() {
    setBackingUp(true);
    setTimeout(() => setBackingUp(false), 1200);
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Business</Text>

        {/* Header: business identity */}
        <View style={styles.headerRow}>
          <View style={styles.headerInfo}>
            <View style={[styles.logoCircle, { backgroundColor: mockBusiness.logoColor }]}>
              <Text style={styles.logoInitial}>{mockBusiness.logoInitial}</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.businessName} numberOfLines={1}>{mockBusiness.name}</Text>
              <Text style={styles.businessMeta} numberOfLines={1}>{mockBusiness.email}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={goToEditProfile}
            accessibilityRole="button"
            accessibilityLabel="Edit business profile"
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Digital Business Card preview */}
        <View style={styles.cardPreviewWrap}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DigitalBusinessCard')}
            style={styles.cardPreviewBanner}
          >
            <View style={styles.cardPreviewTop}>
              <View>
                <Text style={styles.cardPreviewName}>{mockBusiness.name}</Text>
                <Text style={styles.cardPreviewTag}>DIGITAL BUSINESS CARD</Text>
              </View>
              <View style={styles.cardPreviewQrBadge}>
                <Ionicons name="qr-code-outline" size={22} color={theme.colors.textOnPrimary} />
              </View>
            </View>
            <View style={styles.cardPreviewContact}>
              {mockBusiness.phone ? (
                <View style={styles.cardPreviewContactRow}>
                  <Ionicons name="call-outline" size={14} color={theme.colors.primaryLight} />
                  <Text style={styles.cardPreviewContactText}>{mockBusiness.phone}</Text>
                </View>
              ) : null}
              {mockBusiness.website ? (
                <View style={styles.cardPreviewContactRow}>
                  <Ionicons name="globe-outline" size={14} color={theme.colors.primaryLight} />
                  <Text style={styles.cardPreviewContactText}>{mockBusiness.website}</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
          <View style={styles.cardPreviewActions}>
            <AppButton
              label="Share Card"
              onPress={() => navigation.navigate('DigitalBusinessCard')}
              style={styles.shareButton}
            />
            <TouchableOpacity
              style={styles.qrIconButton}
              onPress={() => navigation.navigate('QRCode')}
              accessibilityRole="button"
              accessibilityLabel="View QR code"
            >
              <Ionicons name="download-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Business Profile */}
        <Text style={styles.sectionLabel}>Business Profile</Text>
        <Card style={styles.sectionCard} padded={false}>
          <SettingsRow icon="location-outline" label="Address" value={mockBusiness.address} onPress={goToEditProfile} />
          <Divider />
          <SettingsRow icon="mail-outline" label="Email" value={mockBusiness.email} onPress={goToEditProfile} />
          <Divider />
          <SettingsRow icon="business-outline" label="Tax / VAT Number" value={mockBusiness.taxNumber} onPress={goToEditProfile} />
        </Card>

        {/* Social Links */}
        <Text style={styles.sectionLabel}>Social Links</Text>
        <Card style={styles.sectionCard} padded={false}>
          {socialLinks.map((link, index) => (
            <React.Fragment key={link.id}>
              <SettingsRow
                icon={SOCIAL_ICON[link.platform]}
                label={SOCIAL_LABEL[link.platform]}
                value={link.url}
                onPress={() => openSocialLink(link.url)}
                showChevron={false}
              />
              {index < socialLinks.length - 1 ? <Divider /> : null}
            </React.Fragment>
          ))}
        </Card>

        {/* Invoice Settings */}
        <Text style={styles.sectionLabel}>Invoice Settings</Text>
        <Card style={styles.sectionCard} padded={false}>
          <SettingsRow
            icon="receipt-outline"
            label="Invoice Numbering"
            value={`Next: ${mockBusiness.invoicePrefix}${mockBusiness.nextInvoiceNumber}`}
            onPress={goToEditProfile}
          />
          <Divider />
          <SettingsRow
            icon="calendar-outline"
            label="Default Payment Terms"
            value={paymentTermsLabel}
            onPress={() => navigation.navigate('Settings')}
          />
          <Divider />
          <SettingsRow
            icon="cash-outline"
            label="Default Currency"
            value={currencySymbol ? `${mockBusiness.currencyCode} (${currencySymbol})` : mockBusiness.currencyCode}
            onPress={goToEditProfile}
          />
          <Divider />
          <SettingsRow
            icon="pricetag-outline"
            label="Default Tax Rate"
            value={mockAppSettings.defaultTaxRate != null ? `${mockAppSettings.defaultTaxRate}%` : 'Not set'}
            onPress={() => navigation.navigate('Settings')}
          />
        </Card>

        {/* Data & Backup */}
        <Text style={styles.sectionLabel}>Data & Backup</Text>
        <Card style={styles.sectionCard}>
          <View style={styles.syncRow}>
            <View style={styles.syncInfo}>
              <View style={styles.syncIconCircle}>
                <Ionicons name="sync-outline" size={18} color={theme.colors.success} />
              </View>
              <View style={styles.textCol}>
                <Text style={styles.syncLabel}>Google Drive Sync</Text>
                <Text style={styles.syncMeta}>
                  {mockAppSettings.lastBackupAt ? `Last backup: ${formatDateTime(new Date(mockAppSettings.lastBackupAt))}` : 'Never backed up'}
                </Text>
              </View>
            </View>
            <Switch
              value={cloudSyncEnabled}
              onValueChange={setCloudSyncEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
              thumbColor={cloudSyncEnabled ? theme.colors.primary : undefined}
            />
          </View>
          <AppButton
            label={backingUp ? 'Backing up…' : 'Backup Now'}
            variant="secondary"
            loading={backingUp}
            onPress={handleBackupNow}
            style={styles.backupButton}
          />
          <TouchableOpacity
            style={styles.historyRow}
            onPress={() => navigation.navigate('BackupRestore')}
            accessibilityRole="button"
          >
            <Text style={styles.historyLabel}>Backup history & restore</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* More */}
        <Text style={styles.sectionLabel}>More</Text>
        <Card style={styles.sectionCard} padded={false}>
          {MORE_LINKS.map((link, index) => (
            <React.Fragment key={link.route}>
              <SettingsRow icon={link.icon} label={link.label} onPress={() => navigation.navigate(link.route as never)} />
              {index < MORE_LINKS.length - 1 ? <Divider /> : null}
            </React.Fragment>
          ))}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xl },
  screenTitle: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginTop: theme.spacing.sm, marginBottom: theme.spacing.md },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, flex: 1, minWidth: 0 },
  logoCircle: { width: 56, height: 56, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { ...theme.typography.headlineMd, color: theme.colors.textOnPrimary },
  headerText: { flex: 1, minWidth: 0 },
  businessName: { ...theme.typography.headlineMd, color: theme.colors.textPrimary },
  businessMeta: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  editButton: {
    width: 40, height: 40, borderRadius: theme.radius.full, backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border,
  },

  cardPreviewWrap: { marginBottom: theme.spacing.lg },
  cardPreviewBanner: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardPreviewTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardPreviewName: { ...theme.typography.headlineMd, color: theme.colors.textOnPrimary },
  cardPreviewTag: { ...theme.typography.labelSm, color: theme.colors.primaryLight, marginTop: 2 },
  cardPreviewQrBadge: {
    width: 40, height: 40, borderRadius: theme.radius.md, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center',
  },
  cardPreviewContact: { gap: theme.spacing.xs },
  cardPreviewContactRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  cardPreviewContactText: { ...theme.typography.bodyMd, color: theme.colors.primaryLight },
  cardPreviewActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  shareButton: { flex: 1 },
  qrIconButton: {
    width: 48, height: 48, borderRadius: theme.radius.md, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center',
  },

  sectionLabel: {
    ...theme.typography.labelSm, color: theme.colors.textSecondary, textTransform: 'uppercase',
    marginBottom: theme.spacing.sm, marginTop: theme.spacing.xs,
  },
  sectionCard: { marginBottom: theme.spacing.lg },
  divider: { height: 1, backgroundColor: theme.colors.border, marginLeft: theme.spacing.md + 36 + 10 },

  textCol: { flex: 1, minWidth: 0 },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  syncInfo: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm + 4, flex: 1, minWidth: 0 },
  syncIconCircle: { width: 36, height: 36, borderRadius: theme.radius.full, backgroundColor: theme.colors.successBg, alignItems: 'center', justifyContent: 'center' },
  syncLabel: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  syncMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 1 },
  backupButton: {},
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: theme.spacing.md, marginTop: theme.spacing.sm, borderTopWidth: 1, borderTopColor: theme.colors.border },
  historyLabel: { ...theme.typography.bodyMd, color: theme.colors.primary, fontWeight: '600' },
});
