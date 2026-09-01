import { MIGRATION_0000_INIT } from './0000_init';

export interface Migration {
  id: string;
  statements: string[];
}

/** Ordered, append-only migration list (Section 6 — "each migration step documented"). */
export const MIGRATIONS: Migration[] = [MIGRATION_0000_INIT];
