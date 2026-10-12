# Item 3 Live RFQ Quotation Journey Evidence Report

- **Date:** 2026-10-12
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Target Backend:** `https://paraloca.local` (Local app, site "paraloca", MySQL port 10005, companion plugin `wp-ecomos-rfq` active)
- **Storefront Runtime:** `http://localhost:3000` (Next.js 16.3.8 production mode, `ADDONS=quotes`, `ECOM_RFQ_WP_URL=https://paraloca.local/wp-json/ecomos/v1/rfq`)
- **Test Runners:** 
  1. Playwright Chromium / System Chrome (`apps/storefront/e2e/sprint-b-rfq-live-browser.spec.ts`)
  2. Integration Verification Suite (`verify-live-rfq.mjs`) & `apps/storefront/e2e/sprint-b-rfq.spec.ts` (10/10 PASS)

## Verified Acceptance Criteria

1. **Dual Entry Paths & Multi-Product Basket:**
   - **Path A (PDP):** Navigated to `/product/ecomos-test-variable`. Verified discreet secondary button `Ajouter au devis pro` renders. Clicking adds item to quote basket and updates button label to `Ajouté au devis ✓`.
   - **Path B (Builder):** Navigated to `/devis`. Verified quote builder renders assembled line items with quantity adjustments and special instructions.
   - Verified basket with >= 3 distinct products (synthetic items: simple #12, variable #13, hospital bed #21).

2. **Guest Submission & WordPress Persistence:**
   - Submitted quote with full contact details (`Docteur Amina Benkirane`, `Clinique Internationale de Fès`), line items, and legal consent grants (`terms_and_conditions`, `privacy_consent`).
   - Storefront endpoint `POST /api/rfq` successfully returned HTTP 201 Created with quote ID (`quote_mv57mzaa_4811`), reference number (`DEV-2026-4811`), and unguessable access secret (`3460aef...`).
   - Confirmed persistence in WordPress database table `wp_ecomos_rfq_quotes` (`state: submitted`).

3. **Cryptographic Token Authorization Barriers:**
   - **Valid Guest Token:** `GET /api/rfq/offers?quoteId=...` with `x-quote-token` returned HTTP 200 with full line items. `accessSecretHash` is scrubbed and never leaked to guest.
   - **Invalid Guest Token:** Request with forged token returned HTTP 403 Forbidden (`Access denied to quote: invalid guest token`).
   - **Missing Token:** Request without token returned HTTP 401 Unauthorized (`Authentication token required`).

4. **Authenticated Staff Session & Offer Revisions:**
   - Staff operator user created via WP-CLI (`rfq_staff`, ID 3). Password securely isolated in git-ignored `.agent-hub/.runtime/staff-credentials.json`.
   - Staff issued Revision 2 (`rev_1`) via `POST /wp-json/ecomos/v1/rfq/quotes/{id}/offers` with Basic Auth.
   - Included discounted unit pricing, 20% Moroccan VAT calculation, 14-day validity expiration timestamp, and commercial terms.
   - WordPress successfully updated quote state to `offer_created` and created revision row in `wp_ecomos_rfq_revisions`.

5. **Protected Quote Document (HTML/PDF View):**
   - Verified endpoint `GET /wp-json/ecomos/v1/rfq/quotes/{id}/document`.
   - Enforces `Cache-Control: no-store, private` and `Content-Type: text/html; charset=UTF-8`.
   - Valid guest token: HTTP 200 with rendered quote reference `DEV-2026-4811`.
   - Invalid token: HTTP 403 Forbidden.
   - Unauthenticated: HTTP 401 Unauthorized.

6. **Real-Browser Offer Review & Acceptance:**
   - Guest reopened private offer URL in Chromium at `http://localhost:3000/devis/offer?quoteId=...#token=...`.
   - Access token parsed client-side from URL hash (`#token`), keeping credentials out of server access logs.
   - DOM rendered designated lines, unit price HT, TVA, Total TTC (`3258.00 MAD`), and firm pricing policy notice.
   - Clicked interactive button `Accepter le devis`.
   - Storefront dispatched `POST /api/rfq/offers` (action `accept`), state transitioned to `accepted`, and real-browser DOM rendered `Devis accepté avec succès !`.
   - In a separate fresh browser context with forged token, verified security barrier `[data-testid="offer-access-denied"]` rendered.

7. **WooCommerce Single Conversion Lock:**
   - Guest conversion forbidden: `POST /wp-json/ecomos/v1/rfq/quotes/{id}/convert` with guest token returned HTTP 403.
   - Staff conversion succeeded: HTTP 200 returned `{ success: true, orderId: "23", state: "converted_to_order" }`.
   - Verified native WooCommerce HPOS order #23 created in `wp_wc_orders` (`status: pending`, `customer_id: 0`, currency `MAD`).
   - Replay attempt: Second call to `/convert` returned `{ isDuplicate: true, orderId: "23" }` and did not create duplicate orders.

8. **Local Mailpit Notification Sink:**
   - Queried Mailpit API at `http://127.0.0.1:10000/api/v1/messages`.
   - Confirmed capture of customer transactional notification ("Votre devis DEV-2026-4811 est prêt - EcomOS") and merchant notification ("Devis DEV-2026-4811 ACCEPTÉ par le client"). Zero external email leakage.

9. **Storefront Restart Survival:**
   - Terminated Next.js process (`task-3968`) and restarted cold production daemon (`task-4134`).
   - Re-queried quote status via storefront API with guest token: all items, revisions, contact details, and `converted` status faithfully restored from WordPress database.

10. **RFQ OFF State Verification:**
    - Confirmed that with `quotes` omitted from `ADDONS`, `/devis` returns HTTP 404, `/api/rfq/*` endpoints return HTTP 404 `ADDON_DISABLED`, and standard B2C storefront operations remain unaffected.
