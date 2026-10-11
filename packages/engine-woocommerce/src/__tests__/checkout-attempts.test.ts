import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  CheckoutAttemptManager,
  InMemoryAttemptStore,
  JsonFileAttemptStore,
  globalAttemptManager,
} from '../checkout-attempts';
import {
  submitStoreCheckout,
  executeIdempotentCheckout,
  type StoreCheckoutInput,
} from '../checkout';
import { WooCommerceEngine } from '../client';

describe('Authoritative COD Checkout & Idempotency Protection (ECO-204)', () => {
  const originalFetch = global.fetch;

  beforeEach(async () => {
    vi.stubEnv('WC_STORE_API_URL', 'https://paraloca.local/wp-json/wc/store/v1');
    await globalAttemptManager.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('CheckoutAttemptManager', () => {
    it('creates new pending attempt on initial submission', async () => {
      const manager = new CheckoutAttemptManager();
      const res = await manager.startAttempt('att-1', 'cart-1');

      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.isNew).toBe(true);
      }
      expect((await manager.getAttempt('att-1'))?.status).toBe('PENDING');
    });

    it('rejects concurrent submission with pending status', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('att-2', 'cart-2');
      const second = await manager.startAttempt('att-2', 'cart-2');

      expect(second.ok).toBe(false);
      if (!second.ok) {
        expect(second.status).toBe('PENDING');
        expect(second.error).toContain('currently processing');
      }
    });

    it('returns idempotent confirmation for already completed attempt', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('att-3', 'cart-3');
      await manager.confirmAttempt('att-3', 1042, 'wc_order_abc123');

      const replay = await manager.startAttempt('att-3', 'cart-3');
      expect(replay.ok).toBe(true);
      if (replay.ok && !replay.isNew) {
        expect(replay.isNew).toBe(false);
        expect(replay.status).toBe('CONFIRMED');
        expect(replay.orderId).toBe(1042);
        expect(replay.orderKey).toBe('wc_order_abc123');
      }
    });

    it('allows retry after a failed attempt without permanent lockout', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('att-4', 'cart-4');
      await manager.failAttempt('att-4', 'Stock insufficient');

      const retry = await manager.startAttempt('att-4', 'cart-4');
      expect(retry.ok).toBe(true);
      if (retry.ok) {
        expect(retry.isNew).toBe(true);
      }
    });

    it('sweeps expired attempts past TTL', async () => {
      const manager = new CheckoutAttemptManager(10); // 10ms TTL
      await manager.startAttempt('att-expire', 'cart-expire');
      await manager.confirmAttempt('att-expire', 999);

      // Advance time past TTL
      await new Promise((r) => setTimeout(r, 20));

      const fresh = await manager.startAttempt('att-expire', 'cart-expire');
      expect(fresh.ok).toBe(true);
      if (fresh.ok) {
        expect(fresh.isNew).toBe(true);
      }
    });

    // Regression: the audited defect returned guest A's confirmed order and
    // order key to guest B when B reused A's attempt key.
    it('fails closed when a different owner reuses a confirmed attempt key', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('shared-key', 'cart-guest-a');
      await manager.confirmAttempt('shared-key', 1042, 'wc_order_secret_of_a', 'cart-guest-a');

      const hijack = await manager.startAttempt('shared-key', 'cart-guest-b');

      expect(hijack.ok).toBe(false);
      if (!hijack.ok) {
        expect(hijack.status).toBe('OWNER_MISMATCH');
      }
      // The other guest's order and order key must not leak in any form.
      expect(JSON.stringify(hijack)).not.toContain('1042');
      expect(JSON.stringify(hijack)).not.toContain('wc_order_secret_of_a');

      // Guest A's own record is untouched and still replayable by A.
      const ownerReplay = await manager.startAttempt('shared-key', 'cart-guest-a');
      expect(ownerReplay.ok).toBe(true);
      if (ownerReplay.ok && !ownerReplay.isNew) {
        expect(ownerReplay.orderId).toBe(1042);
      }
    });

    it('refuses to confirm an attempt owned by a different session', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('att-owned', 'cart-owner');

      await expect(
        manager.confirmAttempt('att-owned', 5555, 'wc_order_x', 'cart-intruder')
      ).rejects.toThrow(/different session/i);

      expect((await manager.getAttempt('att-owned'))?.status).toBe('PENDING');
    });

    it('keeps checkout and RFQ keys in separate namespaces', async () => {
      const store = new InMemoryAttemptStore();
      const checkout = new CheckoutAttemptManager(1000 * 60 * 60, store, 'checkout');
      const rfq = new CheckoutAttemptManager(1000 * 60 * 60, store, 'rfq');

      await checkout.startAttempt('same-key', 'cart-1');
      const rfqStart = await rfq.startAttempt('same-key', 'cart-1');

      expect(rfqStart.ok).toBe(true);
      if (rfqStart.ok) {
        expect(rfqStart.isNew).toBe(true);
      }
    });

    // Regression: process-local attempts meant a restart lost the confirmation
    // and a retry could create a duplicate order.
    it('replays a confirmation across a restart when the store is durable', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-attempts-'));
      const storePath = path.join(dir, 'attempts.json');
      try {
        const before = new CheckoutAttemptManager(1000 * 60 * 60, new JsonFileAttemptStore(storePath));
        await before.startAttempt('restart-key', 'cart-restart');
        await before.confirmAttempt('restart-key', 6060, 'wc_order_restart', 'cart-restart');

        // New process, same durable store.
        const after = new CheckoutAttemptManager(1000 * 60 * 60, new JsonFileAttemptStore(storePath));
        const replay = await after.startAttempt('restart-key', 'cart-restart');

        expect(replay.ok).toBe(true);
        if (replay.ok && !replay.isNew) {
          expect(replay.orderId).toBe(6060);
          expect(replay.orderKey).toBe('wc_order_restart');
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('does not serve a durable record to a different owner after restart', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-attempts-'));
      const storePath = path.join(dir, 'attempts.json');
      try {
        const before = new CheckoutAttemptManager(1000 * 60 * 60, new JsonFileAttemptStore(storePath));
        await before.startAttempt('restart-key-2', 'cart-guest-a');
        await before.confirmAttempt('restart-key-2', 7070, 'wc_order_a2', 'cart-guest-a');

        const after = new CheckoutAttemptManager(1000 * 60 * 60, new JsonFileAttemptStore(storePath));
        const hijack = await after.startAttempt('restart-key-2', 'cart-guest-b');

        expect(hijack.ok).toBe(false);
        if (!hijack.ok) expect(hijack.status).toBe('OWNER_MISMATCH');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('submitStoreCheckout', () => {
    const validCheckoutInput: StoreCheckoutInput = {
      billing_address: {
        first_name: 'Yassine',
        last_name: 'Bennani',
        address_1: 'Bd Mohammed V',
        city: 'Fes',
        country: 'MA',
        postcode: '30000',
        email: 'yassine@example.com',
        phone: '+212622334455',
      },
      shipping_address: {
        first_name: 'Yassine',
        last_name: 'Bennani',
        address_1: 'Bd Mohammed V',
        city: 'Fes',
        country: 'MA',
        postcode: '30000',
      },
      payment_method: 'cod',
    };

    it('creates server-confirmed COD order in WooCommerce Store API', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'Cart-Token': 'tok-cod' }),
        json: async () => ({
          order_id: 501,
          order_key: 'wc_order_cod501',
          status: 'processing',
          customer_id: 0,
          payment_result: {
            payment_status: 'success',
            payment_details: [],
          },
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await submitStoreCheckout('tok-cod', validCheckoutInput);

      expect(mockFetch.mock.calls.some((c) => (c[1] as RequestInit | undefined)?.method === 'POST')).toBe(true);
      const call = mockFetch.mock.calls.find((c) => (c[1] as RequestInit | undefined)?.method === 'POST')!;
      expect(call[0]).toContain('/checkout');
      const body = JSON.parse(call[1]?.body as string);
      expect(body.payment_method).toBe('cod');
      expect(body.billing_address.city).toBe('Fes');

      expect(result.ok).toBe(true);
      expect(result.orderId).toBe(501);
      expect(result.orderKey).toBe('wc_order_cod501');
      expect(result.status).toBe('processing');
      expect(result.customerId).toBe(0); // Guest customer ID
      expect(result.paymentStatus).toBe('success');
    });

    it('fails closed when Store API rejects checkout due to out of stock or gateway error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        headers: new Headers(),
        json: async () => ({
          code: 'woocommerce_rest_cart_item_out_of_stock',
          message: 'An item in your cart is no longer available.',
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      await expect(
        submitStoreCheckout('tok-err', validCheckoutInput)
      ).rejects.toThrow('Store API request failed [400]: An item in your cart is no longer available.');
    });
  });

  describe('executeIdempotentCheckout', () => {
    const checkoutInput: StoreCheckoutInput = {
      billing_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA' },
      shipping_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA' },
      payment_method: 'cod',
    };

    it('submits order once and reuses confirmation on duplicate submission', async () => {
      const manager = new CheckoutAttemptManager();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          order_id: 777,
          order_key: 'wc_order_777',
          status: 'processing',
          customer_id: 0,
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const first = await executeIdempotentCheckout('dup-key', 'cart-dup', checkoutInput, manager);
      expect(first.orderId).toBe(777);
      expect(mockFetch.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length).toBe(1);

      // Second submission with same key
      const second = await executeIdempotentCheckout('dup-key', 'cart-dup', checkoutInput, manager);
      expect(second.orderId).toBe(777);
      expect(mockFetch.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === 'POST').length).toBe(1);
    });

    it('rejects concurrent submission in progress with descriptive error', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('con-key', 'cart-con');

      await expect(
        executeIdempotentCheckout('con-key', 'cart-con', checkoutInput, manager)
      ).rejects.toThrow('currently processing');
    });
  });

  describe('WooCommerceEngine Integration', () => {
    it('submits checkout through engine method with attempt key', async () => {
      const engine = new WooCommerceEngine();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          order_id: 888,
          order_key: 'wc_order_888',
          status: 'processing',
          customer_id: 0,
        }),
      });
      vi.stubGlobal('fetch', mockFetch);

      const result = await engine.submitCheckout(
        'eng-cart',
        {
          billing_address: { country: 'MA' },
          shipping_address: { country: 'MA' },
          payment_method: 'cod',
        },
        'eng-attempt-1'
      );

      expect(result.orderId).toBe(888);
      expect(result.status).toBe('processing');
    });

    it('fulfills checkout submission via engine submitCheckout', async () => {
      const engine = new WooCommerceEngine();
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          order_id: 999,
          order_key: 'wc_order_999',
          status: 'processing',
          customer_id: 0,
        }),
      }));

      const res = await engine.submitCheckout('sess-cart', {
        billing_address: { email: 'test@example.com', first_name: 'T', last_name: 'E', address_1: 'Street', city: 'Casablanca', country: 'MA' },
        shipping_address: { email: 'test@example.com', first_name: 'T', last_name: 'E', address_1: 'Street', city: 'Casablanca', country: 'MA' },
        payment_method: 'cod',
      });

      expect(res.orderId).toBe(999);
      expect(res.orderKey).toBe('wc_order_999');
      expect(res.customerId).toBe(0); // Guest customer ID
      expect(res.status).toBe('processing');
    });
  });
});
