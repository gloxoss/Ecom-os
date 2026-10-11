# ECO-1005 — RFQ persistence, review/offer routes and owner-bound replay

**Commit:** `cda9acc` · **Audit findings:** 3, and the RFQ half of 2

## Defects reproduced

- `quote-builder.tsx` linked to `/devis/review`, which did not exist; `QuoteReview`,
  `OfferReview` and `AddToQuoteButton` had no import callers.
- Submission kept quotes in a process-local `Map`; the offers endpoint read a
  **separate** mock store populated by a test setter, so a submitted quote never
  became a readable offer.
- `route.ts` replayed a cached response containing the `accessSecret` by key before
  validating the current submission, so a different caller presenting the same
  Idempotency-Key received another guest's quote id and secret.

## Repairs

- One shared quote store (`features/rfq/model/server-quote-store.ts`) backs both
  routes. `setOfferQuoteForTesting` and friends remain, but delegate to the shared
  store, so a quote submitted at `/api/rfq` is immediately readable at
  `/api/rfq/offers` with no test-only setter.
- `JsonFileRfqQuoteStore` gives real local durability (atomic writes, selected by
  `ECOM_RFQ_STORE_PATH`). The module names the WordPress repository in
  `plugins/wp-ecomos-rfq/` as the production persistence layer.
- Idempotent replay is owner-bound (owner = normalized contact email, the identity
  the quote is already filed under). A mismatched owner returns 409
  `IDEMPOTENCY_OWNER_MISMATCH` with neither `quoteId` nor `accessSecret`, before any
  validation or creation. Same-owner replay returns the cached response.
- `/devis/review` renders `QuoteReview` and `/devis/offer` renders `OfferReview`,
  both under the same `isAddonActive('quotes')` gate as `/devis`. The guest offer
  token is read from the URL fragment and never sent to the server.
- `AddToQuoteButton` is mounted on the product hero, gated on the server-resolved
  addon registry (`quoteEnabled` prop) so a client flag cannot enable it.
- Addon-off isolation: both API routes 404 before touching the store, both pages
  `notFound()`, and a test asserts zero store writes while off.

## Verification

| Check | Result |
| --- | --- |
| `vitest run` (whole suite) | exit 0 — 521 passed (12 of them new here) |
| `tsx --test apps/storefront/e2e/quote-builder.spec.ts quote-offer.spec.ts quote-conversion.spec.ts rfq-off.spec.ts` | exit 0 — 21 passed |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 |
| Submitted quote readable from the offers endpoint with no test setter | proven |
| Cross-owner replay of the same key | 409, body contains neither the secret nor the quote id |
| Quote read back from a fresh store instance over the same file | proven (simulated restart) |

## Served-page evidence (executed)

Against the Next dev server over HTTP, with the quotes addon **off**:

| Route | Status | Meaning |
| --- | --- | --- |
| `/devis` | 404 | addon-off isolation holds at the route level |
| `/devis/review` | 404 | the new page honours the same gate |

With `ADDONS` not containing `quotes`, both new pages are unreachable, which is the
required off-state. The on-state render is covered by the page test (server component
invoked directly) and is **not** a browser render; see below.

## Not proven

- **Real WordPress persistence, staff access and restart survival on a live site were
  not executed.** No WordPress/MySQL here. The local durable path is real; the
  WordPress integration point is named but unwired.
- **No browser has rendered the two new pages.** The page test calls the server
  component directly; that is not a browser render.
- Owner binding is the contact email, not a session token: a caller who knows both a
  victim's email and their client-generated idempotency key could still replay. No
  session token exists on this surface today.
- The file store is single-host; multiple workers need the WordPress repository.
