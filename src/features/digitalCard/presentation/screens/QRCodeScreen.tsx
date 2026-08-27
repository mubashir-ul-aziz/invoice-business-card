import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { AppButton } from '../../../../core/components/AppButton';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness } from '../../../business/data/datasources/mock/mockBusiness';
import { MockQRCode } from '../components/MockQRCode';

/** Screen 21 — full-screen QR for the business card/share link (Section 16, 30). */
export function QRCodeScreen() {
  const navigation = useAppNavigation();

  return (
    <ScreenContainer>
      <ScreenHeader title="QR Code" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <View style={[styles.logoCircle, { backgroundColor: mockBusiness.logoColor }]}>
          <Text style={styles.logoInitial}>{mockBusiness.logoInitial}</Text>
        </View>
        <Text style={styles.businessName}>{mockBusiness.name}</Text>
        <Text style={styles.hint}>Scan to view digital business card</Text>

        <View style={styles.qrFrame}>
          <MockQRCode seed={mockBusiness.id} size={240} />
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton label="Save to Gallery" variant="secondary" onPress={() => {}} style={styles.actionButton} />
        <AppButton label="Share QR" onPress={() => {}} style={styles.actionButton} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoCircle: { width: 56, height: 56, borderRadius: theme.radius.full, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { ...theme.typography.bodyStrong, color: theme.colors.textOnPrimary },
  businessName: { ...theme.typography.headlineMd, color: theme.colors.textPrimary, marginTop: theme.spacing.sm },
  hint: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 4, marginBottom: theme.spacing.lg },
  qrFrame: {
    padding: theme.spacing.lg, backgroundColor: theme.colors.surface, borderRadius: theme.radius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  actionButton: { flex: 1 },
});
