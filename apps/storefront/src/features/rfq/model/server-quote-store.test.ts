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
});
