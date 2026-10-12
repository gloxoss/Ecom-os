# Item 2 Live Guest Buying Evidence Report

- **Date:** 2026-10-12
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Target Backend:** `https://paraloca.local` (Local app, site "paraloca", MySQL port 10005, WooCommerce 11.2.1, HPOS enabled)
- **Storefront Runtime:** `http://localhost:3000` (Next.js 16.3.8 production mode)
- **Test Runner:** Playwright Chromium / System Chrome (`C:\Program Files\Google\Chrome\Application\chrome.exe`)

## Executed Suite
- File: `apps/storefront/e2e/sprint-b-commerce.spec.ts`
- Environment: `ECOM_LIVE_MUTATIONS=1`, `ECOM_STAGING_URL=https://paraloca.local`, `NODE_EXTRA_CA_CERTS=...paraloca.local.crt`, valid `WC_REST_URL/KEY/SECRET`
- Result: 8 passed, 1 skipped (30.6s execution)

## Verified Acceptance Criteria
1. **Catalog & Variation Selection (PDP):**
   - Exact-SKU search navigates to search results and discovers matching synthetic product.
   - Variable product (`/product/ecomos-test-variable`) renders attribute radio buttons (`Standard`).
   - Selecting variation resolves price to `79.50 MAD` and enables purchasable action (`Add to bag`).
2. **Cart Edits & Persistence:**
   - Adding variable item increments cart count in nav (`Cart (1)`).
   - Quantity edit via cart control and item removal verified.
   - Persistence verified across browser reload.
3. **Checkout & COD Conversion:**
   - Filled full guest address (Casablanca/Fes, MA, state dropdown selected, address textarea populated).
   - Submitted Cash on Delivery (`cod`) order.
   - Client successfully navigated to `/checkout/success?order=<id>#token=<grant>`.
   - Verified owned confirmation text displayed ("Commande enregistrée", "Votre commande n° <id> a été créée.").
4. **Authoritative HPOS Order Verification:**
   - Order #18 created in WooCommerce HPOS with `customer_id: 0` (guest), status `processing`, currency `MAD`.
   - Durable attempt correlation preserved: `[ecomos-attempt:att_fed8356a-a521-44b3-812c-ab4bff8995ab]`.
   - Confirmed via WP-CLI: `wc shop_order list --user=1`.
5. **Ownership Proof & Status Endpoint:**
   - Verified `/api/orders/status?orderId=<id>` with valid `x-order-token` returns HTTP 200 `{ ok: true }`.
   - Non-owner request with invalid token returns HTTP 403 Forbidden.
   - Request without token returns HTTP 400 Bad Request.
6. **Repeat Submit Guard & New Session Purchase:**
   - Repeated submit of identical attempt prevented from creating duplicate orders.
   - Fresh legitimate purchase in a separate browser context succeeds cleanly (Orders #19 and #20).
7. **Email Dispatch:**
   - Mailpit API (`http://127.0.0.1:10000/api/v1/messages`) verified receipt of customer order confirmation ("Your paraloca order has been received!") and admin notification ("You've got a new order").
8. **Mobile Viewport:**
   - Small viewport (Pixel 7 emulation) renders catalog, PDP, variation picker and purchasable action operably.
