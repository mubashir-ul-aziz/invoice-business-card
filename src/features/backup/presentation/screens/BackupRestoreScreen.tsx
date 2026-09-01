import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../../app/theme/theme';
import { ScreenContainer } from '../../../../core/components/ScreenContainer';
import { ScreenHeader } from '../../../../core/components/ScreenHeader';
import { Card } from '../../../../core/components/Card';
import { AppButton } from '../../../../core/components/AppButton';
import { Chip } from '../../../../core/components/Chip';
import { ConfirmationDialog } from '../../../../core/components/ConfirmationDialog';
import { useAppNavigation } from '../../../../app/navigation/hooks';
import { useBackupStore } from '../state/backupStore';
import { useSettingsStore } from '../../../settings/presentation/state/settingsStore';
import { BackupFrequency } from '../../../settings/domain/entities/AppSettings';
import { DriveBackupFile } from '../../domain/entities/GoogleDriveBackup';
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

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Screen 22 — manage data safety: real Google Drive backup/restore (Section 13, 33; Phase 22). */
export function BackupRestoreScreen() {
  const navigation = useAppNavigation();
  const backupFrequency = useSettingsStore((state) => state.backupFrequency);
  const lastBackupAt = useSettingsStore((state) => state.lastBackupAt);
  const updateSettings = useSettingsStore((state) => state.update);

  const {
    authStatus,
    driveBackups,
    logs,
    connectStatus,
    backupStatus,
    restoringId,
    errorMessage,
    loadAuthStatus,
    connect,
    disconnect,
    backupNow,
    loadDriveBackups,
    restoreBackup,
    loadLogs,
  } = useBackupStore();

  const [confirmRestoreTarget, setConfirmRestoreTarget] = useState<DriveBackupFile | null>(null);
  const [restoreResultMessage, setRestoreResultMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAuthStatus();
    loadLogs();
  }, [loadAuthStatus, loadLogs]);

  useEffect(() => {
    if (authStatus.connected) loadDriveBackups();
  }, [authStatus.connected, loadDriveBackups]);

  const lastFailedLog = logs.find((entry) => entry.direction === 'backup' && entry.status === 'failed');
  const lastLogIsMostRecentFailure = logs[0]?.status === 'failed';

  async function handleConfirmRestore() {
    if (!confirmRestoreTarget) return;
    const target = confirmRestoreTarget;
    setConfirmRestoreTarget(null);
    const success = await restoreBackup(target.id);
    setRestoreResultMessage(success ? 'Your data has been restored from this backup.' : null);
  }

  return (
    <ScreenContainer scroll>
      <ScreenHeader title="Backup & Restore" onBack={() => navigation.goBack()} />

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={authStatus.connected ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={22}
            color={authStatus.connected ? theme.colors.success : theme.colors.textSecondary}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {authStatus.connected ? `Connected${authStatus.accountEmail ? ` as ${authStatus.accountEmail}` : ''}` : 'Not connected'}
            </Text>
            <Text style={styles.statusMeta}>Backups are stored in your own Google Drive, in an “Invora Backups” folder.</Text>
          </View>
        </View>
        <AppButton
          label={authStatus.connected ? 'Disconnect' : 'Connect Google Drive'}
          variant="secondary"
          loading={connectStatus === 'working'}
          onPress={authStatus.connected ? disconnect : connect}
          style={styles.backupButton}
        />
      </Card>

      <Card style={styles.statusCard}>
        <View style={styles.statusRow}>
          <Ionicons
            name={lastLogIsMostRecentFailure ? 'warning-outline' : 'checkmark-circle-outline'}
            size={22}
            color={lastLogIsMostRecentFailure ? theme.colors.danger : theme.colors.success}
          />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{lastBackupAt ? 'Last backup successful' : 'No backup yet'}</Text>
            <Text style={styles.statusMeta}>{lastBackupAt ? formatDateTime(new Date(lastBackupAt)) : 'Back up now to protect your data.'}</Text>
          </View>
        </View>
        {lastLogIsMostRecentFailure && lastFailedLog ? (
          <View style={styles.failureBanner}>
            <Text style={styles.failureText}>Last attempt failed: {lastFailedLog.errorMessage ?? 'Unknown error.'}</Text>
          </View>
        ) : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <AppButton
          label={backupStatus === 'working' ? 'Backing up…' : 'Backup Now'}
          loading={backupStatus === 'working'}
          disabled={!authStatus.connected}
          onPress={backupNow}
          style={styles.backupButton}
        />
        {!authStatus.connected ? <Text style={styles.hintText}>Connect Google Drive above to enable backups.</Text> : null}
      </Card>

      <Text style={styles.sectionLabel}>Automatic backup</Text>
      <View style={styles.chipRow}>
        {FREQUENCIES.map((f) => (
          <Chip key={f.key} label={f.label} selected={backupFrequency === f.key} onPress={() => updateSettings({ backupFrequency: f.key })} />
        ))}
      </View>

      {authStatus.connected ? (
        <>
          <Text style={styles.sectionLabel}>Restore from Drive</Text>
          {driveBackups.length === 0 ? (
            <Text style={styles.emptyText}>No backups found in your Drive yet.</Text>
          ) : (
            driveBackups.map((file) => (
              <View key={file.id} style={styles.driveRow}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
                <View style={styles.logInfo}>
                  <Text style={styles.logFileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={styles.logMeta}>
                    {file.createdAt ? formatDateTime(new Date(file.createdAt)) : ''}{file.sizeBytes ? ` · ${formatBytes(file.sizeBytes)}` : ''}
                    {!file.isSupportedVersion ? ' · Requires a newer app version' : ''}
                  </Text>
                </View>
                <AppButton
                  label={restoringId === file.id ? 'Restoring…' : 'Restore'}
                  variant="secondary"
                  disabled={!file.isSupportedVersion || restoringId !== null}
                  loading={restoringId === file.id}
                  onPress={() => setConfirmRestoreTarget(file)}
                />
              </View>
            ))
          )}
        </>
      ) : null}

      {restoreResultMessage ? (
        <Card style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
          <Text style={styles.successText}>{restoreResultMessage}</Text>
        </Card>
      ) : null}

      <Card style={styles.cloudCard}>
        <Ionicons name="server-outline" size={18} color={theme.colors.textSecondary} />
        <Text style={styles.cloudText}>Cloud storage usage — coming soon</Text>
      </Card>

      <Text style={styles.sectionLabel}>Backup history</Text>
      {logs.length === 0 ? (
        <Text style={styles.emptyText}>No backup or restore attempts yet.</Text>
      ) : (
        logs.map((entry) => {
          const status = STATUS_ICON[entry.status];
          return (
            <View key={entry.id} style={styles.logRow}>
              <Ionicons name={status.icon} size={18} color={status.color} />
              <View style={styles.logInfo}>
                <Text style={styles.logFileName} numberOfLines={1}>{entry.fileName ?? (entry.direction === 'restore' ? 'Restored backup' : 'Backup')}</Text>
                <Text style={styles.logMeta}>
                  {entry.direction === 'backup' ? 'Backup' : 'Restore'} · {formatDateTime(new Date(entry.createdAt))}
                  {entry.errorMessage ? ` · ${entry.errorMessage}` : ''}
                </Text>
              </View>
            </View>
          );
        })
      )}

      <ConfirmationDialog
        visible={confirmRestoreTarget !== null}
        title="Restore from backup?"
        message={`This will replace all current data with the backup from ${confirmRestoreTarget ? formatDateTime(new Date(confirmRestoreTarget.createdAt)) : ''}. This cannot be undone.`}
        confirmLabel="Restore"
        destructive
        onCancel={() => setConfirmRestoreTarget(null)}
        onConfirm={handleConfirmRestore}
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
  hintText: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing.xs, textAlign: 'center' },
  failureBanner: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.dangerBg,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
  },
  failureText: { ...theme.typography.caption, color: theme.colors.danger },
  errorText: { ...theme.typography.caption, color: theme.colors.danger, marginTop: theme.spacing.sm },
  sectionLabel: { ...theme.typography.bodyStrong, color: theme.colors.textPrimary, marginBottom: theme.spacing.sm },
  chipRow: { flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  emptyText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary, marginBottom: theme.spacing.md },
  driveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.successBg,
    borderColor: theme.colors.successBg,
  },
  successText: { ...theme.typography.bodyMd, color: theme.colors.textPrimary, flex: 1 },
  cloudCard: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: theme.spacing.lg, backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.surfaceAlt },
  cloudText: { ...theme.typography.bodyMd, color: theme.colors.textSecondary },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  logInfo: { flex: 1 },
  logFileName: { ...theme.typography.bodyMd, color: theme.colors.textPrimary },
  logMeta: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
});
