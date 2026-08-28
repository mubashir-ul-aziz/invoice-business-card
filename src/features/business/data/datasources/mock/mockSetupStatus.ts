import { Result, ok } from '../../../../../core/result/result';
import { UnknownFailure } from '../../../../../core/errors/failures';

export interface SetupStatus {
  /** Whether a business profile already exists (mock/in-memory only — Phase 1 must not touch SQLite). */
  hasExistingBusiness: boolean;
}

/**
 * Mock-only readiness check for the Welcome screen. Simulates the brief
 * async boundary the real app will have on first launch (Section 32 —
 * "first-run seeding" is an async boundary that shows a loading state), so
 * WelcomeScreen already has its loading/error branches wired the same way
 * every later screen does. No persistence: per Phase 1's acceptance
 * criteria, "a simple in-memory/mock flag is sufficient at this stage."
 */
export function checkSetupStatus(): Promise<Result<SetupStatus, UnknownFailure>> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(ok({ hasExistingBusiness: false })), 450);
  });
}
