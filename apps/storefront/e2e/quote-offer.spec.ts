import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { AddonRegistry } from '@ecom-os/engine';
import {
  setStorefrontRegistryForTesting,
  isAddonActive,
} from '../src/lib/addon-capabilities';
import {
  POST,
  GET,
  setOfferQuoteForTesting,
  clearOfferQuotesForTesting,
} from '../src/app/api/rfq/offers/route';
import type { RfqQuote, OfferRevision } from '../../../packages/addons-rfq/src/index';

describe('Storefront RFQ Private Revisioned Offers Contract (ECO-705)', () => {
  let registry: AddonRegistry;

  const validSecret = 'sec_guest_test_token_1234567890';
  const validSecretHash = crypto.createHash('sha256').update(validSecret).digest('hex');

  const baseQuote: RfqQuote = {
    id: 'quote_test_705',
    quoteNumber: 'DEV-2026-7001',
    state: 'offer_created',
    customerName: 'Yassine Alami',
    customerEmail: 'yassine@example.ma',
    companyName: 'Atelier Artisanat Fes',
    taxId: 'ICE00123456',
    contact: {
      name: 'Yassine Alami',
      email: 'yassine@example.ma',
      companyName: 'Atelier Artisanat Fes',
      taxId: 'ICE00123456',
    },
    consents: [
      { consentId: 'terms', grantedAt: '2026-10-10T00:00:00Z' },
    ],
    items: [
      { productId: 10, title: 'Zellige Tile (Box)', quantity: 10 },
    ],
    currentRevisionId: 'rev_2',
    expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days in future
    accessSecretHash: validSecretHash,
    guestChallengeEmail: 'yassine@example.ma',
    isContactVerified: true,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
    revisions: [
      {
        revisionId: 'rev_1',
        revisionNumber: 1,
        createdBy: {
          staffId: 'staff_1',
          staffName: 'Operator Karim',
        },
        lines: [
          {
            productId: 10,
            title: 'Zellige Tile (Box)',
            quantity: 10,
            unitPriceExclTax: 150,
            taxRate: 0.2,
            taxAmount: 300,
            totalExclTax: 1500,
            totalInclTax: 1800,
          },
        ],
        subtotalExclTax: 1500,
        totalTax: 300,
        totalInclTax: 1800,
        currency: 'MAD',
        expiresAt: '2026-10-12T00:00:00Z',
        isCurrent: false,
        createdAt: '2026-10-10T10:00:00Z',
      },
      {
        revisionId: 'rev_2',
        revisionNumber: 2,
        createdBy: {
          staffId: 'staff_1',
          staffName: 'Operator Karim',
        },
        lines: [
          {
            productId: 10,
            title: 'Zellige Tile (Box) - Remise de volume',
            quantity: 10,
            unitPriceExclTax: 130,
            taxRate: 0.2,
            taxAmount: 260,
            totalExclTax: 1300,
            totalInclTax: 1560,
          },
        ],
        subtotalExclTax: 1300,
        totalTax: 260,
        totalInclTax: 1560,
        currency: 'MAD',
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        isCurrent: true,
        createdAt: '2026-10-10T11:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    clearOfferQuotesForTesting();
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: { provided: ['quotes'] },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('denies /api/rfq/offers when quotes addon is disabled in registry', async () => {
    assert.equal(isAddonActive('quotes'), false);

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'accept', quoteId: 'quote_test_705', accessSecret: validSecret }),
    });

    const res = await POST(req);
    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.code, 'ADDON_DISABLED');
  });

  it('allows verified guest to view offer details and scrubs accessSecretHash', async () => {
    registry.enable('quotes');
    setOfferQuoteForTesting(JSON.parse(JSON.stringify(baseQuote)));

    const req = new Request('http://localhost:3000/api/rfq/offers?quoteId=quote_test_705', {
      method: 'GET',
      headers: {
        'x-quote-token': validSecret,
      },
    });

    const res = await GET(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.quote.id, 'quote_test_705');
    assert.equal(data.quote.accessSecretHash, undefined, 'Must not expose accessSecretHash to client');
  });

  it('rejects wrong or tampered token with HTTP 403 FORBIDDEN', async () => {
    registry.enable('quotes');
    setOfferQuoteForTesting(JSON.parse(JSON.stringify(baseQuote)));

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        quoteId: 'quote_test_705',
        accessSecret: 'invalid_secret_attack',
        revisionId: 'rev_2',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.code, 'FORBIDDEN');
  });

  it('rejects acceptance of stale / superseded revision with HTTP 409 STALE_REVISION', async () => {
    registry.enable('quotes');
    setOfferQuoteForTesting(JSON.parse(JSON.stringify(baseQuote)));

    // Guest attempts to accept rev_1, but current is rev_2
    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        quoteId: 'quote_test_705',
        accessSecret: validSecret,
        revisionId: 'rev_1',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 409);
    const data = await res.json();
    assert.equal(data.code, 'STALE_REVISION');
  });

  it('rejects acceptance of expired quotation offer with HTTP 410 QUOTE_EXPIRED', async () => {
    registry.enable('quotes');
    const expiredQuote = JSON.parse(JSON.stringify(baseQuote));
    expiredQuote.expiresAt = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    setOfferQuoteForTesting(expiredQuote);

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        quoteId: 'quote_test_705',
        accessSecret: validSecret,
        revisionId: 'rev_2',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 410);
    const data = await res.json();
    assert.equal(data.code, 'QUOTE_EXPIRED');
  });

  it('successfully transitions offer to accepted when verified guest accepts current revision', async () => {
    registry.enable('quotes');
    const activeQuote = JSON.parse(JSON.stringify(baseQuote));
    setOfferQuoteForTesting(activeQuote);

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'accept',
        quoteId: 'quote_test_705',
        accessSecret: validSecret,
        revisionId: 'rev_2',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.state, 'accepted');
    assert.equal(data.acceptedRevisionId, 'rev_2');
    assert.equal(activeQuote.state, 'accepted');
  });

  it('allows verified guest to decline offer and transitions state to rejected', async () => {
    registry.enable('quotes');
    const activeQuote = JSON.parse(JSON.stringify(baseQuote));
    setOfferQuoteForTesting(activeQuote);

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'reject',
        quoteId: 'quote_test_705',
        accessSecret: validSecret,
        reason: 'Budget non alloué pour ce trimestre',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.state, 'rejected');
    assert.equal(activeQuote.state, 'rejected');
  });

  it('allows verified guest to request revision and transitions state to revision_requested', async () => {
    registry.enable('quotes');
    const activeQuote = JSON.parse(JSON.stringify(baseQuote));
    setOfferQuoteForTesting(activeQuote);

    const req = new Request('http://localhost:3000/api/rfq/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'revise',
        quoteId: 'quote_test_705',
        accessSecret: validSecret,
        notes: 'Pouvons-nous passer à 20 cartons pour une remise supplémentaire ?',
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.state, 'revision_requested');
    assert.equal(activeQuote.state, 'revision_requested');
  });
});
