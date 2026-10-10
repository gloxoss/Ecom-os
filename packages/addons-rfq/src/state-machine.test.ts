import { describe, it, expect } from 'vitest';
import {
  transition,
  canTransition,
  IllegalTransitionError,
  UnauthorizedActorError,
  StaleRevisionError,
  ExpiredQuoteError,
} from './state-machine';
import type { RfqQuote, Actor } from './types';

function createMockQuote(overrides: Partial<RfqQuote> = {}): RfqQuote {
  return {
    id: 'quote-100',
    quoteNumber: 'DEV-2026-0001',
    state: 'draft',
    contact: {
      name: 'Amine Bennani',
      email: 'amine@example.com',
      companyName: 'Bennani Artisans SARL',
      taxId: 'ICE-001928374',
    },
    consents: [
      { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
      { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
    ],
    items: [
      {
        productId: 101,
        title: 'Artisan Brass Chandelier',
        quantity: 5,
        customerNotes: 'Custom patina finish',
      },
    ],
    revisions: [],
    accessSecretHash: 'guest-secret-hash-xyz',
    guestChallengeEmail: 'amine@example.com',
    isContactVerified: false,
    createdAt: '2026-10-10T12:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z',
    ...overrides,
  };
}

describe('ECO-701: RFQ State Machine and Permission Model', () => {
  const guestActor: Actor = { role: 'guest', id: 'guest-secret-hash-xyz', email: 'amine@example.com' };
  const forgedGuestActor: Actor = { role: 'guest', id: 'imposter-hash', email: 'intruder@example.com' };
  const operatorActor: Actor = { role: 'operator', id: 'staff-42', email: 'manager@store.com' };
  const adminActor: Actor = { role: 'administrator', id: 'admin-1', email: 'admin@store.com' };
  const systemActor: Actor = { role: 'system', id: 'cron-worker' };

  it('canTransition correctly verifies valid next states and roles', () => {
    expect(canTransition('draft', 'submitted', guestActor)).toBe(true);
    expect(canTransition('draft', 'offer_created', guestActor)).toBe(false);
    expect(canTransition('draft', 'offer_created', operatorActor)).toBe(false);
    expect(canTransition('submitted', 'offer_created', operatorActor)).toBe(true);
    expect(canTransition('offer_created', 'accepted', guestActor)).toBe(true);
    expect(canTransition('offer_created', 'accepted', operatorActor)).toBe(false);
  });

  it('progresses cleanly through full quotation lifecycle', () => {
    // 1. Submit quote
    let quote = createMockQuote();
    quote = transition(quote, 'submitted', guestActor);
    expect(quote.state).toBe('submitted');

    // 2. Verify contact
    quote = transition(quote, 'verified', operatorActor);
    expect(quote.state).toBe('verified');
    expect(quote.isContactVerified).toBe(true);

    // 3. Create initial offer (rev_1)
    const futureExpiry = new Date(Date.now() + 86400000 * 14).toISOString();
    quote = transition(quote, 'offer_created', operatorActor, {
      expiresAt: futureExpiry,
      currency: 'MAD',
      lines: [
        {
          productId: 101,
          title: 'Artisan Brass Chandelier',
          quantity: 5,
          unitPriceExclTax: 1200,
          taxRate: 0.20,
          taxAmount: 1200,
          totalExclTax: 6000,
          totalInclTax: 7200,
        },
      ],
      termsAndConditions: 'Payment on delivery, lead time 10 days',
    });

    expect(quote.state).toBe('offer_created');
    expect(quote.revisions.length).toBe(1);
    expect(quote.currentRevisionId).toBe('rev_1');
    expect(quote.revisions[0]?.totalInclTax).toBe(7200);

    // 4. Revise offer with negotiated discount (rev_2)
    quote = transition(quote, 'revised', operatorActor, {
      expiresAt: futureExpiry,
      currency: 'MAD',
      lines: [
        {
          productId: 101,
          title: 'Artisan Brass Chandelier',
          quantity: 5,
          unitPriceExclTax: 1000,
          taxRate: 0.20,
          taxAmount: 1000,
          totalExclTax: 5000,
          totalInclTax: 6000,
        },
      ],
      termsAndConditions: 'Volume discount applied',
    });

    expect(quote.state).toBe('revised');
    expect(quote.revisions.length).toBe(2);
    expect(quote.currentRevisionId).toBe('rev_2');
    expect(quote.revisions[0]?.isCurrent).toBe(false);
    expect(quote.revisions[1]?.isCurrent).toBe(true);
    expect(quote.revisions[1]?.totalInclTax).toBe(6000);

    // 5. Guest accepts active revision
    quote = transition(quote, 'accepted', guestActor, {
      revisionId: 'rev_2',
    });
    expect(quote.state).toBe('accepted');

    // 6. Operator converts accepted quote to WooCommerce order
    quote = transition(quote, 'converted', operatorActor, {
      orderId: 9876,
    });
    expect(quote.state).toBe('converted');
    expect(quote.convertedOrderId).toBe(9876);
  });

  it('rejects stale or superseded revision acceptance', () => {
    let quote = createMockQuote({ state: 'offer_created' });
    const futureExpiry = new Date(Date.now() + 86400000 * 14).toISOString();

    // Staff creates rev_1
    quote = transition(quote, 'revised', operatorActor, {
      expiresAt: futureExpiry,
      lines: [{ productId: 101, title: 'Item', quantity: 1, unitPriceExclTax: 100, taxRate: 0.2, taxAmount: 20, totalExclTax: 100, totalInclTax: 120 }],
    });
    // Staff creates rev_2
    quote = transition(quote, 'revised', operatorActor, {
      expiresAt: futureExpiry,
      lines: [{ productId: 101, title: 'Item', quantity: 1, unitPriceExclTax: 110, taxRate: 0.2, taxAmount: 22, totalExclTax: 110, totalInclTax: 132 }],
    });

    expect(quote.currentRevisionId).toBe('rev_2');

    // Guest attempts to accept the older rev_1
    expect(() => {
      transition(quote, 'accepted', guestActor, {
        revisionId: 'rev_1',
      });
    }).toThrowError(StaleRevisionError);
  });

  it('rejects unowned guest access (forged token/hash)', () => {
    const futureExpiry = new Date(Date.now() + 86400000 * 14).toISOString();
    let quote = createMockQuote({
      state: 'offer_created',
      currentRevisionId: 'rev_1',
      expiresAt: futureExpiry,
    });

    expect(() => {
      transition(quote, 'accepted', forgedGuestActor, {
        revisionId: 'rev_1',
      });
    }).toThrowError(UnauthorizedActorError);
  });

  it('rejects guest attempt to create or modify offers', () => {
    const quote = createMockQuote({ state: 'submitted' });
    const futureExpiry = new Date(Date.now() + 86400000 * 14).toISOString();

    expect(() => {
      transition(quote, 'offer_created', guestActor, {
        expiresAt: futureExpiry,
        lines: [],
      });
    }).toThrowError(UnauthorizedActorError);
  });

  it('rejects acceptance of expired quote offer', () => {
    const pastExpiry = '2026-10-01T00:00:00Z';
    const currentTime = '2026-10-10T12:00:00Z';
    const quote = createMockQuote({
      state: 'offer_created',
      currentRevisionId: 'rev_1',
      expiresAt: pastExpiry,
    });

    expect(() => {
      transition(quote, 'accepted', guestActor, {
        revisionId: 'rev_1',
        currentTime,
      });
    }).toThrowError(ExpiredQuoteError);
  });

  it('rejects illegal skipped transitions', () => {
    const quote = createMockQuote({ state: 'draft' });

    expect(() => {
      transition(quote, 'accepted', guestActor, { revisionId: 'rev_1' });
    }).toThrowError(IllegalTransitionError);

    expect(() => {
      transition(quote, 'converted', operatorActor, { orderId: 123 });
    }).toThrowError(IllegalTransitionError);
  });

  it('rejects submission of empty quote basket', () => {
    const emptyQuote = createMockQuote({ items: [] });
    expect(() => {
      transition(emptyQuote, 'submitted', guestActor);
    }).toThrowError(IllegalTransitionError);
  });
});
