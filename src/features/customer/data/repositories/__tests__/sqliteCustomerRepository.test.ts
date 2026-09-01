import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteCustomerRepository } from '../sqliteCustomerRepository';

describe('SqliteCustomerRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteCustomerRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteCustomerRepository(db);
  });

  it('starts empty', async () => {
    const result = await repo.getCustomers();
    expect(result.isSuccess && result.value).toEqual([]);
  });

  it('rejects a create with a blank name', async () => {
    const result = await repo.createCustomer({ name: '   ' });
    expect(result.isSuccess).toBe(false);
  });

  it('creates, lists, and fetches a single customer by id', async () => {
    const created = await repo.createCustomer({ name: 'Acme Corp', email: 'ap@acme.com' });
    expect(created.isSuccess).toBe(true);
    if (!created.isSuccess) return;
    expect(created.value.name).toBe('Acme Corp');
    expect(typeof created.value.createdAt).toBe('string');

    const list = await repo.getCustomers();
    expect(list.isSuccess && list.value).toHaveLength(1);

    const fetched = await repo.getCustomer(created.value.id);
    expect(fetched.isSuccess && fetched.value.email).toBe('ap@acme.com');
  });

  it('updates an existing customer', async () => {
    const created = await repo.createCustomer({ name: 'Old Name' });
    if (!created.isSuccess) throw new Error('setup failed');

    const updated = await repo.updateCustomer(created.value.id, { name: 'New Name', phone: '555-0100' });
    expect(updated.isSuccess).toBe(true);
    if (!updated.isSuccess) return;
    expect(updated.value.name).toBe('New Name');
    expect(updated.value.phone).toBe('555-0100');
  });

  it('getCustomer/updateCustomer fail with NotFoundFailure for an unknown id', async () => {
    const getResult = await repo.getCustomer('missing');
    expect(getResult.isSuccess).toBe(false);
    const updateResult = await repo.updateCustomer('missing', { name: 'x' });
    expect(updateResult.isSuccess).toBe(false);
  });
});
