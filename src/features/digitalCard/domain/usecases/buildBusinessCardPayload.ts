import { Business, SocialLink } from '../../../business/domain/entities/Business';
import { BusinessCardPayload } from '../entities/BusinessCardPayload';

/**
 * Derives the single `BusinessCardPayload` view from Business + SocialLink
 * (Section 29) — a pure domain function so both the card screen and QR
 * encoding read from one source instead of composing this inline per screen.
 */
export function buildBusinessCardPayload(business: Business, socialLinks: SocialLink[]): BusinessCardPayload {
  return {
    businessId: business.id,
    name: business.name,
    phone: business.phone,
    email: business.email,
    website: business.website,
    address: business.address,
    socialLinks: socialLinks
      .filter((link) => link.businessId === business.id)
      .map((link) => ({ platform: link.platform, url: link.url })),
  };
}
