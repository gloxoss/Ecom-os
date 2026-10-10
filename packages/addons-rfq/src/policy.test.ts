import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RFQ_POLICY,
  validateQuoteSubmission,
  calculateExpirationDate,
  evaluateStockReservationPolicy,
  evaluateDataRetention,
} from './policy';
import type { RfqQuote } from './types';

describe('ECO-701: RFQ Policy, Validation, Stock & Retention Rules', () => {
  it('validates compliant guest quote submission without customer account', () => {
    const result = validateQuoteSubmission({
      items: [
        { productId: 'prod_1', title: 'Copper Teapot', quantity: 10 },
      ],
      contact: {
        name: 'Fatima Zahra',
        email: 'fatima@maroc-craft.ma',
        companyName: 'Maroc Craft SARL',
      },
      consents: [
        { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
        { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
      ],
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects quote submission with missing or invalid fields', () => {
    const invalidResult = validateQuoteSubmission({
      items: [],
      contact: { name: '', email: 'invalid-email' },
      consents: [],
    });

    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors).toEqual(
      expect.arrayContaining([
        'Quote basket must contain at least one item',
        'Contact name is required',
        'A valid contact email address is required',
        'Required consent "terms_and_conditions" was not granted',
        'Required consent "privacy_consent" was not granted',
      ])
    );
  });

  it('enforces maximum per-line quantity and line item limits', () => {
    const result = validateQuoteSubmission(
      {
        items: [
          { productId: 'prod_1', title: 'Wholesale Item', quantity: 999999 },
        ],
        contact: { name: 'Wholesaler', email: 'buyer@corp.com' },
        consents: [
          { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
          { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
        ],
      },
      {
        ...DEFAULT_RFQ_POLICY,
        maxQuantityPerLine: 500,
      }
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('exceeds maximum per-line limit of 500');
  });

  it('calculates expiration date based on configured policy days', () => {
    const baseDate = new Date('2026-10-10T12:00:00Z');
    const expiry = calculateExpirationDate(baseDate, {
      ...DEFAULT_RFQ_POLICY,
      defaultExpirationDays: 15,
    });

    expect(expiry.toISOString()).toBe('2026-10-25T12:00:00.000Z');
  });

  it('guarantees architectural invariant: no automatic stock reservation by default', () => {
    const mockQuote: RfqQuote = {
      id: 'quote-1',
      quoteNumber: 'DEV-001',
      state: 'accepted', // Even in accepted state!
      contact: { name: 'Client', email: 'client@domain.com' },
      consents: [],
      items: [{ productId: 10, title: 'Item', quantity: 2 }],
      revisions: [],
      accessSecretHash: 'hash',
      guestChallengeEmail: 'client@domain.com',
      isContactVerified: true,
      createdAt: '2026-10-10T12:00:00Z',
      updatedAt: '2026-10-10T12:00:00Z',
    };

    const instruction = evaluateStockReservationPolicy(mockQuote, DEFAULT_RFQ_POLICY);
    expect(instruction.shouldReserve).toBe(false);
    expect(instruction.reservationMode).toBe('none');
    expect(instruction.reason).toContain('Policy specifies zero stock reservation');
  });

  it('supports explicit on_acceptance stock reservation when configured', () => {
    const acceptedQuote: RfqQuote = {
      id: 'quote-2',
      quoteNumber: 'DEV-002',
      state: 'accepted',
      contact: { name: 'Client', email: 'client@domain.com' },
      consents: [],
      items: [],
      revisions: [],
      accessSecretHash: 'hash',
      guestChallengeEmail: 'client@domain.com',
      isContactVerified: true,
      createdAt: '2026-10-10T12:00:00Z',
      updatedAt: '2026-10-10T12:00:00Z',
    };

    const submittedQuote = { ...acceptedQuote, state: 'submitted' as const };

    const policyWithReservation = { ...DEFAULT_RFQ_POLICY, stockReservation: 'on_acceptance' as const };

    expect(evaluateStockReservationPolicy(submittedQuote, policyWithReservation).shouldReserve).toBe(false);
    expect(evaluateStockReservationPolicy(acceptedQuote, policyWithReservation).shouldReserve).toBe(true);
  });

  it('correctly evaluates data retention and GDPR purge eligibility', () => {
    const quoteBase: RfqQuote = {
      id: 'quote-3',
      quoteNumber: 'DEV-003',
      state: 'expired',
      contact: { name: 'Old Client', email: 'old@client.com' },
      consents: [],
      items: [],
      revisions: [],
      accessSecretHash: 'hash',
      guestChallengeEmail: 'old@client.com',
      isContactVerified: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    };

    // Current date is 2026-10-10 (more than 365 days later)
    const purgeResult = evaluateDataRetention(quoteBase, new Date('2026-10-10T00:00:00Z'), DEFAULT_RFQ_POLICY);
    expect(purgeResult.isEligibleForPurge).toBe(true);
    expect(purgeResult.reason).toContain('exceeded data retention period');

    // Converted quote should not be purged
    const convertedQuote = { ...quoteBase, state: 'converted' as const };
    const convertedPurgeResult = evaluateDataRetention(convertedQuote, new Date('2026-10-10T00:00:00Z'), DEFAULT_RFQ_POLICY);
    expect(convertedPurgeResult.isEligibleForPurge).toBe(false);
  });
});
