import crypto from 'node:crypto';
import { guardAddonRoute } from '@/lib/addon-route-guard';
import {
  validateRfqSubmitInput,
  transition,
  type RfqQuote,
} from '../../../../../../packages/addons-rfq/src/index';

// In-memory idempotency cache for duplicate submission deduplication
interface CachedRfqResponse {
  statusCode: number;
  data: {
    success: boolean;
    quoteId: string;
    quoteNumber: string;
    accessSecret: string;
    state: string;
  };
}

const idempotencyStore = new Map<string, CachedRfqResponse>();
const quoteStore = new Map<string, RfqQuote>();

export function clearRfqStoresForTesting(): void {
  idempotencyStore.clear();
  quoteStore.clear();
}

export function getQuoteForTesting(id: string): RfqQuote | undefined {
  return quoteStore.get(id);
}

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
  let body: any;
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
  const idempotencyKey = (headerIdempKey || body?.idempotencyKey || '').trim();

  // 3. Idempotency Check
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    const cached = idempotencyStore.get(idempotencyKey)!;
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

  // Store in persistence
  quoteStore.set(quoteId, submittedQuote);

  const responsePayload = {
    success: true,
    quoteId,
    quoteNumber,
    accessSecret,
    state: submittedQuote.state,
  };

  // Cache response under idempotency key
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, {
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
