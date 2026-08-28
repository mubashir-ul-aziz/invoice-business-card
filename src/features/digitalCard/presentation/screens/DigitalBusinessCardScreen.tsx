import React, { useMemo } from 'react';
import { Linking, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness, mockSocialLinks } from '../../../business/data/datasources/mock/mockBusiness';
import { SocialPlatform } from '../../../business/domain/entities/Business';
import { buildBusinessCardPayload } from '../../domain/usecases/buildBusinessCardPayload';

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

// Brand colors for recognizability (Kinetic Ledger keeps everything else on
// theme tokens; these are the one deliberate exception, same as elsewhere in
// the app — e.g. the WhatsApp green used on the Business screen).
const SOCIAL_COLOR: Record<SocialPlatform, string> = {
  whatsapp: '#25D366',
  facebook: '#1877F2',
  instagram: '#E1306C',
  google_maps: theme.colors.danger,
  website: theme.colors.textSecondary,
  other: theme.colors.textSecondary,
};

interface ContactItem {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  onPress: () => void;
}

/** Screen 20 — shareable digital business card presentation of Business + SocialLinks (Section 16, 29). */
export function DigitalBusinessCardScreen() {
  const navigation = useAppNavigation();
  const payload = useMemo(() => buildBusinessCardPayload(mockBusiness, mockSocialLinks), []);
  // Logo initial/color are presentational only (not part of the portable
  // card payload shared with QR encoding), so they're read from Business directly.
  const { logoInitial, logoColor } = mockBusiness;

  function openExternal(url: string) {
    Linking.openURL(url).catch(() => {
      // Best-effort only — opening an external app/link is never on the offline-required path.
    });
  }

  function shareCard() {
    const lines = [
      payload.name,
      payload.phone,
      payload.email,
      payload.website,
      payload.address,
    ].filter(Boolean);
    // Plain-text OS share sheet only — no hosted share link/backend yet (Phase 16).
    Share.share({ message: lines.join('\n') }).catch(() => {});
  }

  const phoneItem: ContactItem | null = payload.phone
    ? { key: 'phone', icon: 'call-outline', label: 'Phone', value: payload.phone, color: theme.colors.primary, onPress: () => openExternal(`tel:${payload.phone}`) }
    : null;
  const socialItems: ContactItem[] = payload.socialLinks.map((link) => ({
    key: link.platform,
    icon: SOCIAL_ICON[link.platform],
    label: SOCIAL_LABEL[link.platform],
    value: link.url,
    color: SOCIAL_COLOR[link.platform],
    onPress: () => openExternal(link.url),
  }));
  const contactItems: ContactItem[] = phoneItem ? [phoneItem, ...socialItems] : socialItems;

  return (
    <ScreenContainer>
      <ScreenHeader title="Digital Business Card" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card} padded={false}>
          <View style={styles.banner} />
          <View style={[styles.logoCircle, { backgroundColor: logoColor }]}>
            <Text style={styles.logoInitial}>{logoInitial}</Text>
          </View>

          <View style={styles.body}>
            <Text style={styles.businessName}>{payload.name}</Text>

            <View style={styles.divider} />

            <View style={styles.contactGrid}>
              {contactItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  style={styles.contactCell}
                  onPress={item.onPress}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.contactIconCircle, { backgroundColor: `${item.color}1A` }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.contactLabel} numberOfLines={1}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {payload.address ? (
              <>
                <View style={styles.divider} />
                <View style={styles.addressRow}>
                  <View style={[styles.contactIconCircle, { backgroundColor: `${theme.colors.danger}1A` }]}>
                    <Ionicons name="location-outline" size={18} color={theme.colors.danger} />
                  </View>
                  <Text style={styles.addressText} numberOfLines={2}>{payload.address}</Text>
                </View>
              </>
            ) : null}
          </View>
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryAction} onPress={shareCard} accessibilityRole="button">
            <Ionicons name="share-social-outline" size={18} color={theme.colors.textOnPrimary} />
            <Text style={styles.primaryActionLabel}>Share Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('QRCode')}
            accessibilityRole="button"
          >
            <Ionicons name="qr-code-outline" size={18} color={theme.colors.textPrimary} />
            <Text style={styles.secondaryActionLabel}>Show QR Code</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xl },

  card: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.lg, overflow: 'hidden' },
  banner: { height: 64, backgroundColor: theme.colors.surfaceAlt },
  logoCircle: {
    position: 'absolute', top: 24, left: theme.spacing.md,
    width: 72, height: 72, borderRadius: theme.radius.full,
    borderWidth: 4, borderColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  logoInitial: { ...theme.typography.headlineMd, color: theme.colors.textOnPrimary },
  body: { paddingTop: 44, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md },
  businessName: { ...theme.typography.headlineLg, color: theme.colors.textPrimary },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: theme.spacing.md },

  contactGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  contactCell: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, width: '50%', paddingVertical: theme.spacing.xs },
  contactIconCircle: { width: 36, height: 36, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flexShrink: 1 },

  addressRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  addressText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1 },

  actions: { gap: theme.spacing.sm },
  primaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    minHeight: theme.touchTarget, borderRadius: theme.radius.full, backgroundColor: theme.colors.primary,
  },
  primaryActionLabel: { ...theme.typography.button, color: theme.colors.textOnPrimary },
  secondaryAction: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    minHeight: theme.touchTarget, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  secondaryActionLabel: { ...theme.typography.button, color: theme.colors.textPrimary },
});
