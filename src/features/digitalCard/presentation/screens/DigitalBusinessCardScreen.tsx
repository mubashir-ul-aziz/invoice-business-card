import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness, mockSocialLinks } from '../../../business/data/datasources/mock/mockBusiness';
import { SocialPlatform } from '../../../business/domain/entities/Business';

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
  google_maps: 'Directions',
  website: 'Website',
  other: 'Link',
};

/** Screen 20 — shareable digital business card presentation of Business + SocialLinks (Section 16, 29). */
export function DigitalBusinessCardScreen() {
  const navigation = useAppNavigation();

  return (
    <ScreenContainer>
      <ScreenHeader title="Digital Business Card" onBack={() => navigation.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.cardWrap}>
          <View style={[styles.banner, { backgroundColor: mockBusiness.logoColor }]} />
          <Card style={styles.card} padded={false}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>{mockBusiness.logoInitial}</Text>
            </View>
            <Text style={styles.businessName}>{mockBusiness.name}</Text>
            <Text style={styles.tagline}>Professional Consulting Services</Text>

            <View style={styles.contactList}>
              <ContactRow icon="call-outline" text={mockBusiness.phone} />
              <ContactRow icon="mail-outline" text={mockBusiness.email} />
              <ContactRow icon="globe-outline" text={mockBusiness.website} />
              <ContactRow icon="location-outline" text={mockBusiness.address} />
            </View>

            <View style={styles.socialRow}>
              {mockSocialLinks.map((link) => (
                <TouchableOpacity key={link.id} style={styles.socialButton} accessibilityRole="button" accessibilityLabel={SOCIAL_LABEL[link.platform]}>
                  <Ionicons name={SOCIAL_ICON[link.platform]} size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        <Text style={styles.sectionLabel}>Share via</Text>
        <View style={styles.shareRow}>
          <ShareTarget icon="logo-whatsapp" label="WhatsApp" color="#25D366" />
          <ShareTarget icon="mail-outline" label="Email" color={theme.colors.primary} />
          <ShareTarget icon="ellipsis-horizontal-circle-outline" label="More" color={theme.colors.textSecondary} />
        </View>

        <AppButton label="View QR Code" variant="secondary" onPress={() => navigation.navigate('QRCode')} style={styles.qrButton} />
      </ScrollView>
    </ScreenContainer>
  );
}

function ContactRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text?: string }) {
  if (!text) return null;
  return (
    <View style={styles.contactRow}>
      <Ionicons name={icon} size={16} color={theme.colors.textSecondary} />
      <Text style={styles.contactText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function ShareTarget({ icon, label, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }) {
  return (
    <TouchableOpacity style={styles.shareTarget} accessibilityRole="button">
      <View style={[styles.shareTargetIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.shareTargetLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: theme.spacing.xl },
  cardWrap: { marginBottom: theme.spacing.lg },
  banner: { height: 56, borderTopLeftRadius: theme.radius.lg, borderTopRightRadius: theme.radius.lg },
  card: { alignItems: 'center', paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md, borderTopWidth: 0 },
  logoCircle: {
    width: 72, height: 72, borderRadius: theme.radius.full, backgroundColor: theme.colors.surface,
    borderWidth: 3, borderColor: theme.colors.surface, alignItems: 'center', justifyContent: 'center',
    marginTop: -36, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },
  logoInitial: { ...theme.typography.headlineMd, color: theme.colors.primary },
  businessName: { ...theme.typography.headlineLg, color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
  tagline: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2 },
  contactList: { alignSelf: 'stretch', gap: theme.spacing.xs, marginTop: theme.spacing.md },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, justifyContent: 'center' },
  contactText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  socialRow: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  socialButton: {
    width: 44, height: 44, borderRadius: theme.radius.full, backgroundColor: theme.colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  shareRow: { flexDirection: 'row', gap: theme.spacing.lg, marginBottom: theme.spacing.lg },
  shareTarget: { alignItems: 'center', gap: 6 },
  shareTargetIcon: { width: 52, height: 52, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  shareTargetLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  qrButton: {},
});
