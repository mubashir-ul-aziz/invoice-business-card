import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../app/theme/theme';
import { AppButton } from './AppButton';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Guards every destructive/irreversible action (delete, restore, etc.) — Screen 28. */
export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton label={cancelLabel} variant="secondary" onPress={onCancel} style={styles.actionButton} />
            <AppButton
              label={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  title: { ...theme.typography.h3, color: theme.colors.textPrimary },
  message: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.sm },
  actions: { flexDirection: 'row', marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  actionButton: { flex: 1 },
});
