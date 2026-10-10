import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  createGuestOrderGrant,
  verifyGuestOrderGrant,
  verifyOrderOwnership,
  getOrderAccessSecret,
} from '../../lib/commerce/order-access';
import { GET } from '../../app/api/orders/status/route';
import { setEngine, FakeEngine } from '@ecom-os/engine';

describe('Guest Order Access & Ownership Proof (ECO-206 Hardened)', () => {
  const sampleParams = {
    orderId: 1050,
    orderKey: 'wc_order_xyz789',
    email: 'client@example.com',
  };

  beforeEach(() => {
    setEngine(new FakeEngine());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('Secret Configuration & Fail-Closed Behavior', () => {
    it('uses configured ORDER_ACCESS_SECRET', () => {
      vi.stubEnv('ORDER_ACCESS_SECRET', 'custom-production-secret-1234567890');
      expect(getOrderAccessSecret()).toBe('custom-production-secret-1234567890');
    });

    it('fails closed in production if ORDER_ACCESS_SECRET and ECOM_OS_ENCRYPTION_KEY are missing', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('ORDER_ACCESS_SECRET', '');
      vi.stubEnv('ECOM_OS_ENCRYPTION_KEY', '');

      expect(() => getOrderAccessSecret()).toThrow('ORDER_ACCESS_SECRET is required');
      expect(() => createGuestOrderGrant(sampleParams)).toThrow('ORDER_ACCESS_SECRET is required');
      expect(verifyGuestOrderGrant('abc.def').valid).toBe(false);
    });
  });

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
      const token = createGuestOrderGrant({ ...sampleParams, ttlMs: 10 });
      await new Promise((r) => setTimeout(r, 25));

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
      expect(verifyOrderOwnership({ token, orderId: 1051 })).toBe(false);
      expect(verifyOrderOwnership({ token, orderId: 9999 })).toBe(false);
    });

    it('validates optional challenge email correctly', () => {
      const token = createGuestOrderGrant(sampleParams);
      expect(verifyOrderOwnership({ token, orderId: 1050, challengeEmail: 'client@example.com' })).toBe(true);
      expect(verifyOrderOwnership({ token, orderId: 1050, challengeEmail: '  CLIENT@EXAMPLE.COM ' })).toBe(true);
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

    it('rejects guessed order IDs with 403 Forbidden without leaking existence', async () => {
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

    it('rejects requests with mismatched challenge email with 403', async () => {
      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest(`http://localhost:3000/api/orders/status?orderId=1050&token=${token}&email=attacker@evil.test`);
      const res = await GET(req);

      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.ok).toBe(false);
    });

    it('accepts grant token via x-order-token header and does not echo orderKey in response', async () => {
      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest('http://localhost:3000/api/orders/status?orderId=1050', {
        headers: {
          'x-order-token': token,
        },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      expect(res.headers.get('Cache-Control')).toContain('no-store');
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.orderId).toBe('1050');
      expect(body.status).toBe('processing');
      // Crucial: orderKey must not be echoed back
      expect(body.orderKey).toBeUndefined();
    });

    it('accepts grant token via Authorization: Bearer header', async () => {
      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest('http://localhost:3000/api/orders/status?orderId=1050', {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.status).toBe('processing');
    });

    it('queries genuine engine order status and handles not found (404)', async () => {
      class MockEngine extends FakeEngine {
        override async getGuestOrder(id: string, key: string) {
          if (id === '1050' && key === 'wc_order_xyz789') {
            return {
              id: '1050',
              status: 'completed',
              total: { amount_minor: 9900, currency: 'MAD' },
              items: [],
              customer: { id: '0', email: 'client@example.com', firstName: 'C', lastName: 'E' },
            };
          }
          return null;
        }
      }

      setEngine(new MockEngine());

      const token = createGuestOrderGrant(sampleParams);
      const req = new NextRequest(`http://localhost:3000/api/orders/status?orderId=1050&token=${token}`);
      const res = await GET(req);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.status).toBe('completed');
      expect(body.currency).toBe('MAD');
      expect(body.total_minor).toBe(9900);
      expect(body.orderKey).toBeUndefined();

      // Test order not found in backend
      const notFoundToken = createGuestOrderGrant({ orderId: 8888, orderKey: 'wrong_key', email: 'test@example.com' });
      const notFoundReq = new NextRequest(`http://localhost:3000/api/orders/status?orderId=8888&token=${notFoundToken}`);
      const notFoundRes = await GET(notFoundReq);
      expect(notFoundRes.status).toBe(404);
    });
  });
});
