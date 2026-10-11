# Live WooCommerce proof — real orders, real HPOS, real restore

- **Date:** 2026-10-11 · **Tasks:** `ECO-1004`, `ECO-1006`, `ECO-1007`, `ECO-1013`
- **What this replaces:** every "blocked on a live WordPress" note in this round. A real
  environment was built on this machine from components already present, so the audit's
  central claims are now **executed**, not source-confirmed.

## The environment

Built with no new downloads, from what was already on the machine:

| Component | Source |
| --- | --- |
| WordPress 7.1.3 | Local's own cache, `%APPDATA%/Local/cached-wordpress/wordpress-7.1.3-en_us.tar.gz` |
| MySQL 8.4.0 | `%APPDATA%/Local/lightning-services/mysql-8.4.0+2` |
| PHP 8.2.29 (mysqli, curl, mbstring, gd, intl, zip) | `%APPDATA%/Local/lightning-services/php-8.2.29+0` |
| WooCommerce 11.2.1 | wp-cli's download cache, `~/.wp-cli/cache/plugin/woocommerce-11.2.1.zip` |
| WPGraphQL 2.23.1 | cached (not used — see "not proven") |

Location `C:/wp-local` (outside the repository). HPOS enabled
(`woocommerce_custom_orders_table_enabled=yes`). Currency MAD, country MA, COD gateway,
one flat-rate shipping zone, one simple product and one variable product with variations
12 (Taille S, 1200) and 13 (Taille M, 1500).

**Environment shim, disclosed:** PHP's built-in server cannot do TLS and WooCommerce only
performs REST basic-auth when `is_ssl()`. The local router marks `/wp-json/` requests as
SSL so the key/secret path is exercised. The transport is plain HTTP on localhost; there
is no real TLS here and none is claimed.

## Finding 1 — a real guest purchase through the storefront

Across three runs a real Chromium browser (playwright 1.64 driving the installed
chromium-1243 build) loaded the storefront served by `next dev` against this
WooCommerce, with the Woo cart seeded to a specific variation through the same Store API
call the add-to-cart action uses, and the client cart seeded as the product page would.

| Order | Variation | Qty | Total (Woo) | Customer | Payment | Storage |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | 12 (Taille S) | 2 | 2400.00 MAD | 0 (guest) | cod | HPOS |
| 18 | 13 (Taille M) | 3 | 4500.00 MAD | 0 (guest) | cod | HPOS |
| 20 | 12 (Taille S) | 2 | 2400.00 MAD | 0 (guest) | cod | HPOS |

Verified directly in MySQL:

```
wp_wc_orders:        id 20 | wc-processing | 2400.00000000 | MAD | customer_id 0 | cod
item meta:           _product_id 11 | _variation_id 12 | _qty 2
wp_posts shop_order: 0 rows          <- genuinely HPOS, not legacy post storage
```

The confirmation page rendered, from the storefront, the WooCommerce values:
`Commande enregistrée — Votre commande n° 20 a été créée. Statut WooCommerce: processing.
Total: 2400.00 MAD`, with the cart cleared.

**Private read-back, with a negative control.** The page takes the HMAC guest grant from
the URL fragment (never sent to a server) and exchanges it at `/api/orders/status`:

```
GET /api/orders/status?orderId=20                        -> 400
GET /api/orders/status?orderId=20  x-order-token: bogus   -> 403
  {"ok":false,"error":"Unauthorized: order ownership proof missing or invalid."}
```

**Two real defects the browser found, both fixed:**

1. `fetchCartAction` persisted a Cart-Token during server render, which Next forbids
   ("Cookies can only be modified in a Server Action or Route Handler"). The throw took
   the page down and the checkout showed *"Your cart is empty"* to a shopper whose cart
   had items. Persisting is now best-effort during render; the next Server Action writes it.
2. The form collected no State/County, and WooCommerce requires one for Morocco, so every
   Moroccan checkout failed with *"State / County is required"*. A region select is now
   rendered from `CHECKOUT_STATES`, generated from WooCommerce's own 75 MA regions, so
   France (which ships no list) does not show the field.
3. The success state was rendered inline, and because placing an order clears the
   Cart-Token the route re-rendered into its empty-cart branch and destroyed the
   confirmation before it could be read. The action now redirects to `/checkout/success`,
   which verifies the order before displaying anything.

**Also observed and correct:** a payload whose variation is not in the authoritative cart
is refused with `cart_out_of_sync`. That guard fired for real during this work when the
browser claimed variation 12 while the cart held 13.

## Finding 1 — the four cases the audit named

With a 20% Moroccan VAT rate (`woocommerce_calc_taxes=yes`, tax applied to shipping) and
a flat-rate shipping zone in place, the same cart produced, from WooCommerce:

```
subtotal 240000 (2400.00) | shipping 3000 (30.00) | tax 48600 (486.00) | total 291600 (2916.00) MAD
```

and a browser purchase through the storefront completed order 25 with the confirmation
reading `Total : 2916.00 MAD`. In the database, order 25 carries a `line_item` for
"Local Test Variable - S" (`_variation_id` 12, `_qty` 2, `_line_total` 2400,
`_line_tax` 480), a `shipping` line "Livraison standard" (`cost` 30, `total_tax` 6) and a
`tax` line `MA-TVA-1`, with `total_amount 2916.00` and `tax_amount 480.00`.

| Case | Result |
| --- | --- |
| Shipping | Applied: 30.00, as a real `shipping` order line |
| Tax | Applied: 486.00 total (20% of goods and shipping), as a real `tax` order line |
| Out of stock | Refused. With variation 13 at zero stock, `POST /cart/add-item` returns **400** `woocommerce_rest_product_out_of_stock` — "You cannot add 'Local Test Variable - M' to the cart because the product is out of stock." |
| Retry | Does not duplicate — see below |

## A real idempotency defect, and the fix

Retrying the same purchase **created duplicate orders** (26 and 28) even with the
in-memory guard in place. Two distinct causes, both real:

1. **The key was derived from the cart token**, which WooCommerce rotates between
   requests: `key = token:email:address1`. A retry therefore always derived a different
   key and the guard could never match. The key is now derived from what actually
   identifies a submission — email, phone, address, postcode, city — so it is stable
   across retries.
2. **The attempt store was process-local**, so a fresh module instance lost it. The
   storefront now points `ECOM_ATTEMPT_STORE_PATH` at the durable file store, which
   survives restarts and is visible on disk:

```
$ node -e "const j=require('C:/wp-local/attempts.json'); ..."
entries 3 | CONFIRMED#27, CONFIRMED#28, CONFIRMED#29
```

After the fix, two further submissions of the same order produced **no new order**
(`max_id` stayed 29). The second was refused with the ownership guard:

```
La commande n'a pas pu être enregistrée (This submission key belongs to a different session.)
```

That is `OWNER_MISMATCH` from the owner-binding work: a key bound to one cart is never
served to another. A same-owner retry replays the confirmed attempt instead (covered by
the engine unit tests and the `CONFIRMED` records above).

**Residual, stated plainly:** the stable key means a guest who deliberately places the
same order twice from the same address is deduplicated. The production answer is a
per-form UUID generated when the checkout form mounts; that is not implemented, and the
form's submit button is already disabled while a submission is pending, so a double-click
cannot produce two orders.

## Finding 4 — concurrent conversion against a real database

The companion plugin was activated on this WordPress (its `wp_ecomos_rfq_quotes` and
`wp_ecomos_rfq_revisions` tables created). A quote in state `accepted` was converted by
**two OS processes started simultaneously**:

```
process 1 -> OK {"orderId":"21","state":"converted_to_order","isDuplicate":false}
process 2 -> WP_ERR code=conversion_in_progress
             "Another conversion is already running for this quote"
```

Database afterwards:

```
wp_ecomos_rfq_quotes:  quote_conc_1 | converted_to_order | converted_order_id 21
orders linked to the quote: exactly 1 row (_ecomos_rfq_quote_id = quote_conc_1)
order 21: variation 12, qty 2
retry afterwards -> {"orderId":"21","isDuplicate":true,
                     "message":"Quote was already converted into an order"}
```

One linked order under concurrency, and a retry that returns the same order rather than
creating a second. This is finding 4's acceptance criterion, executed.

**A third real defect found here.** A revision stored without a currency produced an order
in **USD** on a MAD store — `repository.php` defaulted the column to a hardcoded `'USD'`
and `schema.php` did the same. Both now fall back to `get_woocommerce_currency()`.
Re-verified: an accepted quote carrying no currency converted to
`order 24 | 2400.00000000 | MAD`. Note `dbDelta` did not alter the existing column
default, so the column change applies to fresh installs; the code path is what fixes
existing ones.

## Finding 7 — a real backup import and rollback

```
mysqldump ecomos_wp                     -> 289,750 bytes, 54 CREATE TABLE
scripts/verify-restore.ts --dump ... --target-db ecomos_restore \
  --confirm-target ecomos_restore --confirm-drop ecomos_restore
```

```
tables imported                -> 54 tables                       PASS
HPOS orders table present      -> present                         PASS
HPOS order total integrity     -> 0 orders with a null total      PASS
guest orders preserved         -> 10 guest orders (customer_id 0) PASS
RFQ quote state integrity      -> 0 quotes with an empty state    PASS
RFQ revisions reference quotes -> 0 orphan revisions              PASS
rollback rehearsal             -> target dropped, confirmed absent PASS
[RESTORE-VERIFIED] exit 0
```

The script first **refused** a bad artifact: a `mysqldump --databases` dump embeds
`USE ecomos_wp`, so the import landed in the source database and the target had 0 tables.
It reported `status: "FAIL"`, `0 table(s) in ecomos_restore`, exit 1 — instead of
certifying a restore that had not happened. That is the fail-closed behaviour the audit
asked for, observed in practice.

## Finding 6 — real HPOS and Store API operations

Orders created through the WooCommerce Store API are stored in the HPOS tables
(`wp_wc_orders`, `wp_wc_orders_meta`, `wp_wc_order_product_lookup`,
`wp_woocommerce_order_items`) with `wp_posts` holding zero `shop_order` rows. The Store
API served the catalog, cart, and checkout over HTTP. The static compatibility auditor and
`php -l` results are recorded in the `ECO-1007` and `ECO-1011` evidence.

## Not proven, stated precisely

1. **The storefront product page → cart path in a browser.** It needs
   `wp-graphql-woocommerce`, the WooCommerce GraphQL bridge, which is not present on this
   machine; the engine fetches products only over GraphQL. Installing it would be a new
   plugin acquisition beyond the hub's stated scope, so it was not done. The variation and
   quantity reaching the order were therefore seeded through the same Store API call
   `addToCartAction` issues, not clicked on a product page.
2. **The Next.js RFQ routes writing to WordPress.** Real WordPress persistence of quotes
   and revisions is proven at the plugin level; the storefront's RFQ routes still use the
   local store. Wiring them to the plugin's REST namespace remains.
3. **Merchant/staff access with a real capability.** The permission callback is source-
   verified and unit-checked; no authenticated WordPress session was used.
4. **A second isolated client.** None exists.
5. **Production behaviour.** This was a local dev environment on plain HTTP. Production CSP
   (nonce + `strict-dynamic`) and real TLS were not exercised.

## Cleanup

The storefront's `.env.local` was backed up to `C:/wp-local/env.local.backup` before the
local values were written and **restored afterwards**. The test environment lives outside
the repository at `C:/wp-local` and nothing in it is committed.

## Finding 5 — a second isolated client

A genuinely separate second deployment was built from the same components, with nothing
shared with the first:

| | Client 1 (ParaLoca) | Client 2 (Nordic Craft Supplies) |
| --- | --- | --- |
| Directory | `C:/wp-local` | `C:/wp-local2` |
| Database | `ecomos_wp` | `ecomos_client2` |
| Port | 8080 | 8081 |
| Salts / keys | client 1 set | **a different set** (`client2-*`) |
| Currency | MAD | **EUR** |
| REST credentials | client 1 key pair | **a different key pair** |
| Catalog | "Local Test Variable", "Local Test Simple" | "Client2 Widget", 79.00 EUR |

Verified: client 2 served its own Store API (`/wp-json/wc/store/v1/products` -> 1 product,
`Client2 Widget`, `7900 EUR`), which client 1's database does not contain. `ecomos_client2`
is a separate schema; the two installs share only the MySQL server process and the PHP
binary. The storefront was then pointed at client 2 (different URLs, different REST keys,
different encryption/session secrets) and reached its `/checkout` with a real client-2 cart
(3 x Client2 Widget).

**Not established: a completed order on client 2.** The submission was refused by the
cart/data-integrity guard with `cart_out_of_sync` — the browser's claimed line did not
match the authoritative cart line. That is the guard behaving as designed, and it is
recorded as a refusal rather than worked around. Whether it reflects a guard nuance for
simple products or an artefact of how this harness seeds the client cart is **not
determined**, and no client-2 order is claimed.

What this establishes is the architecture the audit asked about: isolated client
installations, each with its own deployment, WordPress, database and secrets, are what this
codebase serves — not a shared multitenant platform, and the same storefront build drives
both.

## CONFIRMED OPEN DEFECT — a simple product cannot be checked out

Found while testing the second client, reproduced on client 1, **not fixed**.

```
Authoritative cart:  id=10  type=simple  variation=[]  qty=1
Browser payload:     [{productId:"10", slug:..., quantity:1}]
Result:              "La commande n'a pas pu être enregistrée (cart_out_of_sync)"
```

`submitCheckoutFormAction` refuses the submission at
`cartCoversPayload(parsed.lines, cart.items)`. Every order placed successfully in this
round was a **variable** product, where the payload carries a `variationId` and matches the
authoritative line by variation identity. For a simple product the payload has no
`variationId`, so the matcher takes its second branch:

```ts
return item.productId === line.productId && !item.variantId;
```

Both sides appear to read "10" — the Store API cart dump shows `id=10` and
`mapStoreCartItem` sets `productId = String(raw.id)` — so the mismatch is **not explained**
by source reading alone. Two candidates remain, neither confirmed:

1. The cart line the action fetches is not the line the browser holds. The server log shows
   `[fetchCartAction] Cart-Token not persisted in this phase` on every request, i.e.
   WooCommerce is rotating the Cart-Token and the new one cannot be written during render.
   The action may therefore evaluate a different cart than the one the payload describes.
2. A type or identity difference on one side (`String` vs number, line key vs product id)
   that `===` rejects.

**Impact:** a guest can buy a variable product but **not a simple one** — a headline
acceptance path of finding 1. Reproduce with a simple WooCommerce product, seed the cart via
`POST /cart/add-item`, seed the client cart, and submit; it returns `cart_out_of_sync` every
time.

This is recorded as an open defect rather than closed, and rather than papered over by
loosening the guard: the guard is doing its job by refusing a submission it cannot verify.
