import { describe, it, expect, beforeEach } from 'vitest';
import { AddonRegistry } from '@ecom-os/engine';
import { setStorefrontRegistryForTesting } from '../../../lib/addon-capabilities';
import { POST as submitRfq } from './route';
import { GET as getOffers, POST as offerAction } from './offers/route';
import { getRfqQuoteStore } from '../../../features/rfq/model/server-quote-store';

function submitRequest(body: unknown): Request {
  return new Request('http://localhost:3000/api/rfq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function submitPayload(overrides: {
  idempotencyKey: string;
  email: string;
  name?: string;
}) {
  return {
    idempotencyKey: overrides.idempotencyKey,
    contact: {
      name: overrides.name ?? 'Salma Tazi',
      email: overrides.email,
      companyName: 'Riad Design Studio',
    },
    items: [{ productId: 50, variationId: 501, title: 'Handcrafted Brass Sconce', quantity: 4 }],
    consents: [
      { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
      { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
    ],
  };
}

describe('RFQ submit/offers workflow contract (ECO-1005)', () => {
  let registry: AddonRegistry;

  beforeEach(async () => {
    await getRfqQuoteStore().clear();
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: { provided: ['quotes', 'submit_quote', 'quote_builder'] },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('makes a submitted quote readable from the offers endpoint with no test-only setter', async () => {
    registry.enable('quotes');

    const submitRes = await submitRfq(
      submitRequest(submitPayload({ idempotencyKey: 'flow-key-1', email: 'guest@example.ma' }))
    );
    expect(submitRes.status).toBe(201);
    const submitted = await submitRes.json();
    expect(submitted.success).toBe(true);

    // No setOfferQuoteForTesting() anywhere: the offers route must read the store
    // the submission route wrote.
    const offerRes = await getOffers(
      new Request(`http://localhost:3000/api/rfq/offers?quoteId=${submitted.quoteId}`, {
        method: 'GET',
        headers: { 'x-quote-token': submitted.accessSecret },
      })
    );

    expect(offerRes.status).toBe(200);
    const offerBody = await offerRes.json();
    expect(offerBody.success).toBe(true);
    expect(offerBody.quote.id).toBe(submitted.quoteId);
    expect(offerBody.quote.quoteNumber).toBe(submitted.quoteNumber);
    expect(offerBody.quote.state).toBe('submitted');
    expect(offerBody.quote.items[0].variationId).toBe(501);
    expect(offerBody.quote.accessSecretHash).toBeUndefined();
  });

  it('lets the guest decline the quote through the offers endpoint after submitting', async () => {
    registry.enable('quotes');

    const submitted = await (
      await submitRfq(submitRequest(submitPayload({ idempotencyKey: 'flow-key-2', email: 'guest2@example.ma' })))
    ).json();

    const rejectRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          reason: 'Budget non alloué',
        }),
      })
    );

    expect(rejectRes.status).toBe(200);
    const rejectBody = await rejectRes.json();
    expect(rejectBody.state).toBe('rejected');
    expect((await getRfqQuoteStore().getQuote(submitted.quoteId))?.state).toBe('rejected');
  });

  it('rejects a cross-owner replay of an idempotency key and never leaks the accessSecret', async () => {
    registry.enable('quotes');

    const firstRes = await submitRfq(
      submitRequest(submitPayload({ idempotencyKey: 'shared-key-abc', email: 'owner-a@example.ma' }))
    );
    expect(firstRes.status).toBe(201);
    const first = await firstRes.json();
    expect(first.accessSecret).toBeDefined();

    // A different caller presents the same Idempotency-Key.
    const secondRes = await submitRfq(
      submitRequest(
        submitPayload({
          idempotencyKey: 'shared-key-abc',
          email: 'owner-b@example.ma',
          name: 'Intruder',
        })
      )
    );

    expect(secondRes.status).toBe(409);
    const second = await secondRes.json();
    expect(second.success).toBe(false);
    expect(second.code).toBe('IDEMPOTENCY_OWNER_MISMATCH');
    expect(second.accessSecret).toBeUndefined();
    expect(second.quoteId).toBeUndefined();
    expect(JSON.stringify(second)).not.toContain(first.accessSecret);
    expect(JSON.stringify(second)).not.toContain(first.quoteId);
  });

  it('still replays to the original owner and returns no second quote', async () => {
    registry.enable('quotes');

    const body = submitPayload({ idempotencyKey: 'owner-repeat-key', email: 'owner-c@example.ma' });
    const first = await (await submitRfq(submitRequest(body))).json();
    const replayRes = await submitRfq(submitRequest(body));
    const replay = await replayRes.json();

    expect(replayRes.headers.get('x-idempotent-replay')).toBe('true');
    expect(replay.idempotent).toBe(true);
    expect(replay.quoteId).toBe(first.quoteId);
    expect(replay.accessSecret).toBe(first.accessSecret);
    expect(await getRfqQuoteStore().listQuoteIds()).toEqual([first.quoteId]);
  });

  it('exposes no data and writes nothing while the quotes addon is off', async () => {
    // Registered but NOT enabled.
    const submitRes = await submitRfq(
      submitRequest(submitPayload({ idempotencyKey: 'off-key', email: 'guest@example.ma' }))
    );
    expect(submitRes.status).toBe(404);
    expect((await submitRes.json()).code).toBe('ADDON_DISABLED');

    const offerRes = await getOffers(
      new Request('http://localhost:3000/api/rfq/offers?quoteId=quote_anything', {
        method: 'GET',
        headers: { 'x-quote-token': 'anything' },
      })
    );
    expect(offerRes.status).toBe(404);
    expect((await offerRes.json()).code).toBe('ADDON_DISABLED');

    // Invariant: a blocked route performs no persistence side effect.
    expect(await getRfqQuoteStore().listQuoteIds()).toEqual([]);
  });

  it('rejects acceptance of a stale or superseded offer revision with HTTP 409', async () => {
    registry.enable('quotes');

    const submitted = await (
      await submitRfq(submitRequest(submitPayload({ idempotencyKey: 'stale-rev-key', email: 'rev-guest@example.ma' })))
    ).json();

    const store = getRfqQuoteStore();
    const quote = await store.getQuote(submitted.quoteId);
    expect(quote).toBeDefined();

    const futureExpiry = new Date(Date.now() + 86400000).toISOString();
    quote!.state = 'offer_created';
    quote!.expiresAt = futureExpiry;
    quote!.currentRevisionId = 'rev_2';
    quote!.revisions = [
      {
        revisionId: 'rev_1',
        revisionNumber: 1,
        createdAt: new Date().toISOString(),
        createdBy: { staffId: 'staff-1', staffName: 'Staff' },
        expiresAt: futureExpiry,
        currency: 'MAD',
        lines: [],
        subtotalExclTax: 1000,
        totalTax: 200,
        totalInclTax: 1200,
        isCurrent: false,
      },
      {
        revisionId: 'rev_2',
        revisionNumber: 2,
        createdAt: new Date().toISOString(),
        createdBy: { staffId: 'staff-1', staffName: 'Staff' },
        expiresAt: futureExpiry,
        currency: 'MAD',
        lines: [],
        subtotalExclTax: 900,
        totalTax: 180,
        totalInclTax: 1080,
        isCurrent: true,
      },
    ];
    await store.putQuote(quote!);

    // Guest attempts to accept superseded rev_1
    const acceptStaleRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          revisionId: 'rev_1',
        }),
      })
    );

    expect(acceptStaleRes.status).toBe(409);
    const staleBody = await acceptStaleRes.json();
    expect(staleBody.code).toBe('STALE_REVISION');

    // Accepting current rev_2 succeeds
    const acceptCurrentRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          revisionId: 'rev_2',
        }),
      })
    );

    expect(acceptCurrentRes.status).toBe(200);
    const acceptBody = await acceptCurrentRes.json();
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.state).toBe('accepted');
    expect(acceptBody.acceptedRevisionId).toBe('rev_2');
  });

  it('rejects acceptance of an expired quote offer with HTTP 410', async () => {
    registry.enable('quotes');

    const submitted = await (
      await submitRfq(submitRequest(submitPayload({ idempotencyKey: 'expired-quote-key', email: 'expired-guest@example.ma' })))
    ).json();

    const store = getRfqQuoteStore();
    const quote = await store.getQuote(submitted.quoteId);
    expect(quote).toBeDefined();

    const pastExpiry = '2026-10-01T00:00:00Z';
    quote!.state = 'offer_created';
    quote!.expiresAt = pastExpiry;
    quote!.currentRevisionId = 'rev_1';
    quote!.revisions = [
      {
        revisionId: 'rev_1',
        revisionNumber: 1,
        createdAt: '2026-09-25T00:00:00Z',
        createdBy: { staffId: 'staff-1', staffName: 'Staff' },
        expiresAt: pastExpiry,
        currency: 'MAD',
        lines: [],
        subtotalExclTax: 500,
        totalTax: 100,
        totalInclTax: 600,
        isCurrent: true,
      },
    ];
    await store.putQuote(quote!);

    const acceptExpiredRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          revisionId: 'rev_1',
        }),
      })
    );

    expect(acceptExpiredRes.status).toBe(410);
    const expiredBody = await acceptExpiredRes.json();
    expect(expiredBody.code).toBe('QUOTE_EXPIRED');
  });

  it('enforces terminal state guards: accepted quote cannot be rejected or revised', async () => {
    registry.enable('quotes');

    const submitted = await (
      await submitRfq(submitRequest(submitPayload({ idempotencyKey: 'terminal-guard-key', email: 'term-guest@example.ma' })))
    ).json();

    const store = getRfqQuoteStore();
    const quote = await store.getQuote(submitted.quoteId);
    expect(quote).toBeDefined();

    quote!.state = 'accepted';
    await store.putQuote(quote!);

    // Attempt to reject accepted quote
    const rejectRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          reason: 'Try to reject after accepted',
        }),
      })
    );
    expect(rejectRes.status).toBe(400);

    // Attempt to revise accepted quote
    const reviseRes = await offerAction(
      new Request('http://localhost:3000/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'revise',
          quoteId: submitted.quoteId,
          accessSecret: submitted.accessSecret,
          notes: 'Try to revise after accepted',
        }),
      })
    );
    expect(reviseRes.status).toBe(400);
  });
});

