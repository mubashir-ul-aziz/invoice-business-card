import { Business, SocialLink } from '../../../domain/entities/Business';

export const mockBusiness: Business = {
  id: 'business-1',
  name: 'Apex Consulting',
  logoInitial: 'AC',
  logoColor: '#2563EB',
  address: '128 Harbor View Drive, Austin, TX 78701',
  phone: '+1 (512) 555-0148',
  email: 'hello@apexconsulting.com',
  website: 'www.apexconsulting.com',
  currencyCode: 'USD',
  taxNumber: 'US-TAX-88213764',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1042,
  defaultInvoiceTypeId: 'type-general',
};

export const mockSocialLinks: SocialLink[] = [
  { id: 'social-1', businessId: 'business-1', platform: 'whatsapp', url: 'https://wa.me/15125550148' },
  { id: 'social-2', businessId: 'business-1', platform: 'website', url: 'https://www.apexconsulting.com' },
  { id: 'social-3', businessId: 'business-1', platform: 'instagram', url: 'https://instagram.com/apexconsulting' },
  { id: 'social-4', businessId: 'business-1', platform: 'facebook', url: 'https://facebook.com/apexconsulting' },
  { id: 'social-5', businessId: 'business-1', platform: 'google_maps', url: 'https://maps.google.com/?q=Apex+Consulting+Austin' },
];
