import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { ConfirmationDialog } from '../../../../core/components/ConfirmationDialog';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { mockBackupLogs } from '../../data/datasources/mock/mockBackupLogs';
import { mockAppSettings } from '../../../settings/data/datasources/mock/mockSettings';
import { BackupFrequency } from '../../../settings/domain/entities/AppSettings';
import { formatDateTime } from '../../../../core/utils/dateFormatter';

const FREQUENCIES: Array<{ key: BackupFrequency; label: string }> = [
  { key: 'manual', label: 'Manual' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
];

const STATUS_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: theme.colors.success },
  failed: { icon: 'close-circle', color: theme.colors.danger },
  in_progress: { icon: 'time-outline', color: theme.colors.warning },
};

/** Screen 22 — manage data safety: backup/restore (Section 16, 33). */
export function BackupRestoreScreen() {
  const navigation = useAppNavigation();
  const [frequency, setFrequency] = useState<BackupFrequency>(mockAppSettings.backupFrequency);
  const [backingUp, setBackingUp] = useState(false);
  const [confirmRestoreVisible, setConfirmRestoreVisible] = useState(false);

  function handleBackupNow() {
    setBackingUp(true);
    setTimeout(() => setBackingUp(false), 1200);
  }

  return (
    <ScreenContainer>
      <ScreenHeader title="Backup & Restore" onBack={() => navigation.goBack()} />

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons name="cloud-done-outline" size={22} color={theme.colors.success} />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>Last backup successful</Text>
            <Text style={styles.statusMeta}>{mockAppSettings.lastBackupAt ? formatDateTime(new Date(mockAppSettings.lastBackupAt)) : 'Never backed up'}</Text>
          </View>
        </View>
        <AppButton label={backingUp ? 'Backing up…' : 'Backup Now'} loading={backingUp} onPress={handleBackupNow} style={styles.backupButton} />
      </Card>

      <Text style={styles.sectionLabel}>Backup frequency</Text>
      <View style={styles.chipRow}>
        {FREQUENCIES.map((f) => (
          <Chip key={f.key} label={f.label} selected={frequency === f.key} onPress={() => setFrequency(f.key)} />
        ))}
      </View>

      <Card style={styles.restoreCard}>
        <View style={styles.restoreInfo}>
          <Text style={styles.restoreTitle}>Restore from backup</Text>
          <Text style={styles.restoreMeta}>Replaces current data with a previous Drive backup.</Text>
        </View>
        <AppButton label="Restore" variant="secondary" onPress={() => setConfirmRestoreVisible(true)} />
      </Card>

      <Card style={styles.cloudCard}>
        <Ionicons name="server-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={styles.cloudText}>Cloud storage usage — coming soon</Text>
      </Card>

      <Text style={styles.sectionLabel}>Backup history</Text>
      <FlatList
        data={mockBackupLogs}
        keyExtractor={(entry) => entry.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const status = STATUS_ICON[item.status];
          return (
            <View style={styles.logRow}>
              <Ionicons name={status.icon} size={18} color={status.color} />
              <View style={styles.logInfo}>
                <Text style={styles.logFileName} numberOfLines={1}>{item.fileName}</Text>
                <Text style={styles.logMeta}>
                  {item.direction === 'backup' ? 'Backup' : 'Restore'} · {formatDateTime(new Date(item.createdAt))}
                  {item.errorMessage ? ` · ${item.errorMessage}` : ''}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <ConfirmationDialog
        visible={confirmRestoreVisible}
        title="Restore from backup?"
        message="This will replace all current data with the selected backup. This cannot be undone."
        confirmLabel="Restore"
        destructive
        onCancel={() => setConfirmRestoreVisible(false)}
        onConfirm={() => setConfirmRestoreVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statusCard: { marginBottom: theme.spacing.md },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  statusInfo: { flex: 1 },
  statusTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  statusMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  backupButton: { marginTop: theme.spacing.md },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  restoreCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  restoreInfo: { flex: 1 },
  restoreTitle: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary },
  restoreMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  cloudCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg, backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.surfaceAlt },
  cloudText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  logInfo: { flex: 1 },
  logFileName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  logMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
});
