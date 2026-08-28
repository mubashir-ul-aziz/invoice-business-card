import { Customer } from '../entities/Customer';
import { CustomerActivity } from './customerActivity';

export type CustomerFilter = 'all' | 'outstanding' | 'overdue';

/**
 * Search (name/email/phone) + status-tab filtering for the Customers List
 * (Screen 9): All / Outstanding (balance > 0) / Overdue (has an overdue
 * invoice). A pure use-case rather than logic inline in the screen (Section
 * 10), mirroring `filterItems` for the Items List.
 */
export function filterCustomers(
  customers: Customer[],
  activityByCustomerId: Record<string, CustomerActivity>,
  query: string,
  filter: CustomerFilter,
): Customer[] {
  const q = query.trim().toLowerCase();
  return customers.filter((customer) => {
    const activity = activityByCustomerId[customer.id];
    if (filter === 'outstanding' && !(activity && activity.balance > 0)) return false;
    if (filter === 'overdue' && !(activity && activity.hasOverdue)) return false;
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      (customer.email?.toLowerCase().includes(q) ?? false) ||
      (customer.phone?.toLowerCase().includes(q) ?? false)
    );
  });
}
