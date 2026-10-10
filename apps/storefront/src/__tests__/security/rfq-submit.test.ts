import { describe, it, expect, beforeEach } from 'vitest';
import { AddonRegistry } from '@ecom-os/engine';
import { setStorefrontRegistryForTesting } from '../../lib/addon-capabilities';
import { POST, clearRfqStoresForTesting } from '../../app/api/rfq/route';

describe('RFQ Idempotent Submission API & Security Barrier (ECO-703)', () => {
  let registry: AddonRegistry;

  const validPayload = {
    idempotencyKey: 'test-idemp-uuid-999',
    contact: {
      name: 'Salma Tazi',
      email: 'salma@riad-design.ma',
      companyName: 'Riad Design Studio',
      taxId: 'ICE00281938',
    },
    items: [
      {
        productId: 50,
        variationId: 501,
        title: 'Handcrafted Brass Sconce',
        quantity: 4,
        customerNotes: 'Matte gold patina',
      },
    ],
    consents: [
      { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T12:00:00Z' },
      { consentId: 'privacy_consent', grantedAt: '2026-10-10T12:00:00Z' },
    ],
  };

  beforeEach(() => {
    clearRfqStoresForTesting();
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: {
        provided: ['quotes', 'submit_quote'],
      },
    });
    setStorefrontRegistryForTesting(registry);
  });

  it('prohibits RFQ submission with 404 when addon is disabled', async () => {
    // Addon is registered but NOT enabled
    const req = new Request('http://localhost:3000/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.code).toBe('ADDON_DISABLED');
  });

  it('accepts and registers valid guest RFQ when addon is enabled', async () => {
    registry.enable('quotes');

    const req = new Request('http://localhost:3000/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(res.headers.get('cache-control')).toContain('no-store');

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.quoteId).toBeDefined();
    expect(body.quoteNumber).toMatch(/^DEV-\d{4}-\d+/);
    expect(body.accessSecret).toBeDefined();
    expect(body.state).toBe('submitted');
  });

  it('guarantees idempotency: replaying same key returns cached quote without duplicate creation', async () => {
    registry.enable('quotes');

    const req1 = new Request('http://localhost:3000/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res1 = await POST(req1);
    const body1 = await res1.json();

    // Replay identical request with identical idempotencyKey
    const req2 = new Request('http://localhost:3000/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const res2 = await POST(req2);
    expect(res2.headers.get('x-idempotent-replay')).toBe('true');
    const body2 = await res2.json();

    expect(body2.idempotent).toBe(true);
    expect(body2.quoteId).toBe(body1.quoteId);
    expect(body2.quoteNumber).toBe(body1.quoteNumber);
    expect(body2.accessSecret).toBe(body1.accessSecret);
  });

  it('rejects submissions with missing fields with HTTP 400 and clear errors', async () => {
    registry.enable('quotes');

    const invalidReq = new Request('http://localhost:3000/api/rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idempotencyKey: 'bad-req',
        contact: { name: '', email: 'not-valid' },
        items: [],
        consents: [],
      }),
    });

    const res = await POST(invalidReq);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.errors.length).toBeGreaterThan(0);
  });
});
