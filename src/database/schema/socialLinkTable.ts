import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';
import { businesses } from './businessTable';

/** SocialLink (Section 7) — Business (1) -> (many) SocialLink (Section 8). */
export const socialLinks = sqliteTable(
  'social_links',
  {
    id: text('id').primaryKey(),
    businessId: text('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
    platform: text('platform', {
      enum: ['whatsapp', 'facebook', 'instagram', 'google_maps', 'website', 'other'],
    }).notNull(),
    url: text('url').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('social_links_business_id_idx').on(table.businessId)],
);
