import type { Config } from 'drizzle-kit';

/**
 * drizzle-kit config (Section 6: "drizzle-kit generating versioned SQL
 * migrations"). `0000_init.ts` (`src/database/migrations/`) was
 * hand-authored to avoid Metro needing extra config to import raw `.sql`
 * files at runtime — future schema changes should still be developed
 * against this config (`npx drizzle-kit generate`) to diff the schema, with
 * the generated SQL then translated into a new numbered entry in
 * `src/database/migrations/index.ts`, keeping `runMigrations` (Section:
 * "safe migrations") as the single thing that actually applies SQL on
 * device.
 */
export default {
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations/generated',
  dialect: 'sqlite',
} satisfies Config;
