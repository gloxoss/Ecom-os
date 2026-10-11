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

## A "simple product cannot be checked out" claim — withdrawn. It was the harness.

This document briefly recorded a confirmed defect here: a simple product returned
`cart_out_of_sync` while variable products worked. **That was wrong, and it is withdrawn.**

The cause was in the test harness, not the storefront. The driver read the variation id as
`process.env.VARIATION_ID || '12'`, so passing an *empty* value for a simple product fell
back to `'12'` — the browser then claimed it had put variation 12 in the cart while the
authoritative cart held simple product 10. `cartCoversPayload` refused the submission, which
is precisely its job: an order must never be submitted against a cart that does not contain
what the browser thinks it does.

With the harness fixed (`process.env.VARIATION_ID === undefined ? '12' : process.env.VARIATION_ID`),
a simple product checks out normally:

```
simple product 10 x 1  ->  order 30, wc-processing, guest (customer_id 0), COD
confirmation: "n° 30", "Total : 636.00 MAD"   (500 goods + 30 shipping + 106 VAT)
```

So the guard is not only correct but load-bearing: this is the same check that refused the
mismatched payload, exercised for real twice in this round. The lesson recorded here is the
one worth keeping — a guard that refuses a submission is not evidence of a defect until the
submission itself has been verified.

Both product shapes now have executed purchases through the storefront: variable (orders
17, 18, 20, 25, 29) and simple (order 30).

## Client 2 — what happened on the second attempt

Re-run after the harness fix. The earlier client-2 refusal (`cart_out_of_sync`) is now
explained: it was the same driver bug that produced the false simple-product defect — the
browser claimed variation 12 against a simple-product cart. **The guard was not at fault.**

A completed client-2 order was still not obtained, for a different and unrelated reason:
client 2's WordPress, served by PHP's built-in single-threaded server, began timing out
after 30 seconds inside WooCommerce (`Maximum execution time of 30 seconds exceeded ...
woocommerce/includes/abstracts/...`), consistent with a loopback request deadlocking
against the same server that is handling it. `DISABLE_WP_CRON` was set and the server
restarted; the timeout persisted. Client 1 on the same MySQL instance and the same PHP
binary continued to serve normally.

**Not proven either way** whether that is purely a single-threaded-server artefact or
something in client 2's configuration. It is recorded as an environment failure, not as a
product defect, and no client-2 order is claimed.

Established about client 2 regardless: a separate directory, database (`ecomos_client2`),
port, salt set, REST key pair and currency (EUR), serving its own catalog — and, at an
earlier point, the storefront reached its checkout with a real client-2 cart.

## Production CSP and TLS — why they are not merely unstarted

An attempt to observe production response headers locally failed at the build, with a
**real and correct** guard rather than an environment quirk:

```
Error: WC_REST_URL must use HTTPS without embedded credentials.
  at Failed to collect configuration for /[locale]/legal/privacy
```

`apps/storefront/src/lib/runtime-config.ts` refuses to run in production against a
non-HTTPS backend. That is the right behaviour, and it has a direct consequence: the
production CSP (nonce + `strict-dynamic`) and real TLS **cannot be exercised against this
machine's plain-HTTP local WordPress**. Doing so requires terminating TLS in front of
WordPress — a certificate and a TLS-capable server (Local ships nginx 1.26, which was not
configured here).

So this item is not "unstarted for lack of effort"; it is blocked by the application's own
production configuration guard, which is evidence that production configuration *is*
validated rather than assumed. The development-mode headers observed earlier (CSP present,
`X-Frame-Options: DENY`, `nosniff`, `HSTS`, `Referrer-Policy`, `Permissions-Policy`) remain
the only headers measured, and the development CSP policy is the permissive one, **not** the
production nonce policy.

## The Next.js → WordPress RFQ rewiring: why it is a refactor, not an adapter

Investigated to start it. The plugin's REST contract is clean:

```
POST   /wp-json/ecomos/v1/rfq/quotes        create            (active check)
GET    /wp-json/ecomos/v1/rfq/quotes/{id}   read              (guest token or staff)
POST   .../offers  .../accept  .../reject  .../revise  .../convert  .../document
```

The blocker is **who owns the quote's identity**. `ecomos_rfq_rest_create_quote` generates
the id, the quote number and the access secret itself:

```php
$secret_hash = hash('sha256', $secret);
$quote_id = 'quote_' . wp_generate_uuid4();
$quote_num = 'DEV-' . gmdate('Y') . '-' . wp_rand(1000, 9999);
```

whereas `apps/storefront/src/app/api/rfq/route.ts` generates its own id, number and
`accessSecret` locally and returns *those* to the guest. A WordPress-backed store therefore
cannot be dropped in behind the existing route: the route would create a quote in WordPress,
receive a different id and secret back, and still hand the guest its own. The guest's secret
would not be the one WordPress has hashed, so no subsequent read, accept or reject would
authorize.

Doing this properly means moving identity ownership from the Next.js route to WordPress:
the route takes the id, number and secret from the create response, the owner-binding for
idempotent replay keys off what WordPress returns, the offer/accept/reject paths use the
WordPress id, and the route's own tests change with it. That is a designed refactor of the
RFQ submission path, not an adapter behind the existing store interface.

**Not started, deliberately.** It is ordinary work with no authorization blocker, and it is
the honest next task — but it is a multi-file change to the identity of a workflow whose
guest-secret handling is security-relevant, and it should be done with room to implement,
test and verify rather than started and abandoned.

Everything else about finding 3 stands as recorded above: the storefront's shared store,
mounted routes, owner-bound replay and addon-off isolation are real, and WordPress
persistence is proven at the plugin level (quotes and revisions in `wp_ecomos_rfq_*`, the
state machine exercised, conversion producing one linked order under concurrency).

### The concrete blocker: the store interface is synchronous

A second investigation narrowed "it is a refactor" to a specific, technical reason that does
not depend on judgement:

```ts
export interface RfqQuoteStore {
  getQuote(id: string): RfqQuote | undefined;      // synchronous
  putQuote(quote: RfqQuote): void;                 // synchronous
  listQuoteIds(): string[];
  getIdempotency(key: string): StoredIdempotencyEntry | undefined;
  putIdempotency(key: string, entry: StoredIdempotencyEntry): void;
  clear(): void;
}
```

A WordPress-backed store must make an HTTP request per operation, and `fetch` is
asynchronous. It therefore cannot implement this interface. The alternatives are:

1. **Make the interface asynchronous** (`Promise<RfqQuote | undefined>`, …), which ripples
   through `app/api/rfq/route.ts`, `app/api/rfq/offers/route.ts` and every test that drives
   them through `setRfqQuoteStoreForTesting`.
2. **Block on HTTP inside the store**, which would stall the event loop on every quote read
   and is not acceptable in a Next.js route.

Option 1 is the correct one and is the work. Combined with the identity question above
(`ecomos_rfq_rest_create_quote` generates its own id and secret, or the plugin must accept
caller-supplied ones), the task is: a plugin change, an async conversion of the store
interface, updates to both routes, and updated tests — then verification that a quote
submitted through `/api/rfq` appears in `wp_ecomos_rfq_quotes` and that a guest token read
authorizes through WordPress.

**Not started, and the reason is now specific**: it is a multi-file signature change to a
security-relevant workflow, and the remaining budget in this session is not enough to
implement *and verify* it. An unverified rewrite of the RFQ persistence layer left in the
tree would be worse than a precisely documented gap — and the audit's own standard is that
unverified work must not be presented as done.

### The RFQ rewiring, broken into steps — step 1 is done

**Step 1 — done (commit `25b6679`).** `RfqQuoteStore` is now asynchronous, with every call
site awaiting it. Verified: tsc 0, vitest 521, node:test 71, eslint 0.

**Step 2 — the WordPress store and the plugin's identity handover.** Two changes together,
because either alone is wrong:

- `plugins/wp-ecomos-rfq/routes.php`: `ecomos_rfq_rest_create_quote` currently generates the
  quote id, number and access secret itself, so a caller cannot persist a quote whose
  identity it already issued to a guest. It must accept a caller-supplied `id`,
  `quote_number` and `access_secret_hash` (validated: `[\w-]+`, a semver-shaped number, a
  64-hex hash) and fall back to generating them when absent.
- A `WordPressRfqQuoteStore` implementing the now-async interface against
  `POST /wp-json/ecomos/v1/rfq/quotes` and `GET /wp-json/ecomos/v1/rfq/quotes/{id}`,
  selected when `ECOM_RFQ_WP_URL` is configured.

**Step 3 — guest authorization moves to WordPress.** This is the part that makes it a
refactor rather than an adapter, and it is not optional:

```php
// ecomos_rfq_rest_get_quote
// Scrub secret hash before transmitting
unset($quote['access_secret_hash']);
```

The plugin deliberately never transmits the secret hash. `offers/route.ts` authorizes the
guest by hashing the presented token and comparing it to `quote.accessSecretHash`, which a
WordPress-backed store can therefore never supply. Authorization has to move server-side to
WordPress — the store's read needs to carry the guest token and let
`ecomos_rfq_rest_check_read_permission` decide — which changes the store interface again
(a token-aware read) and the offers route with it, plus its tests.

Steps 2 and 3 were not started. Step 1 is a real, verified increment toward them; starting
step 2 without the budget to reach step 3 would leave a WordPress store that cannot
authorize a guest read, which is worse than the honest gap.

### Final conclusion: the store interface is the wrong abstraction for WordPress

A fourth investigation, and this one changes the shape of the remaining work rather than
adding a step to it.

`offers/route.ts` performs state transitions by mutating the whole quote and writing it
back:

```ts
const nextQuote = transition(quote, 'accepted', guestActor, { revisionId });
quote.state = nextQuote.state;
await store.putQuote(quote);
```

repeated for `rejected` and `revision_requested`. WordPress does not model quoting that way.
Each transition is its own endpoint with its own authorization and its own server-side state
machine:

```
/quotes/{id}/offers   /quotes/{id}/accept   /quotes/{id}/reject
/quotes/{id}/revise   /quotes/{id}/convert  /quotes/{id}/document
```

A generic `putQuote(quote)` cannot express "accept, with this revision" versus "reject, with
this reason" to those endpoints. Combined with the three findings above — the interface was
synchronous, the plugin generates its own quote identity, and the plugin never transmits
`access_secret_hash` — the store abstraction is simply not the right shape for a
WordPress-backed RFQ layer.

**The correct design is an API client, not a store.** A WordPress-backed RFQ layer is a set
of named operations:

```ts
interface RfqClient {
  submitQuote(input): Promise<SubmittedQuote>;      // POST /quotes
  getQuote(id, accessToken?): Promise<RfqQuote>;    // GET  /quotes/{id}, WP authorizes
  acceptOffer(id, revisionId, token): Promise<void>; // POST /quotes/{id}/accept
  rejectQuote(id, reason, token): Promise<void>;     // POST /quotes/{id}/reject
  requestRevision(id, notes, token): Promise<void>;  // POST /quotes/{id}/revise
  convert(id): Promise<ConvertedOrder>;              // POST /quotes/{id}/convert
}
```

with the local in-memory and file implementations providing the same operations for tests
and single-host runs. That is a change of abstraction across the two routes, the domain
package and the tests — real, well-specified work, and the honest description of what
"wire the RFQ routes to WordPress" means.

**Step 1 (async store interface, commit `25b6679`) remains a genuine prerequisite** — the
client's methods are asynchronous too — but it is a prerequisite, not the refactor. Anyone
picking this up should start from `RfqClient` above, not from a `WordPressRfqQuoteStore`.

Not started, and this is the last thing I will record on it: implementing the client without
the budget to verify the accept/reject/revise paths against WordPress would leave a quoting
workflow that looks wired and is not.

## Finding 3 — CLOSED: the storefront's RFQ routes now persist through WordPress

Executed against the live instance, not asserted. The storefront's own routes were pointed
at the plugin with `ECOM_RFQ_WP_URL=http://localhost:8080/wp-json/ecomos/v1/rfq`:

```
POST /api/rfq  (the storefront route)
  -> 201 {"success":true,"quoteId":"quote_mv3s9shz_3215","quoteNumber":"DEV-2026-3215",
          "accessSecret":"07b6ce10...","state":"submitted"}

wp_ecomos_rfq_quotes, before 5 rows -> after 6 rows:
  quote_mv3s9shz_3215 | DEV-2026-3215 | submitted | Salma Tazi | salma@riad-design.ma
```

The row carries the id the **storefront** issued and the contact that was **submitted**, so
the quote the guest holds is the quote WordPress stores.

```
GET /api/rfq/offers?quoteId=quote_mv3s9shz_3215   x-quote-token: <the guest's secret>
  -> 200 {"success":true,"quote":{"id":"quote_mv3s9shz_3215","quoteNumber":"DEV-2026-3215",
          "state":"submitted","contact":{...},"items":[{"productId":50,...}]}}

GET ...  x-quote-token: wrong
  -> 404 Quote not found
```

The read is the storefront's route, the data comes from WordPress, WordPress performs the
authorization, and a wrong secret fails closed.

### What this required, and why it was a refactor

Four changes, each found by doing the work rather than reasoning about it:

1. **The store interface was synchronous** (commit `25b6679`). A store that makes HTTP
   calls cannot implement it without blocking the event loop, so the interface and every
   call site became asynchronous.
2. **The plugin generated the quote identity itself** (commit `5ed681c`). It now accepts a
   caller-supplied id, number and hash, validated with fallbacks, and no longer returns a
   generated secret when the caller supplied the hash — that value would have authorized
   nothing. Verified live: the supplied identity lands in the table and the guest's own
   plaintext authorizes the read (200) while a wrong one is refused (403).
3. **Guest actions are named operations, not a whole-quote write** (commit `3f5fb3a`).
   WordPress exposes `/accept`, `/reject` and `/revise` as separate authorized endpoints,
   so `putQuote(mutatedQuote)` could not express them. A test caught that the domain state
   machine enforces `actor.id === quote.accessSecretHash`, so the actor is built from the
   loaded quote.
4. **Authorization had to move into the store.** `ecomos_rfq_rest_get_quote` never
   transmits `access_secret_hash`, so the routes' local hash comparison can never succeed
   against WordPress. `getQuote` now carries the guest's token and a quote with no stored
   hash is read as "the store already authorized this".

### Limits of this implementation, stated plainly

- **Idempotency has no plugin endpoint**, so `WordPressRfqQuoteStore` keeps it in a
  process-local map. A multi-worker deployment would need it in WordPress.
- **`listQuoteIds()` returns empty** for the WordPress store; the plugin exposes no list
  endpoint.
- **Staff access is implemented but not exercised.** `ECOM_RFQ_WP_USER` and
  `ECOM_RFQ_WP_APP_PASSWORD` are sent as Basic auth when set, which is what the plugin's
  staff endpoints expect; no authenticated session was used.
- **Restart survival** is inherent — WordPress owns the data — but was not separately
  re-tested after this change.

Remaining from the audit overall is unchanged: the product-page path (needs
`wp-graphql-woocommerce`), production CSP/TLS (needs a certificate), a completed
second-client order, and the owner's merchant facts.

## Correction to the product-page plan: it does not need the owner's authorization

Earlier entries here recorded the product-page → cart gap as blocked on installing
`wp-graphql-woocommerce`, and asked for authorization to fetch it. That was the wrong
conclusion, and it is worth correcting because it removes an unnecessary dependency on the
owner.

The engine fetches products only through GraphQL (`packages/engine-woocommerce/src/products.ts`,
`fetchProducts` / `fetchProductBySlug`), which is why the bridge looked required. But
**WooCommerce's Store API already serves the catalog** — the same endpoint this work has
been using successfully throughout for cart and checkout:

```
GET /wp-json/wc/store/v1/products        -> 2 products, with prices, currency, type and stock
GET /wp-json/wc/store/v1/products?slug=… -> a single product
```

So the product-page gap can be closed **inside this repository**, with no plugin install and
no new dependency: add a Store-API product fetch and a mapper from the Store API product
shape to the `Product` domain type, and let `getProduct`/`listProducts` fall back to it (or
prefer it). That is ordinary engine work with a live instance available to verify it — the
same instance that produced orders 17, 18, 20, 25, 29 and 30 — and it would close finding 1
completely, including the product-page entry point.

What it needs from whoever picks it up:

- a `mapStoreProduct` covering id, slug, name, sku, prices, images, type and inventory;
- variation handling: the Store API lists variations for a variable product, and the
  variation selector needs their prices and attributes, so each may need a follow-up read;
- a decision on precedence when both transports are configured (probably Store API first,
  GraphQL as the richer fallback);
- verification by loading a real product page in a browser and clicking add-to-cart, then
  completing the purchase — which the existing harness already does end to end once the
  cart is seeded.

Not started: the remaining budget in this session cannot implement *and* verify a mapper
plus variation handling, and an unverified mapper would be the same class of failure this
audit was written about.

## Store-API product path — added, and what it proved

`getProduct` no longer depends solely on GraphQL. It tries GraphQL first (which carries
variations with their prices), and when that is unavailable — no WPGraphQL for WooCommerce
bridge — falls back to the Store API and a new `mapStoreSimpleProduct` mapper.

Verified live: `GET /wp-json/wc/store/v1/products?slug=local-test-simple` returns the
product (`Local Test Simple`, `simple`, 50000 minor units), the fallback fetched it, and
the product name rendered in the page HTML. **The Store API is a working, plugin-free route
to a product.**

The product **page** still returns 500, for a reason this exposed rather than caused: the
page also calls `listCategories()` and `listProducts()` for its category list and related
products, and both are still GraphQL-only, so they throw with the bridge absent. Closing
the product-page entry point needs those two mapped from the Store API as well
(`/products` and `/products/categories`), and — deliberately — not by swallowing the
errors, which would render a silently half-empty page.

So finding 1's remaining piece is now precisely scoped: three Store-API reads
(product, product list, categories) instead of a plugin install, with `getProduct` already
done and proven.

## The product page renders with no GraphQL bridge — and the click-through is not yet verified

Added Store-API fallbacks for the three reads that gated the page — product, product list
and categories — so the engine no longer needs the WPGraphQL for WooCommerce bridge to
serve a catalog.

**Verified live:** `GET /product/local-test-simple` returns **200** and the page renders
the product name, its price (`500.00`) and the add-to-bag button. That is the entry point
the audit's finding 1 was missing, reached with no plugin installed.

**Not verified:** the click-through. A browser run loaded the page, clicked the real
add-to-bag button, and then found the cart empty at checkout — the badge did not increment
and the button never entered its "Added to bag" state, so `addToCartAction` did not take
effect in that run. **The cause is not established.** Candidates, none confirmed:

- the add-to-cart server action failed against this instance (its error is surfaced to the
  user in the UI and logged, not thrown to the browser, so the run would look like this);
- the click landed before hydration completed;
- the selector matched a different button than the one wired to the handler.

Reproducing it needs the dev server's log alongside the browser run, which this session no
longer had budget for. It is recorded as unverified rather than as working, because
"renders" and "can be bought" are different claims and only the first is proven here.

So finding 1's status: purchases are **proven** through the shelf-to-order flow with the
cart seeded by the same Store API call the button issues (orders 17, 18, 20, 25, 29, 30,
including the product-page case only in the seeded form), the product **page** now renders
without a bridge (proven), and the **click from that page** is the one remaining
unverified link.
