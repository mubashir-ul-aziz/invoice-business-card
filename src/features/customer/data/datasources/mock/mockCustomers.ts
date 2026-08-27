import { Customer } from '../../../domain/entities/Customer';

export const mockCustomers: Customer[] = [
  { id: 'cust-1', name: 'Standard Supply Co.', phone: '+1 (214) 555-0132', email: 'ap@standardsupply.com', address: '400 Commerce St, Dallas, TX', createdAt: '2025-11-02' },
  { id: 'cust-2', name: 'Northwest Logistics', phone: '+1 (206) 555-0177', email: 'billing@nwlogistics.com', address: '2200 Alaskan Way, Seattle, WA', createdAt: '2025-11-18' },
  { id: 'cust-3', name: 'Harborline Freight', phone: '+1 (617) 555-0199', email: 'accounts@harborline.com', address: '10 Seaport Blvd, Boston, MA', createdAt: '2025-12-01' },
  { id: 'cust-4', name: 'Sterling & Co. Retail', phone: '+1 (312) 555-0164', email: 'finance@sterlingretail.com', address: '88 LaSalle St, Chicago, IL', createdAt: '2025-12-10' },
  { id: 'cust-5', name: 'Bluepeak Manufacturing', phone: '+1 (480) 555-0121', email: 'ap@bluepeakmfg.com', address: '750 Industrial Pkwy, Tempe, AZ', createdAt: '2026-01-05' },
  { id: 'cust-6', name: 'Rosewood Interiors', phone: '+1 (503) 555-0143', email: 'orders@rosewoodinteriors.com', address: '19 Pearl District, Portland, OR', createdAt: '2026-01-14' },
  { id: 'cust-7', name: 'Vantage Point Realty', phone: '+1 (305) 555-0188', email: 'billing@vantagepoint.com', address: '901 Brickell Ave, Miami, FL', createdAt: '2026-02-02', notes: 'Prefers invoices emailed on the 1st of each month.' },
  { id: 'cust-8', name: 'Crestline Hospitality Group', phone: '+1 (702) 555-0110', email: 'ap@crestlinehg.com', address: '3700 Las Vegas Blvd, Las Vegas, NV', createdAt: '2026-02-20' },
  { id: 'cust-9', name: 'Oakridge Facilities Mgmt', phone: '+1 (720) 555-0155', email: 'accounts@oakridgefm.com', address: '55 17th St, Denver, CO', createdAt: '2026-03-03' },
];
