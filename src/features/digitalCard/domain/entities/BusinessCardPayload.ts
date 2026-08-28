import { SocialPlatform } from '../../../business/domain/entities/Business';

export interface BusinessCardSocialLink {
  platform: SocialPlatform;
  url: string;
}

/**
 * Single source of truth for what the digital business card presents and what
 * gets encoded into the QR code — a derived view of Business + SocialLink,
 * never a separate persisted entity (Section 29).
 */
export interface BusinessCardPayload {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  socialLinks: BusinessCardSocialLink[];
}
