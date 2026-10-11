# ECO-1004 — Real guest catalog → cart → COD → order journey

**Commit:** `cda9acc` · **Audit finding:** 1

## Defect reproduced

- `apps/storefront/src/app/[locale]/(checkout)/checkout/page.tsx` rendered
  "Checkout is currently unavailable".
- `add-to-cart-button.tsx` resolved the purchase intent and then called
  `addItem(product)`, discarding variation and quantity.
- `cart-store.ts` merged by parent product id and stored `quantity: 1`.

## Repairs

- Cart lines are keyed `productId::variationId`. Repeat adds of the same variation
  increment by the requested quantity; different variations stay separate lines; the
  requested quantity is stored on first add; legacy persisted lines are normalized.
- `AddToCartButton` passes the resolved intent through, and also drives the
  authoritative WooCommerce cart via `addToCartAction`, rolling back the optimistic
  line and surfacing the real error on failure.
- The checkout route is a real server component resolving cart token, authoritative
  cart, capabilities, gateways (COD only) and shipping methods, rendering the
  previously unmounted `CheckoutForm`. The mock `checkout-client.tsx` is deleted.
- `serializeCartItems` emits `{productId, slug, quantity, variationId}`; the server
  validates the shape and rejects a payload whose variation is not in the
  authoritative cart (`cartCoversPayload`, -> `cart_out_of_sync`). No client-supplied
  price or total is accepted anywhere.
- Empty-cart and no-session states return explicit errors; the guest path requires no
  account.

## Verification

| Check | Result |
| --- | --- |
| `vitest run apps/storefront/src/stores/cart-store.test.ts apps/storefront/src/features/checkout/model/cart-payload.test.ts` | exit 0 — 24 passed |
| Two variations of one product | two lines, correct quantities, variation retained |
| Same variation added twice | increments by the requested quantity |
| Payload variation absent from the authoritative cart | rejected, not ordered |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 |
| `tsx scripts/check-engine-imports.ts` | exit 0 |
| `vitest run` (whole suite) | exit 0 — 521 passed |

## Not proven — the audit's core complaint stands until this is done

**No real browser placed a real order against real WooCommerce.** There is no live
WordPress. Unit tests prove the wiring; they do not prove a customer can buy. That
requires a browser driving a served storefront against a live Woo instance, covering
out-of-stock, retry, shipping and tax — ECO-1009 and a staging environment.

`cartCoversPayload` assumes the engine maps a variation cart line to
`productId === variantId === variation id`; verified against the mapper source only,
not against real Woo.
