import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBusiness, mockSocialLinks } from '../../../business/data/datasources/mock/mockBusiness';
import { buildBusinessCardPayload } from '../../domain/usecases/buildBusinessCardPayload';
import { encodeBusinessCardVCard } from '../../domain/usecases/encodeBusinessCardVCard';

type QrAction = 'share' | 'save' | 'print';

const QR_SIZE = 224;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Screen 21 — full-screen QR for the business card, generated fully on-device (Section 16, 30). */
export function QRCodeScreen() {
  const navigation = useAppNavigation();
  const qrRef = useRef<{ toDataURL: (callback: (data: string) => void) => void } | null>(null);
  const [pendingAction, setPendingAction] = useState<QrAction | null>(null);

  const payload = useMemo(() => buildBusinessCardPayload(mockBusiness, mockSocialLinks), []);
  const qrValue = useMemo(() => encodeBusinessCardVCard(payload), [payload]);

  /** Reads the rendered QR SVG as a base64 PNG — on-device only, no network round trip. */
  function captureQrPngBase64(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!qrRef.current) {
        reject(new Error('QR code is not ready yet.'));
        return;
      }
      qrRef.current.toDataURL((base64: string) => resolve(base64));
    });
  }

  /** Writes the captured QR PNG to a fresh cache file so it can be shared/saved/printed via file URI. */
  async function writeQrPngFile(): Promise<InstanceType<typeof File>> {
    const base64 = await captureQrPngBase64();
    const file = new File(Paths.cache, `invora-qr-${Date.now()}.png`);
    file.create();
    file.write(base64, { encoding: 'base64' });
    return file;
  }

  async function runAction(action: QrAction, task: () => Promise<void>) {
    if (pendingAction) return;
    setPendingAction(action);
    try {
      await task();
    } catch {
      Alert.alert('Something went wrong', `Could not ${action} the QR code. Please try again.`);
    } finally {
      setPendingAction(null);
    }
  }

  const handleShare = () =>
    runAction('share', async () => {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not supported on this device.');
        return;
      }
      const file = await writeQrPngFile();
      await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: `${mockBusiness.name} QR Code` });
    });

  const handleSave = () =>
    runAction('save', async () => {
      // expo-media-library has no web-native gallery to save into — its
      // native module isn't registered there at all, so it's imported
      // dynamically and only on native platforms (also keeps it out of the
      // web bundle entirely, per the Section 4 "defer rarely-used modules"
      // performance principle).
      if (Platform.OS === 'web') {
        Alert.alert('Not available on web', 'Saving to Photos isn’t supported in the web preview. Use Share instead, or open the app on your phone.');
        return;
      }
      const MediaLibrary = await import('expo-media-library');
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow photo library access to save the QR code.');
        return;
      }
      const file = await writeQrPngFile();
      await MediaLibrary.Asset.create(file.uri);
      Alert.alert('Saved', 'QR code saved to your photos.');
    });

  const handlePrint = () =>
    runAction('print', async () => {
      const base64 = await captureQrPngBase64();
      await Print.printAsync({
        html: `<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:48px;font-family:-apple-system,Helvetica,Arial,sans-serif;">
          <h2 style="margin-bottom:24px;">${escapeHtml(mockBusiness.name)}</h2>
          <img src="data:image/png;base64,${base64}" width="280" height="280" />
          <p style="margin-top:24px;color:#5D6B82;">Scan to view digital business card</p>
        </body></html>`,
      });
    });

  return (
    <ScreenContainer>
      <ScreenHeader title="QR Code" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Card style={styles.qrCard}>
          <View style={styles.activeBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.activeLabel}>Active</Text>
          </View>

          <View style={styles.qrFrame}>
            <QRCode
              value={qrValue}
              size={QR_SIZE}
              color={theme.colors.textPrimary}
              backgroundColor={theme.colors.surface}
              ecl="M"
              getRef={(ref) => {
                qrRef.current = ref;
              }}
            />
          </View>

          <Text style={styles.businessName}>{mockBusiness.name}</Text>
          <Text style={styles.hint}>Scan to view digital business card</Text>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText}>
              Customers can scan this code to instantly access your digital business card and contact details.
            </Text>
          </View>
        </Card>
      </View>

      <View style={styles.actions}>
        <QrActionButton
          icon="share-outline"
          label="Share"
          loading={pendingAction === 'share'}
          disabled={pendingAction !== null}
          onPress={handleShare}
        />
        <QrActionButton
          icon="download-outline"
          label="Save"
          emphasized
          loading={pendingAction === 'save'}
          disabled={pendingAction !== null}
          onPress={handleSave}
        />
        <QrActionButton
          icon="print-outline"
          label="Print"
          loading={pendingAction === 'print'}
          disabled={pendingAction !== null}
          onPress={handlePrint}
        />
      </View>
    </ScreenContainer>
  );
}

interface QrActionButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  emphasized?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

function QrActionButton({ icon, label, onPress, emphasized = false, loading = false, disabled = false }: QrActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionButton, emphasized && styles.actionButtonEmphasized, disabled && styles.actionButtonDisabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={emphasized ? theme.colors.textOnPrimary : theme.colors.primary} />
      ) : (
        <Ionicons name={icon} size={20} color={emphasized ? theme.colors.textOnPrimary : theme.colors.primary} />
      )}
      <Text style={[styles.actionLabel, emphasized && styles.actionLabelEmphasized]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrCard: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    position: 'relative',
  },
  activeBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: theme.spacing.xs + 2,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
  },
  activeDot: { width: 6, height: 6, borderRadius: theme.radius.full, backgroundColor: theme.colors.success },
  activeLabel: { ...theme.typography.labelSm, color: theme.colors.textSecondary, fontSize: 10 },
  qrFrame: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSunken,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  businessName: { ...theme.typography.headlineMd, color: theme.colors.textPrimary, textAlign: 'center' },
  hint: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginTop: 2, marginBottom: theme.spacing.md, textAlign: 'center' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    alignSelf: 'stretch',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm + 4,
  },
  infoText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, flex: 1, fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  actionButton: {
    flex: 1,
    height: 60,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  actionButtonEmphasized: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  actionButtonDisabled: { opacity: 0.5 },
  actionLabel: { ...theme.typography.labelSm, color: theme.colors.primary, fontSize: 11 },
  actionLabelEmphasized: { color: theme.colors.textOnPrimary },
});
