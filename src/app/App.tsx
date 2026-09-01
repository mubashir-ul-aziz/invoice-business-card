import React, { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation/AppNavigator';
import { ScreenContainer } from '../core/components/ScreenContainer';
import { LoadingState } from '../core/components/LoadingState';
import { ErrorState } from '../core/components/ErrorState';
import { initializeDatabase } from '../database/init';
import {
  businessRepository,
  invoiceTypeRepository,
  customerRepository,
  itemRepository,
  invoiceRepository,
  paymentRepository,
  settingsRepository,
  backupLogRepository,
  googleDriveBackupRepository,
} from './di/providers';
import { hydrateSettingsStore } from '../features/settings/presentation/state/settingsStore';
import { shouldRunAutomaticBackup } from '../features/backup/domain/usecases/shouldRunAutomaticBackup';

type BootState = 'loading' | 'ready' | 'error';

/**
 * Runs migrations + first-run seeding, then hydrates every shared read
 * cache (`core/utils/syncCache`) by calling each repository's own read
 * method once, before any screen mounts (Section 6). Kept out of a
 * synchronous top-level call per Section 4's "Startup" principle — DB work
 * runs behind this lightweight loading state instead of blocking `App.tsx`.
 */
async function bootstrap(): Promise<void> {
  initializeDatabase();
  const results = await Promise.all([
    businessRepository.getBusiness(),
    invoiceTypeRepository.getInvoiceTypes(),
    customerRepository.getCustomers(),
    itemRepository.getItems(),
    invoiceRepository.getInvoices(),
    paymentRepository.getPayments(),
    settingsRepository.getSettings(),
    backupLogRepository.getBackupLogs(),
  ]);

  const settingsResult = results[6];
  if (settingsResult.isSuccess) {
    hydrateSettingsStore(settingsResult.value);
  }

  const failed = results.find((result) => !result.isSuccess);
  if (failed && !failed.isSuccess) {
    throw new Error(failed.error.message);
  }
}

/**
 * Once-per-launch automatic-backup check (Section 13). Runs only after the
 * UI is already interactive (called from the `state === 'ready'` effect
 * below, never awaited by `bootstrap()`) so a slow/offline Drive attempt can
 * never delay app startup. Every failure path is swallowed here — Section
 * 13's "never blocks or crashes the main app flow, surfaced non-intrusively"
 * — `backupNow()` already records the attempt to `BackupLog` itself either
 * way, which is what Screen 22 shows.
 */
async function runAutomaticBackupCheck(): Promise<void> {
  try {
    const settingsResult = await settingsRepository.getSettings();
    if (!settingsResult.isSuccess) return;
    if (!shouldRunAutomaticBackup(settingsResult.value)) return;

    const authResult = await googleDriveBackupRepository.getAuthStatus();
    if (!authResult.isSuccess || !authResult.value.connected) return;

    await googleDriveBackupRepository.backupNow();
  } catch {
    // Never let a background backup attempt take the app down.
  }
}

/** App root: providers + navigation shell. No feature/business logic here. */
export function App() {
  const [state, setState] = useState<BootState>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const runBootstrap = useCallback(() => {
    setState('loading');
    bootstrap()
      .then(() => setState('ready'))
      .catch((error: unknown) => {
        setErrorMessage(error instanceof Error ? error.message : 'Could not start the app.');
        setState('error');
      });
  }, []);

  useEffect(() => {
    runBootstrap();
  }, [runBootstrap]);

  useEffect(() => {
    if (state === 'ready') {
      runAutomaticBackupCheck();
    }
  }, [state]);

  return (
    <SafeAreaProvider>
      {state === 'loading' ? (
        <ScreenContainer>
          <LoadingState label="Preparing Invora…" />
        </ScreenContainer>
      ) : state === 'error' ? (
        <ScreenContainer>
          <ErrorState message={errorMessage || 'Could not start the app. Your local data is safe.'} onRetry={runBootstrap} />
        </ScreenContainer>
      ) : (
        <AppNavigator />
      )}
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
