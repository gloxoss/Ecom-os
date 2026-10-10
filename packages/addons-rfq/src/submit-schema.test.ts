import { describe, it, expect } from 'vitest';
import { validateRfqSubmitInput } from './submit-schema';
import { DEFAULT_RFQ_POLICY } from './policy';

describe('ECO-703: RFQ Submission Schema and Input Validation', () => {
  const validPayload = {
    idempotencyKey: 'idemp_key_12345',
    contact: {
      name: 'Youssef El Mansouri',
      email: 'youssef@riad-art.ma',
      phone: '+212612345678',
      companyName: 'Riad Art & Design SARL',
      taxId: 'ICE001889922',
    },
    items: [
      {
        productId: 101,
        variationId: 1011,
        title: 'Hand-carved Cedar Door',
        quantity: 2,
        customerNotes: 'Custom height 240cm',
      },
    ],
    consents: [
      { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
      { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
    ],
    notes: 'Please quote delivery to Marrakech medina',
  };

  it('validates and sanitizes a complete guest RFQ submission', () => {
    const result = validateRfqSubmitInput(validPayload);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.sanitized?.contact.email).toBe('youssef@riad-art.ma');
    expect(result.sanitized?.items[0]?.quantity).toBe(2);
  });

  it('rejects missing or empty idempotencyKey', () => {
    const withoutKey = { ...validPayload, idempotencyKey: '   ' };
    const result = validateRfqSubmitInput(withoutKey);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('A non-empty idempotencyKey is required for duplicate-safe submission');
  });

  it('rejects invalid or missing contact information', () => {
    const invalidEmail = {
      ...validPayload,
      contact: { name: '', email: 'not-an-email' },
    };
    const result = validateRfqSubmitInput(invalidEmail);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Contact name is required');
    expect(result.errors).toContain('A valid contact email address is required');
  });

  it('rejects empty quote items array', () => {
    const emptyItems = { ...validPayload, items: [] };
    const result = validateRfqSubmitInput(emptyItems);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Quote basket must contain at least one item');
  });

  it('rejects non-positive quantities and enforces limits', () => {
    const invalidQuantity = {
      ...validPayload,
      items: [{ productId: 50, title: 'Item', quantity: -1 }],
    };
    const result = validateRfqSubmitInput(invalidQuantity);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('must have a positive quantity');
  });

  it('rejects missing mandatory legal consent declarations', () => {
    const missingConsent = {
      ...validPayload,
      consents: [{ consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' }],
    };
    const result = validateRfqSubmitInput(missingConsent);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Required legal consent "privacy_consent" was not granted');
  });
});
