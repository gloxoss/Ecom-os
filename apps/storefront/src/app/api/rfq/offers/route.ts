import crypto from 'node:crypto';
import { guardAddonRoute } from '../../../../lib/addon-route-guard';
import {
  transition,
  isOfferExpired,
  type RfqQuote,
} from '../../../../../../../packages/addons-rfq/src/index';

// In-memory quote store for testing / local execution fallback
const mockQuotesStore = new Map<string, RfqQuote>();

export function setOfferQuoteForTesting(quote: RfqQuote): void {
  mockQuotesStore.set(quote.id, quote);
}

export function clearOfferQuotesForTesting(): void {
  mockQuotesStore.clear();
}

export function getOfferQuoteForTesting(id: string): RfqQuote | undefined {
  return mockQuotesStore.get(id);
}

export async function GET(req: Request) {
  const guard = guardAddonRoute('quotes');
  if (!guard.allowed) {
    return new Response(
      JSON.stringify({ code: 'ADDON_DISABLED', message: 'RFQ Quotes addon is currently disabled on this platform.' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' } }
    );
  }

  const url = new URL(req.url);
  const quoteId = url.searchParams.get('quoteId') || '';
  const token = (req.headers.get('x-quote-token') || url.searchParams.get('token') || '').trim();

  if (!quoteId) {
    return new Response(
      JSON.stringify({ success: false, error: 'quoteId parameter required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const quote = mockQuotesStore.get(quoteId);
  if (!quote) {
    return new Response(
      JSON.stringify({ success: false, error: 'Quote not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Token verification
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication token required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (tokenHash !== quote.accessSecretHash) {
    return new Response(
      JSON.stringify({ success: false, error: 'Access denied: invalid token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Safe projection without accessSecretHash
  const { accessSecretHash, ...safeQuote } = quote;
  return new Response(
    JSON.stringify({ success: true, quote: safeQuote }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' } }
  );
}

export async function POST(req: Request) {
  // 1. Authoritative Addon Route Guard
  const guard = guardAddonRoute('quotes');
  if (!guard.allowed) {
    return new Response(
      JSON.stringify({ code: 'ADDON_DISABLED', message: 'RFQ Quotes addon is currently disabled on this platform.' }),
      { status: 404, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store, private' } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { action, quoteId, accessSecret, revisionId, reason, notes } = body || {};

  if (!action || !['accept', 'reject', 'revise'].includes(action)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Action must be one of: accept, reject, revise' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!quoteId || !accessSecret) {
    return new Response(
      JSON.stringify({ success: false, error: 'quoteId and accessSecret are required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const quote = mockQuotesStore.get(quoteId);
  if (!quote) {
    return new Response(
      JSON.stringify({ success: false, error: 'Quote not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Cryptographic token verification
  const computedHash = crypto.createHash('sha256').update(String(accessSecret).trim()).digest('hex');
  if (computedHash !== quote.accessSecretHash) {
    return new Response(
      JSON.stringify({ success: false, code: 'FORBIDDEN', error: 'Access denied: invalid quotation token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const guestActor = {
    role: 'guest' as const,
    id: quote.accessSecretHash,
  };

  if (action === 'accept') {
    if (!revisionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'revisionId is required to accept an offer' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Expiration check
    if (quote.expiresAt && isOfferExpired(quote.expiresAt)) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'QUOTE_EXPIRED',
          error: 'This quotation offer has expired and can no longer be accepted.',
        }),
        { status: 410, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stale revision check
    if (quote.currentRevisionId && quote.currentRevisionId !== revisionId) {
      return new Response(
        JSON.stringify({
          success: false,
          code: 'STALE_REVISION',
          error: `Targeted revision "${revisionId}" is superseded. Current revision is "${quote.currentRevisionId}".`,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // State machine check
    try {
      const nextQuote = transition(quote, 'accepted', guestActor, { revisionId });
      quote.state = nextQuote.state;
      quote.updatedAt = nextQuote.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          acceptedRevisionId: revisionId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (action === 'reject') {
    try {
      const nextQuote = transition(quote, 'rejected', guestActor, { reason: reason || 'Declined by customer' });
      quote.state = nextQuote.state;
      quote.rejectionReason = nextQuote.rejectionReason;
      quote.updatedAt = nextQuote.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          reason: reason || 'Declined by customer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (action === 'revise') {
    try {
      const nextQuote = transition(quote, 'revision_requested', guestActor, { staffNotes: notes });
      quote.state = nextQuote.state;
      quote.customerRevisionNotes = nextQuote.customerRevisionNotes;
      quote.updatedAt = nextQuote.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          notes: notes || '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ success: false, error: err.message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }


  return new Response(
    JSON.stringify({ success: false, error: 'Unhandled action' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
