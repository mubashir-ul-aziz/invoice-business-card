import { create } from 'zustand';
import { settingsRepository } from '../../../../app/di/providers';
import { ValidationFailure } from '../../../../core/errors/failures';
import { AppSettings } from '../../domain/entities/AppSettings';
import { mockAppSettings } from '../../data/datasources/mock/mockSettings';

export type SettingsStatus = 'idle' | 'saving' | 'error';

interface SettingsState extends AppSettings {
  status: SettingsStatus;
  errorMessage?: string;
  fieldErrors: Record<string, string>;

  /** Persists a partial change through `SettingsRepository` and reflects the saved result back into state. */
  update: (patch: Partial<AppSettings>) => Promise<void>;
}

/**
 * Settings screen's single source of truth (Phase 17). The screen reads and
 * writes only through this store; the store is the sole caller of
 * `settingsRepository` (Section 10 — UI never talks to a repository
 * directly). Seeded synchronously from the mock datasource, same as
 * `businessFormStore`, since there's no async bootstrap step yet in this
 * mock-data stage.
 */
export const useSettingsStore = create<SettingsState>((set) => ({
  ...mockAppSettings,
  status: 'idle',
  errorMessage: undefined,
  fieldErrors: {},

  update: async (patch) => {
    set({ status: 'saving', errorMessage: undefined });
    const result = await settingsRepository.updateSettings(patch);
    if (!result.isSuccess) {
      const failure = result.error;
      set({
        status: 'error',
        errorMessage: failure.message,
        fieldErrors: failure instanceof ValidationFailure ? failure.fieldErrors ?? {} : {},
      });
      return;
    }
    set({ ...result.value, status: 'idle', fieldErrors: {}, errorMessage: undefined });
  },
}));

/**
 * Forces the store's live state to match freshly-loaded settings. Needed
 * once at app startup: `useSettingsStore` is created (and its `...mockAppSettings`
 * spread captured) the moment this module is first imported — synchronously,
 * before `initializeDatabase()` can possibly finish reading the real
 * persisted row — so without this the store would keep showing the
 * hardcoded fixture defaults until the user changes something. Called from
 * `src/app/App.tsx`'s boot sequence, never from a screen.
 */
export function hydrateSettingsStore(settings: AppSettings): void {
  useSettingsStore.setState({ ...settings, status: 'idle', fieldErrors: {}, errorMessage: undefined });
}
