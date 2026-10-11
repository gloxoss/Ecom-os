import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { AddonRegistry } from '@ecom-os/engine';
import { setStorefrontRegistryForTesting } from '../../lib/addon-capabilities';
import { POST as submitRfq } from '../../app/api/rfq/route';
import { GET as getOffers, POST as offerAction } from '../../app/api/rfq/offers/route';
import {
  setRfqQuoteStoreForTesting,
  WordPressRfqQuoteStore,
  UpstreamRfqError,
  InMemoryRfqQuoteStore,
  type RfqQuoteStore,
} from '../../features/rfq/model/server-quote-store';
import {
  type RfqQuote,
  type OfferRevision,
} from '../../../../../packages/addons-rfq/src/index';

function createSubmitRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost:3000/api/rfq', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function makeValidQuoteInput(idempotencyKey = 'auth-test-key-1', email = 'kenza@atlas-crafts.ma') {
  return {
    idempotencyKey,
    contact: {
      name: 'Kenza Bennani',
      email,
      companyName: 'Atlas Crafts SARL',
      taxId: 'ICE00992831',
    },
    items: [
      {
        productId: 101,
        variationId: 1011,
        title: 'Zellige Mosaic Tile Fountain',
        quantity: 2,
        customerNotes: 'Blue & emerald glaze',
      },
    ],
    consents: [
      { consentId: 'terms_and_conditions', grantedAt: '2026-10-10T10:00:00Z' },
      { consentId: 'privacy_consent', grantedAt: '2026-10-10T10:00:00Z' },
    ],
  };
}

describe('ECO-1103: RFQ Security & Guest/Staff Credential Decoupling', () => {
  let registry: AddonRegistry;

  beforeEach(() => {
    setRfqQuoteStoreForTesting(new InMemoryRfqQuoteStore());
    registry = new AddonRegistry('1.0.0');
    registry.register({
      id: 'quotes',
      name: 'RFQ Quotes Addon',
      version: '1.0.0',
      ecomOsApiRange: '^1.0.0',
      capabilities: { provided: ['quotes', 'submit_quote', 'quote_builder'] },
    });
    registry.enable('quotes');
    setStorefrontRegistryForTesting(registry);
  });

  afterEach(() => {
    setRfqQuoteStoreForTesting(null);
    vi.restoreAllMocks();
  });

  describe('1. Guest Proof Generation & Route Authorization Isolation', () => {
    it('initial guest creation issues opaque accessSecret and validates proof on read', async () => {
      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-1')));
      expect(submitRes.status).toBe(201);
      const submitBody = await submitRes.json();

      expect(submitBody.success).toBe(true);
      expect(submitBody.quoteId).toBeDefined();
      expect(submitBody.accessSecret).toBeDefined();
      expect(typeof submitBody.accessSecret).toBe('string');
      expect(submitBody.accessSecret.length).toBe(64); // 32 random bytes hex

      // Read with valid token header
      const readRes = await getOffers(
        new Request(`http://localhost:3000/api/rfq/offers?quoteId=${submitBody.quoteId}`, {
          method: 'GET',
          headers: { 'x-quote-token': submitBody.accessSecret },
        })
      );
      expect(readRes.status).toBe(200);
      const readBody = await readRes.json();
      expect(readBody.success).toBe(true);
      expect(readBody.quote.id).toBe(submitBody.quoteId);
      // Invariant: accessSecretHash is never exposed in response
      expect(readBody.quote.accessSecretHash).toBeUndefined();
    });

    it('rejects guest reads when token is missing (401)', async () => {
      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-2')));
      const submitBody = await submitRes.json();

      const readRes = await getOffers(
        new Request(`http://localhost:3000/api/rfq/offers?quoteId=${submitBody.quoteId}`, {
          method: 'GET',
        })
      );
      expect(readRes.status).toBe(401);
      const body = await readRes.json();
      expect(body.error).toContain('token required');
    });

    it('rejects guest reads with forged token (403)', async () => {
      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-3')));
      const submitBody = await submitRes.json();

      const forgedToken = crypto.randomBytes(32).toString('hex');
      const readRes = await getOffers(
        new Request(`http://localhost:3000/api/rfq/offers?quoteId=${submitBody.quoteId}`, {
          method: 'GET',
          headers: { 'x-quote-token': forgedToken },
        })
      );
      expect(readRes.status).toBe(403);
      const body = await readRes.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    it('rejects guest reads presenting valid token belonging to a different quote (403)', async () => {
      // Create Quote A
      const resA = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-a', 'user-a@riad.ma')));
      const quoteA = await resA.json();

      // Create Quote B
      const resB = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-b', 'user-b@riad.ma')));
      const quoteB = await resB.json();

      // Attempt to read Quote B using Quote A's access token
      const readCrossRes = await getOffers(
        new Request(`http://localhost:3000/api/rfq/offers?quoteId=${quoteB.quoteId}`, {
          method: 'GET',
          headers: { 'x-quote-token': quoteA.accessSecret },
        })
      );
      expect(readCrossRes.status).toBe(403);
      const body = await readCrossRes.json();
      expect(body.code).toBe('FORBIDDEN');
    });

    it('rejects guest actions (accept/reject/revise) without accessSecret (400)', async () => {
      const res = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-act-0')));
      const quote = await res.json();

      const actions = ['accept', 'reject', 'revise'];
      for (const act of actions) {
        const resp = await offerAction(
          new Request('http://localhost:3000/api/rfq/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: act,
              quoteId: quote.quoteId,
              // Missing accessSecret
            }),
          })
        );
        expect(resp.status).toBe(400);
      }
    });

    it('rejects guest actions (accept/reject/revise) with forged accessSecret (403)', async () => {
      const res = await submitRfq(createSubmitRequest(makeValidQuoteInput('sec-key-act-1')));
      const quote = await res.json();

      const forgedSecret = crypto.randomBytes(32).toString('hex');
      const actions = [
        { action: 'accept', revisionId: 'rev_1' },
        { action: 'reject', reason: 'Too expensive' },
        { action: 'revise', notes: 'Need discount' },
      ];

      for (const act of actions) {
        const resp = await offerAction(
          new Request('http://localhost:3000/api/rfq/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...act,
              quoteId: quote.quoteId,
              accessSecret: forgedSecret,
            }),
          })
        );
        expect(resp.status).toBe(403);
        const body = await resp.json();
        expect(body.code).toBe('FORBIDDEN');
      }
    });
  });

  describe('2. Staff Credentials Decoupling (Privileged transport keys cannot excuse missing/forged guest tokens)', () => {
    it('staff credentials configured in WordPressRfqQuoteStore do NOT authorize guest routes without guest token', async () => {
      // Simulate WordPress backend mock that receives staff basic auth
      const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const authHeader = (init?.headers as Record<string, string>)?.['Authorization'];
        const quoteToken = (init?.headers as Record<string, string>)?.['x-quote-token'];

        // Backend mock: Staff credentials present, but guest token missing on guest route
        if (url.includes('/quotes/') && !quoteToken) {
          return new Response(
            JSON.stringify({
              code: 'unauthorized',
              message: 'Authentication token required',
            }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }

        // Return a mock quote
        return new Response(
          JSON.stringify({
            id: 'quote_test_staff_decouple',
            quote_number: 'DEV-2026-9999',
            state: 'submitted',
            contact_data: JSON.stringify({ email: 'staff-test@example.ma' }),
            items_data: '[]',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      });

      vi.stubGlobal('fetch', mockFetch);

      // Construct store with staff credentials (ECOM_RFQ_WP_USER + ECOM_RFQ_WP_APP_PASSWORD)
      const staffAuth = Buffer.from('operator_user:app_pass_secret').toString('base64');
      const store = new WordPressRfqQuoteStore('https://wp.example.com/wp-json/ecomos/v1/rfq', staffAuth);
      setRfqQuoteStoreForTesting(store);

      // GET /api/rfq/offers without token -> Storefront rejects 401 BEFORE or AFTER calling store
      const readWithoutToken = await getOffers(
        new Request('http://localhost:3000/api/rfq/offers?quoteId=quote_test_staff_decouple', {
          method: 'GET',
        })
      );
      expect(readWithoutToken.status).toBe(401);

      // POST /api/rfq/offers (accept) without token -> 400
      const acceptWithoutToken = await offerAction(
        new Request('http://localhost:3000/api/rfq/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept',
            quoteId: 'quote_test_staff_decouple',
            revisionId: 'rev_1',
          }),
        })
      );
      expect(acceptWithoutToken.status).toBe(400);
    });

    it('staff credentials do NOT excuse a forged guest token presented to WordPress backend', async () => {
      const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const quoteToken = (init?.headers as Record<string, string>)?.['x-quote-token'];
        // Backend rejects forged token even if staff Basic Auth header is on the transport!
        if (quoteToken === 'forged_guest_token') {
          return new Response(
            JSON.stringify({
              code: 'forbidden',
              message: 'Access denied to quote: invalid guest token',
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return new Response('{}', { status: 404 });
      });

      vi.stubGlobal('fetch', mockFetch);

      const staffAuth = Buffer.from('operator_user:app_pass_secret').toString('base64');
      const store = new WordPressRfqQuoteStore('https://wp.example.com/wp-json/ecomos/v1/rfq', staffAuth);
      setRfqQuoteStoreForTesting(store);

      const readWithForged = await getOffers(
        new Request('http://localhost:3000/api/rfq/offers?quoteId=quote_test_123', {
          method: 'GET',
          headers: { 'x-quote-token': 'forged_guest_token' },
        })
      );

      expect(readWithForged.status).toBe(403);
      const body = await readWithForged.json();
      expect(body.code).toBe('FORBIDDEN');
    });
  });

  describe('3. Honest Upstream Error Propagation & Resilience', () => {
    it('propagates upstream 500 error on quote submission and does not cache in idempotency', async () => {
      const failingStore: RfqQuoteStore = {
        async getQuote() { return undefined; },
        async putQuote() {
          throw new UpstreamRfqError(500, 'INTERNAL_SERVER_ERROR', 'Database disk full on upstream');
        },
        async acceptOffer() { return undefined; },
        async rejectQuote() { return undefined; },
        async requestRevision() { return undefined; },
        async listQuoteIds() { return []; },
        async getIdempotency() { return undefined; },
        async putIdempotency() { throw new Error('Should not be called on failure!'); },
        async clear() {},
      };

      setRfqQuoteStoreForTesting(failingStore);

      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('fail-key-1')));
      expect(submitRes.status).toBe(500);
      const submitBody = await submitRes.json();
      expect(submitBody.success).toBe(false);
      expect(submitBody.code).toBe('INTERNAL_SERVER_ERROR');
      expect(submitBody.errors[0]).toContain('Database disk full');
    });

    it('propagates upstream timeout as 504 UPSTREAM_TIMEOUT', async () => {
      const timeoutStore: RfqQuoteStore = {
        async getQuote() {
          throw new UpstreamRfqError(504, 'UPSTREAM_TIMEOUT', 'Upstream request timed out');
        },
        async putQuote() {
          throw new UpstreamRfqError(504, 'UPSTREAM_TIMEOUT', 'Upstream request timed out');
        },
        async acceptOffer() { return undefined; },
        async rejectQuote() { return undefined; },
        async requestRevision() { return undefined; },
        async listQuoteIds() { return []; },
        async getIdempotency() { return undefined; },
        async putIdempotency() {},
        async clear() {},
      };

      setRfqQuoteStoreForTesting(timeoutStore);

      // Submission timeout
      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('timeout-key-1')));
      expect(submitRes.status).toBe(504);
      const submitBody = await submitRes.json();
      expect(submitBody.code).toBe('UPSTREAM_TIMEOUT');

      // Offers read timeout
      const readRes = await getOffers(
        new Request('http://localhost:3000/api/rfq/offers?quoteId=q_timeout', {
          headers: { 'x-quote-token': 'token123' },
        })
      );
      expect(readRes.status).toBe(504);
      const readBody = await readRes.json();
      expect(readBody.code).toBe('UPSTREAM_TIMEOUT');
    });

    it('propagates upstream network error as 502 UPSTREAM_NETWORK_ERROR', async () => {
      const netErrorStore: RfqQuoteStore = {
        async getQuote() {
          throw new UpstreamRfqError(502, 'UPSTREAM_NETWORK_ERROR', 'ECONNREFUSED 127.0.0.1:8080');
        },
        async putQuote() {
          throw new UpstreamRfqError(502, 'UPSTREAM_NETWORK_ERROR', 'ECONNREFUSED 127.0.0.1:8080');
        },
        async acceptOffer() { return undefined; },
        async rejectQuote() { return undefined; },
        async requestRevision() { return undefined; },
        async listQuoteIds() { return []; },
        async getIdempotency() { return undefined; },
        async putIdempotency() {},
        async clear() {},
      };

      setRfqQuoteStoreForTesting(netErrorStore);

      const submitRes = await submitRfq(createSubmitRequest(makeValidQuoteInput('neterr-key-1')));
      expect(submitRes.status).toBe(502);
      const submitBody = await submitRes.json();
      expect(submitBody.code).toBe('UPSTREAM_NETWORK_ERROR');
    });

    it('WordPressRfqQuoteStore correctly detects abort timeout, connection error, and malformed JSON', async () => {
      // 1. Connection error
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed: socket closed')));
      const store = new WordPressRfqQuoteStore('http://localhost:8080');
      await expect(store.getQuote('q1', 'tok')).rejects.toThrow(UpstreamRfqError);
      try {
        await store.getQuote('q1', 'tok');
      } catch (e) {
        expect((e as UpstreamRfqError).statusCode).toBe(502);
        expect((e as UpstreamRfqError).errorCode).toBe('UPSTREAM_NETWORK_ERROR');
      }

      // 2. Timeout abort error
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
      try {
        await store.getQuote('q1', 'tok');
      } catch (e) {
        expect((e as UpstreamRfqError).statusCode).toBe(504);
        expect((e as UpstreamRfqError).errorCode).toBe('UPSTREAM_TIMEOUT');
      }

      // 3. Malformed JSON response
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 200 })));
      try {
        await store.getQuote('q1', 'tok');
      } catch (e) {
        expect((e as UpstreamRfqError).statusCode).toBe(502);
        expect((e as UpstreamRfqError).errorCode).toBe('UPSTREAM_MALFORMED_RESPONSE');
      }

      // 4. Empty response
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 200 })));
      try {
        await store.getQuote('q1', 'tok');
      } catch (e) {
        expect((e as UpstreamRfqError).statusCode).toBe(502);
        expect((e as UpstreamRfqError).errorCode).toBe('UPSTREAM_EMPTY_RESPONSE');
      }
    });

    it('propagates upstream state machine errors honestly (409 STALE_REVISION, 410 QUOTE_EXPIRED)', async () => {
      // 1. Expired quote
      const expiredStore: RfqQuoteStore = {
        async getQuote(id: string) {
          return {
            id,
            quoteNumber: 'DEV-2026-100',
            state: 'offer_created',
            contact: { name: 'Test', email: 'test@example.ma' },
            consents: [],
            items: [],
            revisions: [],
            currentRevisionId: 'rev_2',
            accessSecretHash: 'mock_hash',
            guestChallengeEmail: 'test@example.ma',
            isContactVerified: true,
            expiresAt: '2020-01-01T00:00:00Z', // Expired in past
            createdAt: '2020-01-01T00:00:00Z',
            updatedAt: '2020-01-01T00:00:00Z',
          } as unknown as RfqQuote;
        },
        async putQuote() {},
        async acceptOffer() { return undefined; },
        async rejectQuote() { return undefined; },
        async requestRevision() { return undefined; },
        async listQuoteIds() { return []; },
        async getIdempotency() { return undefined; },
        async putIdempotency() {},
        async clear() {},
      };

      setRfqQuoteStoreForTesting(expiredStore);

      const expiredRes = await offerAction(
        new Request('http://localhost:3000/api/rfq/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept',
            quoteId: 'q_test_exp',
            revisionId: 'rev_2',
            accessSecret: 'valid_secret',
          }),
        })
      );
      expect(expiredRes.status).toBe(410);
      const expBody = await expiredRes.json();
      expect(expBody.code).toBe('QUOTE_EXPIRED');

      // 2. Unexpired quote with superseded/stale revision targeted
      const futureDate = new Date(Date.now() + 86400000 * 30).toISOString();
      const staleStore: RfqQuoteStore = {
        async getQuote(id: string) {
          return {
            id,
            quoteNumber: 'DEV-2026-100',
            state: 'offer_created',
            contact: { name: 'Test', email: 'test@example.ma' },
            consents: [],
            items: [],
            revisions: [],
            currentRevisionId: 'rev_2',
            accessSecretHash: 'mock_hash',
            guestChallengeEmail: 'test@example.ma',
            isContactVerified: true,
            expiresAt: futureDate, // Active unexpired
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
          } as unknown as RfqQuote;
        },
        async putQuote() {},
        async acceptOffer() {
          throw new UpstreamRfqError(409, 'STALE_REVISION', 'Revision rev_1 is superseded');
        },
        async rejectQuote() { return undefined; },
        async requestRevision() { return undefined; },
        async listQuoteIds() { return []; },
        async getIdempotency() { return undefined; },
        async putIdempotency() {},
        async clear() {},
      };

      setRfqQuoteStoreForTesting(staleStore);

      const staleRes = await offerAction(
        new Request('http://localhost:3000/api/rfq/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept',
            quoteId: 'q_test_stale',
            revisionId: 'rev_1', // Stale!
            accessSecret: 'valid_secret',
          }),
        })
      );
      expect(staleRes.status).toBe(409);
      const staleBody = await staleRes.json();
      expect(staleBody.code).toBe('STALE_REVISION');
    });
  });

  describe('4. Idempotency Owner Binding & Replay Isolation', () => {
    it('idempotency replay returns exact cached quote for same owner, and refuses mismatched owner (409)', async () => {
      // Step 1: Initial submission
      const req1 = createSubmitRequest(makeValidQuoteInput('idemp-bound-1', 'client-a@riad.ma'));
      const res1 = await submitRfq(req1);
      expect(res1.status).toBe(201);
      const body1 = await res1.json();

      // Step 2: Replay by same owner returns 201 with X-Idempotent-Replay
      const reqReplay = createSubmitRequest(makeValidQuoteInput('idemp-bound-1', 'client-a@riad.ma'));
      const resReplay = await submitRfq(reqReplay);
      expect(resReplay.status).toBe(201);
      expect(resReplay.headers.get('X-Idempotent-Replay')).toBe('true');
      const bodyReplay = await resReplay.json();
      expect(bodyReplay.quoteId).toBe(body1.quoteId);
      expect(bodyReplay.accessSecret).toBe(body1.accessSecret);

      // Step 3: Replay with SAME idempotency key but DIFFERENT owner email fails closed (409)
      const reqAttacker = createSubmitRequest(makeValidQuoteInput('idemp-bound-1', 'attacker@other.ma'));
      const resAttacker = await submitRfq(reqAttacker);
      expect(resAttacker.status).toBe(409);
      const bodyAttacker = await resAttacker.json();
      expect(bodyAttacker.code).toBe('IDEMPOTENCY_OWNER_MISMATCH');
      expect(bodyAttacker.errors[0]).toContain('belongs to a different submission session');
    });
  });
});
