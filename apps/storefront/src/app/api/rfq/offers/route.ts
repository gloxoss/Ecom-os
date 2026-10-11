import crypto from 'node:crypto';
import { guardAddonRoute } from '../../../../lib/addon-route-guard';
import { getRfqQuoteStore } from '../../../../features/rfq/model/server-quote-store';
import {
  transition,
  isOfferExpired,
  type RfqQuote,
} from '../../../../../../../packages/addons-rfq/src/index';

// This route reads and writes the SAME store the submission route uses, so a
// quote just submitted at /api/rfq is immediately the quote a token read or a
// merchant offer action resolves against. There is no second mock store.
//
// Guest reads/accepts/rejects/revises are authorized by the quote's own access
// token here. Merchant and staff views (priced offers, conversion to a Woo
// order) are WordPress-authenticated actions in the companion plugin's REST
// routes (`plugins/wp-ecomos-rfq/routes.php`, permission callbacks using
// `ecomos_operator`/`manage_woocommerce`); staff administration stays native to
// WordPress rather than being duplicated in this storefront.

// Test helpers are exported from `features/rfq/model/server-quote-store`, not
// from here: a route module may only export its HTTP handlers.

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

  const quote = await getRfqQuoteStore().getQuote(quoteId, token);
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

  // As in POST: a quote with no stored hash comes from a store that authorized the read
  // itself (WordPress never transmits access_secret_hash), so there is nothing to compare.
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  if (quote.accessSecretHash && tokenHash !== quote.accessSecretHash) {
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

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // The client body is untrusted JSON: read each field by its expected type
  // rather than trusting a caller-controlled shape.
  const action = typeof body.action === 'string' ? body.action : '';
  const quoteId = typeof body.quoteId === 'string' ? body.quoteId : '';
  const accessSecret = typeof body.accessSecret === 'string' ? body.accessSecret : '';
  const revisionId = typeof body.revisionId === 'string' ? body.revisionId : undefined;
  const reason = typeof body.reason === 'string' ? body.reason : undefined;
  const notes = typeof body.notes === 'string' ? body.notes : undefined;

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

  const store = getRfqQuoteStore();
  const quote = await store.getQuote(quoteId);
  if (!quote) {
    return new Response(
      JSON.stringify({ success: false, error: 'Quote not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Cryptographic token verification.
  //
  // A local store returns the quote with its stored hash and this comparison is the
  // authorization. A WordPress-backed store cannot: the plugin never transmits
  // access_secret_hash, it authorizes the read itself from the token, and the mapped
  // quote carries no hash. An absent hash therefore means "the store already decided",
  // and re-checking it here would reject every legitimate guest.
  const storeAuthorized = !quote.accessSecretHash;
  const computedHash = crypto.createHash('sha256').update(String(accessSecret).trim()).digest('hex');
  if (!storeAuthorized && computedHash !== quote.accessSecretHash) {
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
      const updated = await store.acceptOffer(quoteId, revisionId, String(accessSecret).trim());
      if (!updated) throw new Error('Quote not found');
      quote.state = updated.state;
      quote.updatedAt = updated.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          acceptedRevisionId: revisionId,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return new Response(
        JSON.stringify({ success: false, error: message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (action === 'reject') {
    try {
      const updated = await store.rejectQuote(quoteId, reason || 'Declined by customer', String(accessSecret).trim());
      if (!updated) throw new Error('Quote not found');
      quote.state = updated.state;
      quote.rejectionReason = updated.rejectionReason;
      quote.updatedAt = updated.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          reason: reason || 'Declined by customer',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return new Response(
        JSON.stringify({ success: false, error: message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  if (action === 'revise') {
    try {
      const updated = await store.requestRevision(quoteId, notes ?? '', String(accessSecret).trim());
      if (!updated) throw new Error('Quote not found');
      quote.state = updated.state;
      quote.customerRevisionNotes = updated.customerRevisionNotes;
      quote.updatedAt = updated.updatedAt;
      return new Response(
        JSON.stringify({
          success: true,
          quoteId: quote.id,
          state: quote.state,
          notes: notes || '',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      return new Response(
        JSON.stringify({ success: false, error: message || 'Invalid state transition' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }


  return new Response(
    JSON.stringify({ success: false, error: 'Unhandled action' }),
    { status: 400, headers: { 'Content-Type': 'application/json' } }
  );
}
