import { describe, it, expect } from 'vitest';
import {
  calculateOfferLineTotals,
  calculateOfferTotals,
  validateOfferInput,
  isRevisionCurrent,
  isOfferExpired,
} from './offer';
import type { RfqQuote } from './types';

describe('ECO-705: RFQ Offer Calculation & Revision Guards', () => {
  it('calculates line totals with exact tax precision', () => {
    const line = calculateOfferLineTotals({
      productId: 40,
      title: 'Zellige Tile (Box)',
      quantity: 5,
      unitPriceExclTax: 120.50,
      taxRate: 0.20,
    });

    expect(line.totalExclTax).toBe(602.50);
    expect(line.taxAmount).toBe(120.50);
    expect(line.totalInclTax).toBe(723.00);
  });

  it('aggregates multi-line offer totals correctly', () => {
    const lines = [
      calculateOfferLineTotals({ productId: 1, title: 'Item 1', quantity: 2, unitPriceExclTax: 100, taxRate: 0.2 }),
      calculateOfferLineTotals({ productId: 2, title: 'Item 2', quantity: 1, unitPriceExclTax: 50, taxRate: 0.1 }),
    ];

    const totals = calculateOfferTotals(lines);
    expect(totals.subtotalExclTax).toBe(250);
    expect(totals.totalTax).toBe(45);
    expect(totals.totalInclTax).toBe(295);
  });

  it('validates offer inputs and catches past expiration dates', () => {
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    const line = calculateOfferLineTotals({ productId: 1, title: 'Item', quantity: 1, unitPriceExclTax: 10, taxRate: 0.2 });

    const validRes = validateOfferInput({ lines: [line], expiresAt: futureDate });
    expect(validRes.valid).toBe(true);

    const invalidRes = validateOfferInput({ lines: [line], expiresAt: pastDate });
    expect(invalidRes.valid).toBe(false);
    expect(invalidRes.errors).toContain('Expiration date must be in the future');
  });

  it('checks revision current status and expiration accurately', () => {
    const mockQuote: RfqQuote = {
      id: 'q1',
      quoteNumber: 'DEV-001',
      state: 'offer_created',
      contact: { name: 'A', email: 'a@b.com' },
      consents: [],
      items: [],
      revisions: [],
      currentRevisionId: 'rev_2',
      accessSecretHash: 'hash',
      guestChallengeEmail: 'a@b.com',
      isContactVerified: true,
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    };

    expect(isRevisionCurrent(mockQuote, 'rev_2')).toBe(true);
    expect(isRevisionCurrent(mockQuote, 'rev_1')).toBe(false);

    const future = new Date(Date.now() + 100000).toISOString();
    const past = new Date(Date.now() - 100000).toISOString();

    expect(isOfferExpired(future)).toBe(false);
    expect(isOfferExpired(past)).toBe(true);
  });
});
