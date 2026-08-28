import { create } from 'zustand';

interface DashboardState {
  /** null = "not chosen yet" — the screen resolves this to the latest available month. */
  selectedMonthKey: string | null;
  selectMonth: (key: string) => void;
}

/**
 * Holds the dashboard's selected reporting month (Section 10 — per-feature
 * Zustand store; the month-summing itself stays in the pure `computeDashboardSummary`
 * use-case, not here). Kept separate from list/detail stores since it's
 * screen-local UI state, not persisted data.
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  selectedMonthKey: null,
  selectMonth: (key) => set({ selectedMonthKey: key }),
}));
