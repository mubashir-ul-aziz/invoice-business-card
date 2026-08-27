import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';

/** Screen 1 — first-run entry point (Section 16). */
export function WelcomeScreen() {
  const navigation = useAppNavigation();

  return (
    <ScreenContainer>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Ionicons name="receipt" size={40} color={theme.colors.textOnPrimary} />
        </View>
        <Text style={styles.appName}>Invora</Text>
        <Text style={styles.tagline}>Invoicing and your digital business card — fast, offline, and professional.</Text>

        <View style={styles.features}>
          <FeatureRow icon="flash-outline" label="Create and share invoices in seconds" />
          <FeatureRow icon="cloud-offline-outline" label="Works fully offline, backs up to your Drive" />
          <FeatureRow icon="qr-code-outline" label="Shareable digital business card with QR code" />
        </View>
      </View>

      <AppButton label="Get Started" onPress={() => navigation.navigate('CreateBusiness', { mode: 'create' })} />
    </ScreenContainer>
  );
}

function FeatureRow({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.primary} />
      </View>
      <Text style={styles.featureLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  appName: { ...theme.typography.displayFinancial, color: theme.colors.textPrimary },
  tagline: {
    ...theme.typography.bodyLg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    maxWidth: 320,
  },
  features: { marginTop: theme.spacing.xl, alignSelf: 'stretch', gap: theme.spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1 },
});
