import crypto from 'node:crypto';
import { guardAddonRoute } from '../../../lib/addon-route-guard';
import { getRfqQuoteStore } from '../../../features/rfq/model/server-quote-store';
import {
  validateRfqSubmitInput,
  transition,
  type RfqQuote,
} from '../../../../../../packages/addons-rfq/src/index';

/**
 * Owner key for idempotent replay.
 *
 * This route has no guest cart/session token: the storefront keeps an opaque
 * cart cookie inside the cart feature, but nothing on this API surface exposes a
 * stable submitter token. The identity the payload already carries, and the one
 * the quote is filed under (`guestChallengeEmail`), is the normalized contact
 * email. It is therefore the natural owner binding: a replay presenting the same
 * Idempotency-Key with a different contact email is a different caller.
 */
function resolveOwnerKey(body: unknown): string {
  const contact = (body as { contact?: { email?: unknown } } | null)?.contact;
  const email = contact?.email;
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

// Test helpers are exported from `features/rfq/model/server-quote-store`, not
// from here: a route module may only export its HTTP handlers.

export async function POST(req: Request) {
  // 1. Authoritative Addon Route Guard
  const guard = guardAddonRoute('quotes');
  if (!guard.allowed) {
    return new Response(
      JSON.stringify({
        code: 'ADDON_DISABLED',
        message: 'RFQ Quotes addon is currently disabled on this platform.',
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  // 2. Parse request
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, errors: ['Invalid JSON payload'] }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  const headerIdempKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
  // The body is untrusted JSON, so only accept a string idempotency key.
  const bodyIdempKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : '';
  const idempotencyKey = (headerIdempKey || bodyIdempKey || '').trim();
  const store = getRfqQuoteStore();
  const ownerKey = resolveOwnerKey(body);

  // 3. Idempotency Check, bound to the submitting owner
  if (idempotencyKey) {
    const cached = await store.getIdempotency(idempotencyKey);
    if (cached) {
      // A cached entry belongs to exactly one submitter. A different owner gets
      // no quote id and no accessSecret: fail closed instead of handing over
      // another guest's bearer grant.
      if (cached.ownerKey !== ownerKey) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'IDEMPOTENCY_OWNER_MISMATCH',
            errors: ['This idempotency key belongs to a different submission session.'],
          }),
          {
            status: 409,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, private',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          ...cached.data,
          idempotent: true,
        }),
        {
          status: cached.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, private',
            'X-Idempotent-Replay': 'true',
          },
        }
      );
    }
  }

  // 4. Input validation
  const validation = validateRfqSubmitInput({
    ...body,
    idempotencyKey,
  });

  if (!validation.valid || !validation.sanitized) {
    return new Response(
      JSON.stringify({
        success: false,
        errors: validation.errors,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  }

  const input = validation.sanitized;
  const now = new Date().toISOString();

  // 5. Generate secure guest tokens (without B2C customer account!)
  const accessSecret = crypto.randomBytes(32).toString('hex');
  const accessSecretHash = crypto.createHash('sha256').update(accessSecret).digest('hex');

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const quoteId = `quote_${Date.now().toString(36)}_${randomSuffix}`;
  const quoteNumber = `DEV-${new Date().getFullYear()}-${randomSuffix}`;

  // 6. Build RFQ entity in 'draft' then transition to 'submitted'
  const draftQuote: RfqQuote = {
    id: quoteId,
    quoteNumber,
    state: 'draft',
    contact: input.contact,
    consents: input.consents,
    items: input.items,
    revisions: [],
    accessSecretHash,
    guestChallengeEmail: input.contact.email,
    isContactVerified: false,
    createdAt: now,
    updatedAt: now,
  };

  const submittedQuote = transition(draftQuote, 'submitted', {
    role: 'guest',
    id: accessSecretHash,
    email: input.contact.email,
  });

  // Store in the shared durable store: this is the same quote the offers route reads.
  await store.putQuote(submittedQuote);

  const responsePayload = {
    success: true,
    quoteId,
    quoteNumber,
    accessSecret,
    state: submittedQuote.state,
  };

  // Cache response under idempotency key, bound to this owner
  if (idempotencyKey) {
    store.putIdempotency(idempotencyKey, {
      ownerKey,
      statusCode: 201,
      data: responsePayload,
    });
  }

  // Invariant: Never cache private customer data
  return new Response(JSON.stringify(responsePayload), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
    },
  });
}
