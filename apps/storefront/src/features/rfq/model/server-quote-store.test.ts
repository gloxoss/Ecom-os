import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  JsonFileRfqQuoteStore,
  InMemoryRfqQuoteStore,
  createDefaultRfqQuoteStore,
  getRfqQuoteStore,
  setRfqQuoteStoreForTesting,
  WordPressRfqQuoteStore,
} from './server-quote-store';
import type { RfqQuote } from '../../../../../../packages/addons-rfq/src/index';

const sampleQuote: RfqQuote = {
  id: 'quote_restart_1',
  quoteNumber: 'DEV-2026-4242',
  state: 'submitted',
  contact: { name: 'Salma Tazi', email: 'salma@riad-design.ma' },
  consents: [{ consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' }],
  items: [{ productId: 50, variationId: 501, title: 'Handcrafted Brass Sconce', quantity: 4 }],
  revisions: [],
  accessSecretHash: 'hash_of_guest_grant',
  guestChallengeEmail: 'salma@riad-design.ma',
  isContactVerified: false,
  createdAt: '2026-10-10T12:00:00Z',
  updatedAt: '2026-10-10T12:00:00Z',
};

const tempDirs: string[] = [];

function makeTempStorePath(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'ecom-rfq-store-'));
  tempDirs.push(dir);
  return path.join(dir, 'rfq-quotes.json');
}

afterEach(() => {
  setRfqQuoteStoreForTesting(null);
  delete process.env.ECOM_RFQ_STORE_PATH;
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('RFQ server quote store durability (ECO-1005)', () => {
  it('survives a simulated restart: a fresh instance over the same file reads the quote back', async () => {
    const filePath = makeTempStorePath();

    const before = new JsonFileRfqQuoteStore(filePath);
    await before.putQuote(sampleQuote);
    await before.putIdempotency('idemp-restart-key', {
      ownerKey: 'salma@riad-design.ma',
      statusCode: 201,
      data: {
        success: true,
        quoteId: sampleQuote.id,
        quoteNumber: sampleQuote.quoteNumber,
        accessSecret: 'secret_that_must_outlive_the_process',
        state: 'submitted',
      },
    });

    // "Restart": a brand new instance, no shared memory, reading the same file.
    const afterRestart = new JsonFileRfqQuoteStore(filePath);

    expect(await afterRestart.listQuoteIds()).toEqual([sampleQuote.id]);
    const reloaded = await afterRestart.getQuote(sampleQuote.id);
    expect(reloaded?.quoteNumber).toBe('DEV-2026-4242');
    expect(reloaded?.items[0]?.variationId).toBe(501);
    expect(reloaded?.accessSecretHash).toBe('hash_of_guest_grant');

    const entry = await afterRestart.getIdempotency('idemp-restart-key');
    expect(entry?.ownerKey).toBe('salma@riad-design.ma');
    expect(entry?.data.quoteId).toBe(sampleQuote.id);
  });

  it('writes atomically: no leftover temp file and the target file is complete JSON', async () => {
    const filePath = makeTempStorePath();
    const store = new JsonFileRfqQuoteStore(filePath);
    await store.putQuote(sampleQuote);

    const dir = path.dirname(filePath);
    expect(readdirSync(dir).filter((name) => name.endsWith('.tmp'))).toEqual([]);
    expect(readdirSync(dir)).toEqual(['rfq-quotes.json']);
  });

  it('selects the durable file store when ECOM_RFQ_STORE_PATH is configured', async () => {
    process.env.ECOM_RFQ_STORE_PATH = makeTempStorePath();
    expect(createDefaultRfqQuoteStore()).toBeInstanceOf(JsonFileRfqQuoteStore);

    delete process.env.ECOM_RFQ_STORE_PATH;
    expect(createDefaultRfqQuoteStore()).toBeInstanceOf(InMemoryRfqQuoteStore);
  });

  it('exposes one shared store so both RFQ routes resolve the same quotes', async () => {
    const inMemory = new InMemoryRfqQuoteStore();
    setRfqQuoteStoreForTesting(inMemory);

    expect(getRfqQuoteStore()).toBe(inMemory);
    expect(getRfqQuoteStore()).toBe(getRfqQuoteStore());
    expect(await getRfqQuoteStore().getQuote(sampleQuote.id)).toBeUndefined();

    await getRfqQuoteStore().putQuote(sampleQuote);
    expect(await getRfqQuoteStore().getQuote(sampleQuote.id)).toBe(sampleQuote);
  });

  it('clear() removes quotes and idempotency entries but keeps the store usable', async () => {
    const store = new InMemoryRfqQuoteStore();
    await store.putQuote(sampleQuote);
    await store.putIdempotency('k', {
      ownerKey: 'a@b.ma',
      statusCode: 201,
      data: { success: true, quoteId: 'x', quoteNumber: 'y', accessSecret: 'z', state: 'submitted' },
    });

    await store.clear();

    expect(await store.listQuoteIds()).toEqual([]);
    expect(await store.getIdempotency('k')).toBeUndefined();

    await store.putQuote(sampleQuote);
    expect(await store.getQuote(sampleQuote.id)).toBe(sampleQuote);
  });

  it('preserves multiple revisions and acceptance state across process restart', async () => {
    const filePath = makeTempStorePath();
    const storeBefore = new JsonFileRfqQuoteStore(filePath);

    const quoteWithRevisions: RfqQuote = {
      ...sampleQuote,
      state: 'accepted',
      currentRevisionId: 'rev_2',
      expiresAt: '2026-11-01T00:00:00Z',
      revisions: [
        {
          revisionId: 'rev_1',
          revisionNumber: 1,
          createdAt: '2026-10-10T12:00:00Z',
          createdBy: { staffId: 'staff-1', staffName: 'Staff One' },
          expiresAt: '2026-11-01T00:00:00Z',
          currency: 'MAD',
          lines: [{
            productId: 50,
            variationId: 501,
            title: 'Handcrafted Brass Sconce',
            quantity: 4,
            unitPriceExclTax: 1000,
            taxRate: 0.20,
            taxAmount: 800,
            totalExclTax: 4000,
            totalInclTax: 4800,
          }],
          subtotalExclTax: 4000,
          totalTax: 800,
          totalInclTax: 4800,
          termsAndConditions: 'Standard Terms',
          isCurrent: false,
        },
        {
          revisionId: 'rev_2',
          revisionNumber: 2,
          createdAt: '2026-10-10T14:00:00Z',
          createdBy: { staffId: 'staff-2', staffName: 'Staff Two' },
          expiresAt: '2026-11-01T00:00:00Z',
          currency: 'MAD',
          lines: [{
            productId: 50,
            variationId: 501,
            title: 'Handcrafted Brass Sconce',
            quantity: 4,
            unitPriceExclTax: 900,
            taxRate: 0.20,
            taxAmount: 720,
            totalExclTax: 3600,
            totalInclTax: 4320,
          }],
          subtotalExclTax: 3600,
          totalTax: 720,
          totalInclTax: 4320,
          termsAndConditions: 'Discounted Terms',
          isCurrent: true,
        },
      ],
    };

    await storeBefore.putQuote(quoteWithRevisions);

    // Brand new instance after restart
    const storeAfter = new JsonFileRfqQuoteStore(filePath);
    const reloaded = await storeAfter.getQuote(quoteWithRevisions.id);

    expect(reloaded).toBeDefined();
    expect(reloaded?.state).toBe('accepted');
    expect(reloaded?.currentRevisionId).toBe('rev_2');
    expect(reloaded?.revisions.length).toBe(2);
    expect(reloaded?.revisions[0]?.revisionId).toBe('rev_1');
    expect(reloaded?.revisions[0]?.totalInclTax).toBe(4800);
    expect(reloaded?.revisions[0]?.isCurrent).toBe(false);
    expect(reloaded?.revisions[1]?.revisionId).toBe('rev_2');
    expect(reloaded?.revisions[1]?.totalInclTax).toBe(4320);
    expect(reloaded?.revisions[1]?.isCurrent).toBe(true);
  });

  it('maps raw WordPress persistence revisions into strongly-typed domain objects', async () => {
    const rawWpQuote = {
      id: 'wp_quote_99',
      quote_number: 'DEV-WP-99',
      state: 'offer_created',
      customer_name: 'Yassine Alami',
      customer_email: 'yassine@example.ma',
      contact_data: JSON.stringify({ name: 'Yassine Alami', email: 'yassine@example.ma', phone: '+212600112233' }),
      items_data: JSON.stringify([{ productId: 101, title: 'Cedar Mirror', quantity: 2 }]),
      current_revision_id: 'rev_1',
      expires_at: '2026-11-15T00:00:00Z',
      created_at: '2026-10-10T10:00:00Z',
      updated_at: '2026-10-10T11:00:00Z',
      revisions: [
        {
          revision_id: 'rev_1',
          revision_number: 1,
          created_at: '2026-10-10T11:00:00Z',
          created_by_staff_id: 'staff_88',
          created_by_staff_name: 'Karim Bennani',
          lines_data: JSON.stringify([{
            productId: 101,
            title: 'Cedar Mirror',
            quantity: 2,
            unitPriceExclTax: 1500,
            taxRate: 0.20,
            taxAmount: 600,
            totalExclTax: 3000,
            totalInclTax: 3600,
          }]),
          subtotal_excl_tax: '3000.00',
          total_tax: '600.00',
          total_incl_tax: '3600.00',
          currency: 'MAD',
          expires_at: '2026-11-15T00:00:00Z',
          terms: 'Standard warranty',
          notes: 'Customer requested brass accents',
          is_current: 1,
        },
      ],
    };

    const wpStore = new WordPressRfqQuoteStore('http://localhost:8080/wp-json/ecomos/v1/rfq', 'dXNlcjpwYXNz');
    const mapped = (wpStore as any).map(rawWpQuote) as RfqQuote;

    expect(mapped).toBeDefined();
    expect(mapped.id).toBe('wp_quote_99');
    expect(mapped.quoteNumber).toBe('DEV-WP-99');
    expect(mapped.state).toBe('offer_created');
    expect(mapped.customerName).toBe('Yassine Alami');
    expect(mapped.contact.email).toBe('yassine@example.ma');
    expect(mapped.items.length).toBe(1);
    expect(mapped.revisions.length).toBe(1);

    const rev = mapped.revisions[0]!;
    expect(rev.revisionId).toBe('rev_1');
    expect(rev.revisionNumber).toBe(1);
    expect(rev.createdBy.staffId).toBe('staff_88');
    expect(rev.createdBy.staffName).toBe('Karim Bennani');
    expect(rev.lines.length).toBe(1);
    expect(rev.lines[0]?.title).toBe('Cedar Mirror');
    expect(rev.lines[0]?.unitPriceExclTax).toBe(1500);
    expect(rev.subtotalExclTax).toBe(3000);
    expect(rev.totalTax).toBe(600);
    expect(rev.totalInclTax).toBe(3600);
    expect(rev.currency).toBe('MAD');
    expect(rev.termsAndConditions).toBe('Standard warranty');
    expect(rev.staffNotes).toBe('Customer requested brass accents');
    expect(rev.isCurrent).toBe(true);
  });

  it('translates domain errors on guest actions into honest UpstreamRfqError instances', async () => {
    const inMemory = new InMemoryRfqQuoteStore();
    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    const pastExpiry = '2026-10-01T00:00:00Z';

    const testQuote: RfqQuote = {
      ...sampleQuote,
      state: 'offer_created',
      currentRevisionId: 'rev_2',
      expiresAt: futureExpiry,
      revisions: [
        {
          revisionId: 'rev_1',
          revisionNumber: 1,
          createdAt: '2026-10-10T12:00:00Z',
          createdBy: { staffId: 'op', staffName: 'Op' },
          expiresAt: futureExpiry,
          currency: 'MAD',
          lines: [],
          subtotalExclTax: 100,
          totalTax: 20,
          totalInclTax: 120,
          isCurrent: false,
        },
        {
          revisionId: 'rev_2',
          revisionNumber: 2,
          createdAt: '2026-10-10T14:00:00Z',
          createdBy: { staffId: 'op', staffName: 'Op' },
          expiresAt: futureExpiry,
          currency: 'MAD',
          lines: [],
          subtotalExclTax: 90,
          totalTax: 18,
          totalInclTax: 108,
          isCurrent: true,
        },
      ],
    };

    await inMemory.putQuote(testQuote);

    // 1. Accepting stale revision -> 409 STALE_REVISION
    await expect(inMemory.acceptOffer(testQuote.id, 'rev_1')).rejects.toThrowError(
      expect.objectContaining({ statusCode: 409, errorCode: 'STALE_REVISION' })
    );

    // 2. Accepting expired quote -> 410 QUOTE_EXPIRED
    await inMemory.putQuote({
      ...testQuote,
      expiresAt: pastExpiry,
    });
    await expect(inMemory.acceptOffer(testQuote.id, 'rev_2')).rejects.toThrowError(
      expect.objectContaining({ statusCode: 410, errorCode: 'QUOTE_EXPIRED' })
    );

    // 3. Illegal state transition -> 400 INVALID_STATE_TRANSITION
    await inMemory.putQuote({
      ...testQuote,
      state: 'accepted',
    });
    await expect(inMemory.rejectQuote(testQuote.id, 'Too late')).rejects.toThrowError(
      expect.objectContaining({ statusCode: 400, errorCode: 'INVALID_STATE_TRANSITION' })
    );
  });
});

