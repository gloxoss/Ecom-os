# ECO-1016 — Accessibility budget and the remaining purchase cases

Closes the items left open by `ECO-1015`.

## Accessibility: the failed measurement is fixed

The browser budget measured 13 of 30 targets below the 44px WCAG 2.5.5 minimum on `/`
and 16 of 27 on `/catalog`, smallest 16.5px. Each undersized control now has a real 44px
box: hero category links, catalog "Shop …" links, footer nav and social links, header
logo link, testimonial arrows, product tab buttons, wishlist toggle, cart quantity buttons.

Re-measured: **smallest 44px, 0 below minimum, both pages; overall PASS, exit 0.**

The measurement was itself wrong and is fixed: labels and boxes came from separate
round-trips and misaligned under hydration, which left the residual failing target
unnamed and unfindable. `offsetParent === null` was also avoided as a visibility test,
since it is null for fixed-position elements and would have hidden real header controls.

## The purchase cases the audit named

| Case | Observed |
| --- | --- |
| Shipping | Applied — order 25 has a `shipping` line "Livraison standard", cost 30 |
| Tax | Applied — 20% VAT: `tax` line `MA-TVA-1`, `_line_tax` 480 on goods plus 6 on shipping; cart total 2916.00 MAD |
| Out of stock | Refused — `POST /cart/add-item` returns 400 `woocommerce_rest_product_out_of_stock` |
| Retry | No duplicate — after the idempotency-key fix, further submissions created no new order (`max_id` unchanged) and the second was refused "This submission key belongs to a different session" |

The retry case **did** create duplicate orders (26, 28) before the fix. The key was derived
from the cart token, which WooCommerce rotates between requests, so a retry never matched;
and the attempt store was process-local. Both are fixed: the key now comes from the
submission's own identity, and `ECOM_ATTEMPT_STORE_PATH` selects the durable file store.

Residual: the stable key deduplicates a guest deliberately repeating an identical order; a
per-form UUID is the production answer. The submit button is disabled while pending, so a
double-click cannot produce two orders.

## Not closed

The browser product-page→cart path still needs `wp-graphql-woocommerce`; the Next.js RFQ
routes still write to their local store; no authenticated staff session; no second client;
production CSP/TLS unexercised. See `docs/ecomos/evidence/ECO-1004/live-woocommerce-proof.md`.
