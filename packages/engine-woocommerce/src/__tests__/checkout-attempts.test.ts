import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  CheckoutAttemptManager,
  InMemoryAttemptStore,
  JsonFileAttemptStore,
  FileClaimAttemptStore,
  CorruptAttemptStoreError,
  attemptPayloadHash,
  createDefaultAttemptStore,
  globalAttemptManager,
} from '../checkout-attempts';
import {
  submitStoreCheckout,
  executeIdempotentCheckout,
  correlationMarker,
  findOrderByAttemptCorrelation,
  type StoreCheckoutInput,
} from '../checkout';
import { WooCommerceEngine } from '../client';

const execFileAsync = promisify(execFile);

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

    // Sweep policy (ECO-1102): pending attempts have an unknown outcome and
    // must never be swept — sweeping one would let a retry duplicate an order
    // WooCommerce may already own. Failed attempts are retryable anyway, and
    // confirmed attempts persist for a long replay window.
    it('never sweeps pending attempts but sweeps failed ones past TTL', async () => {
      const manager = new CheckoutAttemptManager(10); // 10ms TTL
      await manager.startAttempt('att-pending', 'cart-1');
      await manager.startAttempt('att-fail', 'cart-2');
      await manager.failAttempt('att-fail', 'boom', 'cart-2');

      // Advance time past TTL, then trigger a sweep with another claim.
      await new Promise((r) => setTimeout(r, 20));
      await manager.startAttempt('att-other', 'cart-3');

      expect((await manager.getAttempt('att-pending'))?.status).toBe('PENDING');
      expect(await manager.getAttempt('att-fail')).toBeUndefined();
    });

    it('retains confirmed attempts past the short TTL for idempotent replay', async () => {
      const manager = new CheckoutAttemptManager(10); // 10ms TTL
      await manager.startAttempt('att-conf', 'cart-1');
      await manager.confirmAttempt('att-conf', 999, 'wc_order_999', 'cart-1');

      await new Promise((r) => setTimeout(r, 20));

      const replay = await manager.startAttempt('att-conf', 'cart-1');
      expect(replay.ok).toBe(true);
      if (replay.ok && !replay.isNew) {
        expect(replay.orderId).toBe(999);
        expect(replay.orderKey).toBe('wc_order_999');
      } else {
        expect.unreachable('confirmed attempt must replay, not reset');
      }
    });

    it('sweeps confirmed attempts only past the long confirmed TTL', async () => {
      const manager = new CheckoutAttemptManager(1000 * 60 * 60, new InMemoryAttemptStore(), 'checkout', 10);
      await manager.startAttempt('att-conf-old', 'cart-1');
      await manager.confirmAttempt('att-conf-old', 111, 'wc_order_111', 'cart-1');

      await new Promise((r) => setTimeout(r, 20));

      const fresh = await manager.startAttempt('att-conf-old', 'cart-1');
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

  describe('Atomic file claims across processes and restarts (ECO-1102)', () => {
    const childClaimScript = (storeUrl: string): string =>
      [
        'import { FileClaimAttemptStore } from ' + JSON.stringify(storeUrl) + ';',
        'const parts = process.argv.slice(2);',
        'const store = new FileClaimAttemptStore(parts[0]);',
        'const stamp = Date.now();',
        'const sep = String.fromCharCode(0);',
        'const record = { attemptKey: parts[1], operation: String(parts[3]), ownerKey: parts[2], status: \'PENDING\', createdAt: stamp, updatedAt: stamp };',
        "store.claimPending('checkout' + sep + parts[1], record).then((o) => console.log('OUTCOME:' + o));",
      ].join(String.fromCharCode(10));

    it('lets exactly one of many parallel claimants win on one shared store', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-race-'));
      try {
        const store = new FileClaimAttemptStore(dir);
        const managers = Array.from({ length: 8 }, () => new CheckoutAttemptManager(3600000, store));
        const results = await Promise.all(
          managers.flatMap((manager) =>
            Array.from({ length: 8 }, () => manager.startAttempt('race-key', 'cart-race'))
          )
        );
        const winners = results.filter((r) => r.ok);
        expect(winners).toHaveLength(1);
        if (winners[0] && winners[0].ok) expect(winners[0].isNew).toBe(true);
        for (const loser of results.filter((r) => !r.ok)) {
          if (!loser.ok) expect(loser.status).toBe('PENDING');
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('lets exactly one of two simultaneous OS processes win the same claim', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-proc-'));
      try {
        const storePath = new URL('../checkout-attempts.ts', import.meta.url);
        const script = childClaimScript(storePath.href);
        const scriptPath = path.join(dir, 'claim-child.mts');
        writeFileSync(scriptPath, script, 'utf8');
        const run = (owner: string) =>
          execFileAsync(process.execPath, [scriptPath, dir, 'proc-key', owner, 'checkout']);
        const settled = await Promise.all([run('cart-a'), run('cart-b')]);
        const outcomes = settled
          .flatMap((r) => String(r.stdout).split(String.fromCharCode(10)))
          .map((line) => line.trim())
          .filter((line) => line.startsWith('OUTCOME:'))
          .map((line) => line.slice('OUTCOME:'.length));
        expect(outcomes.sort()).toEqual(['claimed', 'exists']);
        // The durable record belongs to exactly one owner.
        const managers = [
          new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir)),
          new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir)),
        ];
        const first = managers[0];
        const second = managers[1];
        if (!first || !second) throw new Error('test setup failed');
        const replayA = await first.startAttempt('proc-key', 'cart-a');
        const replayB = await second.startAttempt('proc-key', 'cart-b');
        const okCount = [replayA.ok, replayB.ok].filter(Boolean).length;
        expect(okCount).toBe(0);
        const statuses = [
          !replayA.ok ? replayA.status : '',
          !replayB.ok ? replayB.status : '',
        ].sort();
        expect(statuses).toEqual(['OWNER_MISMATCH', 'PENDING']);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('replays a confirmation on a new manager after a restart', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-restart-'));
      try {
        const before = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));
        await before.startAttempt('restart-key', 'cart-restart');
        await before.confirmAttempt('restart-key', 6061, 'wc_order_restart', 'cart-restart');

        const after = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));
        const replay = await after.startAttempt('restart-key', 'cart-restart');
        expect(replay.ok).toBe(true);
        if (replay.ok && !replay.isNew) {
          expect(replay.orderId).toBe(6061);
          expect(replay.orderKey).toBe('wc_order_restart');
        } else {
          expect.unreachable('confirmed attempt must replay after restart');
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('fails closed on a corrupt record and never resets it', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-corrupt-'));
      try {
        const sep = 'checkout' + String.fromCharCode(0) + 'bad-key';
        const fileName = Buffer.from(sep, 'utf8').toString('base64url') + '.pending.json';
        const target = path.join(dir, fileName);
        writeFileSync(target, '{not-json', 'utf8');
        const manager = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));

        await expect(manager.startAttempt('bad-key', 'cart-x')).rejects.toThrow(CorruptAttemptStoreError);
        expect(existsSync(target)).toBe(true);
        await expect(manager.startAttempt('bad-key', 'cart-x')).rejects.toThrow(CorruptAttemptStoreError);
        expect(existsSync(target)).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('fails closed on unavailable storage without an in-memory fallback', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-blocked-'));
      try {
        const blocker = path.join(dir, 'blocker');
        writeFileSync(blocker, 'occupied', 'utf8');
        const first = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(path.join(blocker, 'sub')));
        const second = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(path.join(blocker, 'sub')));
        await expect(first.startAttempt('k', 'cart-1')).rejects.toThrow();
        await expect(second.startAttempt('k', 'cart-1')).rejects.toThrow();
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('Payload-bound attempts (ECO-1102)', () => {
    const inputFor = (email: string): StoreCheckoutInput => ({
      billing_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA', email },
      shipping_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA' },
      payment_method: 'cod',
    });

    it('computes a stable hash independent of key order', () => {
      const a = attemptPayloadHash('cart-1', inputFor('a@example.com'));
      const shuffled: StoreCheckoutInput = {
        payment_method: 'cod',
        shipping_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA' },
        billing_address: { email: 'a@example.com', country: 'MA', city: 'D', address_1: 'C', last_name: 'B', first_name: 'A' },
      };
      expect(attemptPayloadHash('cart-1', shuffled)).toBe(a);
      expect(attemptPayloadHash('cart-1', inputFor('b@example.com'))).not.toBe(a);
      expect(attemptPayloadHash('cart-2', inputFor('a@example.com'))).not.toBe(a);
    });

    it('refuses a retry that changes the order details under one attempt', async () => {
      const manager = new CheckoutAttemptManager();
      const first = await manager.startAttempt('k', 'cart-1', attemptPayloadHash('cart-1', inputFor('a@example.com')));
      expect(first.ok).toBe(true);
      const changed = await manager.startAttempt('k', 'cart-1', attemptPayloadHash('cart-1', inputFor('evil@example.com')));
      expect(changed.ok).toBe(false);
      if (!changed.ok) expect(changed.status).toBe('PAYLOAD_MISMATCH');
      expect((await manager.getAttempt('k'))?.status).toBe('PENDING');
    });

    it('refuses a replay that changes the contact of a confirmed order', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('k', 'cart-1', attemptPayloadHash('cart-1', inputFor('a@example.com')));
      await manager.confirmAttempt('k', 42, 'wc_42', 'cart-1', 'a@example.com');
      const replay = await manager.startAttempt('k', 'cart-1', attemptPayloadHash('cart-1', inputFor('evil@example.com')));
      expect(replay.ok).toBe(false);
      if (!replay.ok) expect(replay.status).toBe('PAYLOAD_MISMATCH');
    });

    it('allows a fresh legitimate repeat purchase under a new attempt key', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-repeat-'));
      try {
        const manager = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));
        const hash = attemptPayloadHash('cart-1', inputFor('a@example.com'));
        await manager.startAttempt('buy-1', 'cart-1', hash);
        await manager.confirmAttempt('buy-1', 101, 'wc_101', 'cart-1', 'a@example.com');
        const second = await manager.startAttempt('buy-2', 'cart-1', hash);
        expect(second.ok).toBe(true);
        if (second.ok) expect(second.isNew).toBe(true);
        await manager.confirmAttempt('buy-2', 102, 'wc_102', 'cart-1', 'a@example.com');
        expect((await manager.getAttempt('buy-1'))?.orderId).toBe(101);
        expect((await manager.getAttempt('buy-2'))?.orderId).toBe(102);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });
  });

  describe('Response-loss recovery without blind retries (ECO-1102)', () => {
    const checkoutInput: StoreCheckoutInput = {
      billing_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA', email: 'buyer@example.com' },
      shipping_address: { first_name: 'A', last_name: 'B', address_1: 'C', city: 'D', country: 'MA' },
      payment_method: 'cod',
    };

    const checkoutSuccess = (orderId: number, orderKey: string) => ({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ order_id: orderId, order_key: orderKey, status: 'processing', customer_id: 0 }),
    });

    it('retries once after a timeout before creation and creates exactly one order', async () => {
      const manager = new CheckoutAttemptManager();
      let posts = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
          const method = (init?.method || 'GET').toUpperCase();
          if (method === 'GET') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({ Nonce: 'n-seed' }),
              json: async () => ({ items: [], totals: { currency_code: 'MAD', total_items: '0', total_price: '0' } }),
            };
          }
          posts += 1;
          if (posts === 1) throw new Error('network timeout');
          return checkoutSuccess(555, 'wc_order_555');
        })
      );

      await expect(executeIdempotentCheckout('to-key', 'cart-to', checkoutInput, manager)).rejects.toThrow(
        'network timeout'
      );
      const retry = await executeIdempotentCheckout('to-key', 'cart-to', checkoutInput, manager);
      expect(retry.orderId).toBe(555);
      expect(posts).toBe(2);
      expect((await manager.getAttempt('to-key'))?.status).toBe('CONFIRMED');
    });

    it('recovers a lost success from Woo correlation with zero new orders', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'ecomos-claim-loss-'));
      try {
        const store = new FileClaimAttemptStore(dir);
        const before = new CheckoutAttemptManager(3600000, store);
        await before.startAttempt('rl-key', 'cart-rl', attemptPayloadHash('cart-rl', checkoutInput));

        let posts = 0;
        vi.stubGlobal(
          'fetch',
          vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
            if ((init?.method || 'GET').toUpperCase() === 'POST') posts += 1;
            return {
              ok: true,
              status: 200,
              headers: new Headers(),
              json: async () => ({ items: [], totals: { currency_code: 'MAD', total_items: '0', total_price: '0' } }),
            };
          })
        );

        const after = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));
        const recovered = await executeIdempotentCheckout('rl-key', 'cart-rl', checkoutInput, after, {
          lookupOrder: async () => ({ orderId: 777, orderKey: 'wc_order_777' }),
        });
        expect(recovered.orderId).toBe(777);
        expect(recovered.orderKey).toBe('wc_order_777');
        expect(posts).toBe(0);
        expect((await after.getAttempt('rl-key'))?.status).toBe('CONFIRMED');

        // A restart still replays the recovered order instead of re-submitting.
        const restarted = new CheckoutAttemptManager(3600000, new FileClaimAttemptStore(dir));
        const replay = await restarted.startAttempt('rl-key', 'cart-rl', attemptPayloadHash('cart-rl', checkoutInput));
        expect(replay.ok).toBe(true);
        if (replay.ok && !replay.isNew) expect(replay.orderId).toBe(777);
        else expect.unreachable('recovered order must replay');
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    });

    it('submits exactly once when the lookup proves no order exists', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('miss-key', 'cart-miss', attemptPayloadHash('cart-miss', checkoutInput));
      let posts = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
          if ((init?.method || 'GET').toUpperCase() !== 'POST') {
            return {
              ok: true,
              status: 200,
              headers: new Headers({ Nonce: 'n-seed' }),
              json: async () => ({ items: [], totals: { currency_code: 'MAD', total_items: '0', total_price: '0' } }),
            };
          }
          posts += 1;
          return checkoutSuccess(888, 'wc_order_888');
        })
      );

      const result = await executeIdempotentCheckout('miss-key', 'cart-miss', checkoutInput, manager, {
        lookupOrder: async () => null,
      });
      expect(result.orderId).toBe(888);
      expect(posts).toBe(1);
    });

    it('reports an honest unknown when recovery lookup itself fails', async () => {
      const manager = new CheckoutAttemptManager();
      await manager.startAttempt('unk-key', 'cart-unk', attemptPayloadHash('cart-unk', checkoutInput));
      let posts = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
          if ((init?.method || 'GET').toUpperCase() === 'POST') posts += 1;
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ items: [], totals: { currency_code: 'MAD', total_items: '0', total_price: '0' } }),
          };
        })
      );

      await expect(
        executeIdempotentCheckout('unk-key', 'cart-unk', checkoutInput, manager, {
          lookupOrder: async () => {
            throw new Error('staging database unreachable');
          },
        })
      ).rejects.toThrow(/unknown.*recovery failed/i);
      expect(posts).toBe(0);
      expect((await manager.getAttempt('unk-key'))?.status).toBe('PENDING');
    });

    it('embeds the correlation marker in the customer note only when keyed', async () => {
      const bodies: unknown[] = [];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
          if ((init?.method || 'GET').toUpperCase() === 'POST' && init?.body) {
            bodies.push(JSON.parse(String(init.body)));
          }
          return checkoutSuccess(1001, 'wc_order_1001');
        })
      );

      await submitStoreCheckout('tok', { ...checkoutInput, customer_note: 'Leave at door' }, 'att-1');
      const keyed = bodies[bodies.length - 1] as Record<string, unknown>;
      expect(String(keyed.customer_note)).toContain('Leave at door');
      expect(String(keyed.customer_note)).toContain(correlationMarker('att-1'));

      await submitStoreCheckout('tok', checkoutInput);
      const plain = bodies[bodies.length - 1] as Record<string, unknown>;
      expect(String(plain.customer_note ?? '')).not.toContain('ecomos-attempt');
    });

    it('matches the correlated order by marker and email through the REST lookup', async () => {
      vi.stubEnv('WC_REST_URL', 'http://woo.test/wp-json/wc/v3');
      vi.stubEnv('WC_REST_KEY', 'ck_test');
      vi.stubEnv('WC_REST_SECRET', 'cs_test');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => [
            { id: 1, customer_note: 'nothing here', billing: { email: 'buyer@example.com' }, order_key: 'wc_1' },
            {
              id: 2,
              customer_note: 'gift ' + correlationMarker('att-9'),
              billing: { email: 'other@example.com' },
              order_key: 'wc_2',
            },
            {
              id: 3,
              customer_note: 'note ' + correlationMarker('att-9'),
              billing: { email: 'buyer@example.com' },
              order_key: 'wc_3',
            },
          ],
        })
      );

      const found = await findOrderByAttemptCorrelation('att-9', { email: 'buyer@example.com' });
      expect(found).toEqual({ orderId: 3, orderKey: 'wc_3', email: 'buyer@example.com' });
      expect(await findOrderByAttemptCorrelation('att-missing', { email: 'buyer@example.com' })).toBeNull();
    });
  });

  describe('Default attempt store policy (ECO-1102)', () => {
    it('stays hermetic under test runners and durable when configured', () => {
      expect(createDefaultAttemptStore()).toBeInstanceOf(InMemoryAttemptStore);
      vi.stubEnv('ECOM_ATTEMPT_STORE_PATH', path.join(tmpdir(), 'ecomos-claim-configured'));
      expect(createDefaultAttemptStore()).toBeInstanceOf(FileClaimAttemptStore);
    });
  });
});
