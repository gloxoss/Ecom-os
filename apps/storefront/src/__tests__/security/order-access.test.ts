import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createGuestOrderGrant,
  verifyGuestOrderGrant,
  verifyOrderOwnership,
} from '../../lib/commerce/order-access';
import { GET } from '../../app/api/orders/status/route';

describe('Guest Order Access & Ownership Proof (ECO-206)', () => {
  const sampleParams = {
    orderId: 1050,
    orderKey: 'wc_order_xyz789',
    email: 'client@example.com',
  };

  describe('createGuestOrderGrant & verifyGuestOrderGrant', () => {
    it('creates and verifies a valid opaque HMAC grant token', () => {
      const token = createGuestOrderGrant(sampleParams);
      expect(typeof token).toBe('string');
      expect(token).toContain('.');

      const result = verifyGuestOrderGrant(token);
      expect(result.valid).toBe(true);
      expect(result.grant?.orderId).toBe('1050');
      expect(result.grant?.orderKey).toBe('wc_order_xyz789');
      expect(result.grant?.email).toBe('client@example.com');
      expect(result.grant?.exp).toBeGreaterThan(Date.now());
    });

    it('rejects tampered grant tokens with invalid signature', () => {
      const token = createGuestOrderGrant(sampleParams);
      const [payload, sig] = token.split('.');
      const tampered = `${payload}.${sig?.slice(0, -3)}abc`;

      const result = verifyGuestOrderGrant(tampered);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('tampered_token');
    });

    it('rejects expired grant tokens', async () => {
      // 10ms TTL
      const token = createGuestOrderGrant({ ...sampleParams, ttlMs: 10 });
      await new Promise((r) => setTimeout(r, 20));

      const result = verifyGuestOrderGrant(token);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('expired_token');
    });

    it('rejects malformed tokens cleanly without throwing', () => {
      expect(verifyGuestOrderGrant('').valid).toBe(false);
      expect(verifyGuestOrderGrant('invalid-string').valid).toBe(false);
      expect(verifyGuestOrderGrant('part1.part2.part3').valid).toBe(false);
    });
  });

  describe('verifyOrderOwnership & Anti-Enumeration', () => {
    it('allows access to the matching order ID', () => {
      const token = createGuestOrderGrant(sampleParams);
      expect(verifyOrderOwnership({ token, orderId: 1050 })).toBe(true);
      expect(verifyOrderOwnership({ token, orderId: '1050' })).toBe(true);
    });

    it('prevents public ID enumeration: rejects valid token used against another order ID', () => {
      const token = createGuestOrderGrant(sampleParams);
      // Attacker guesses order ID 1051 using victim's or their own token
      expect(verifyOrderOwnership({ token, orderId: 1051 })).toBe(false);
      expect(verifyOrderOwnership({ token, orderId: 9999 })).toBe(false);
    });

    it('validates optional challenge email correctly', () => {
      const token = createGuestOrderGrant(sampleParams);
      // Exact match
      expect(verifyOrderOwnership({ token, orderId: 1050, challengeEmail: 'client@example.com' })).toBe(true);
      // Case-insensitive & trimmed match
      expect(verifyOrderOwnership({ token, orderId: 1050, challengeEmail: '  CLIENT@EXAMPLE.COM ' })).toBe(true);
      // Wrong email
      expect(verifyOrderOwnership({ token, orderId: 1050, challengeEmail: 'wrong@example.com' })).toBe(false);
    });
  });

  describe('GET /api/orders/status endpoint', () => {
    it('rejects requests with missing parameters with 400 and private no-store headers', async () => {
      const req = new NextRequest('http://localhost:3000/api/orders/status');
      const res = await GET(req);

      expect(res.status).toBe(400);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const body = await res.json();
      expect(body.ok).toBe(false);
    });

    it('rejects guessed order IDs with 403 Forbidden', async () => {
      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest(`http://localhost:3000/api/orders/status?orderId=9999&token=${token}`);
      const res = await GET(req);

      expect(res.status).toBe(403);
      expect(res.headers.get('Cache-Control')).toContain('private');
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).toContain('Unauthorized');
    });

    it('serves confirmed order status for verified ownership proof', async () => {
      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest(`http://localhost:3000/api/orders/status?orderId=1050&token=${token}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.orderId).toBe('1050');
      expect(body.orderKey).toBe('wc_order_xyz789');
      expect(body.status).toBe('processing');
    });
  });
});

