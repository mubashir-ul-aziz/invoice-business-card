import { createTestDb } from '../../../../../database/testUtils';
import { AnyInvoraDb } from '../../../../../database/migrate';
import { SqliteBusinessRepository } from '../sqliteBusinessRepository';
import { BusinessInput } from '../../../domain/repositories/BusinessRepository';

const VALID_INPUT: BusinessInput = {
  name: 'Test Co',
  logoInitial: 'TC',
  logoColor: '#000000',
  email: 'hello@test.co',
  currencyCode: 'USD',
  invoicePrefix: 'INV-',
};

describe('SqliteBusinessRepository', () => {
  let db: AnyInvoraDb;
  let repo: SqliteBusinessRepository;

  beforeEach(async () => {
    db = await createTestDb();
    repo = new SqliteBusinessRepository(db);
  });

  it('returns null when no business exists yet', async () => {
    const result = await repo.getBusiness();
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) expect(result.value).toBeNull();
  });

  it('rejects an invalid create (missing name/email)', async () => {
    const result = await repo.createBusiness({ ...VALID_INPUT, name: '', email: '' });
    expect(result.isSuccess).toBe(false);
  });

  it('creates a business on first save, with nextInvoiceNumber seeded to 1', async () => {
    const result = await repo.createBusiness(VALID_INPUT);
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.value.name).toBe('Test Co');
    expect(result.value.nextInvoiceNumber).toBe(1);

    const fetched = await repo.getBusiness();
    expect(fetched.isSuccess && fetched.value?.id).toBe(result.value.id);
  });

  it('a second "create" call updates the existing singleton row in place, preserving its id', async () => {
    const first = await repo.createBusiness(VALID_INPUT);
    expect(first.isSuccess).toBe(true);
    if (!first.isSuccess) return;

    const second = await repo.createBusiness({ ...VALID_INPUT, name: 'Renamed Co' });
    expect(second.isSuccess).toBe(true);
    if (!second.isSuccess) return;

    expect(second.value.id).toBe(first.value.id);
    expect(second.value.name).toBe('Renamed Co');

    const all = db.all('SELECT id FROM businesses');
    expect(all).toHaveLength(1);
  });

  it('updateBusiness fails with NotFoundFailure for an unknown id', async () => {
    const result = await repo.updateBusiness('does-not-exist', VALID_INPUT);
    expect(result.isSuccess).toBe(false);
    if (!result.isSuccess) expect(result.error.kind).toBe('notFound');
  });
});
