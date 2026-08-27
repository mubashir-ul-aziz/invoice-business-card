export type SocialPlatform = 'whatsapp' | 'facebook' | 'instagram' | 'google_maps' | 'website' | 'other';

export interface SocialLink {
  id: string;
  businessId: string;
  platform: SocialPlatform;
  url: string;
}

export interface Business {
  id: string;
  name: string;
  logoInitial: string;
  logoColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currencyCode: string;
  taxNumber?: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  defaultInvoiceTypeId?: string;
}
