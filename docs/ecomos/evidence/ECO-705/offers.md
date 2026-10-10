# ECO-705 Evidence: Private Revisioned Quote Offers

## 1. Architectural Overview & Security Guarantees

ECO-705 establishes the staff offer creation, server-priced line calculation, immutable revision lifecycle, safe quotation document generation, transactional notification delivery, and guest response workflow for the EcomOS RFQ (Request for Quote / Devis) addon.

### Core Architectural Invariants Enforced:
1. **Server-Enforced Pricing & Taxes**:
   - Line items are priced exclusively on the server with deterministic precision:
     $$\text{totalExclTax} = \text{round}(\text{unitPriceExclTax} \times \text{qty}, 2)$$
     $$\text{taxAmount} = \text{round}(\text{totalExclTax} \times \text{taxRate}, 2)$$
     $$\text{totalInclTax} = \text{round}(\text{totalExclTax} + \text{taxAmount}, 2)$$
   - Negative prices and non-positive quantities are rejected at the schema gate with HTTP 400.

2. **Immutable Revisions & Stale Revision Guard**:
   - Each staff revision creates a distinct immutable record in `wp_ecomos_rfq_revisions` (e.g. `rev_1`, `rev_2`).
   - Prior revisions are deactivated atomically (`is_current = 0`), leaving the newest revision active (`is_current = 1`).
   - If a customer attempts to accept a superseded or tampered revision ID, the system throws HTTP 409 `STALE_REVISION`, preventing out-of-order or expired offer acceptance.

3. **Expiration Boundary Enforcement**:
   - Quotation offers require a future expiration timestamp.
   - When the expiration timestamp is reached, acceptance attempts are blocked with HTTP 410 `QUOTE_EXPIRED`. Customers must request a revision before proceeding.

4. **Cryptographic Guest Access**:
   - Guest customers authenticate access to private quotes and quotation documents exclusively via their HMAC access secret (`x-quote-token` or payload `accessSecret`).
   - Hash comparisons are performed in constant time using `hash_equals` / SHA-256 to prevent timing attacks.
   - Unauthenticated or unauthorized token attempts receive HTTP 403 `FORBIDDEN`.

5. **Honest Inventory Reservation Policy**:
   - Neither quote creation, offer emission, nor offer acceptance reserves physical WooCommerce inventory.
   - A clear, binding disclaimer is displayed both in the storefront review UI and in the printed quotation document:
     > *"Ce devis constitue une offre de prix ferme jusqu'à sa date d'expiration. Conformément à la politique d'intégrité des stocks, l'émission du devis ne réserve aucun inventaire physique avant validation formelle et conversion en commande."*

6. **Sanitized Document Generation & Anti-Injection**:
   - Quotation documents (HTML/print view) strictly sanitize all customer and product strings via `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`.
   - Prevents XSS and HTML injection from arbitrary company names, tax IDs, and customer notes.

7. **Transactional Notifications & Deduplication**:
   - Email notifications for offer emission, acceptance, and decline are dispatched with unique idempotency keys (`idempotency_key = event_quoteId_revisionId`).
   - Retries suppress duplicate dispatches, ensuring at-most-once delivery.
   - A dedicated test mail sink (`ecomos_rfq_test_mail_sink`) enables zero-dependency testing without live SMTP.

---

## 2. Component Deliverables

| Component | Path | Responsibility |
|---|---|---|
| Pricing & Revision Engine | `packages/addons-rfq/src/offer.ts` | Tax calculations, offer validation, expiration checks, and totals aggregation |
| Addon Entrypoint | `packages/addons-rfq/src/index.ts` | Export `offer.ts` functions |
| State Machine Extensions | `packages/addons-rfq/src/types.ts`, `state-machine.ts` | Add `revision_requested` state and guest actor transitions |
| Companion Plugin Offer Engine | `plugins/wp-ecomos-rfq/offers.php` | Staff offer creation, line pricing normalization, revision transitions |
| Quotation Document Generator | `plugins/wp-ecomos-rfq/documents.php` | Safe print-ready HTML/PDF generation with guest token authentication |
| Transactional Notifications | `plugins/wp-ecomos-rfq/notifications.php` | Idempotent transactional email notifications with mail sink test harness |
| WordPress REST API Routes | `plugins/wp-ecomos-rfq/routes.php` | Add `/document`, `/offers`, `/accept`, `/reject`, and `/revise` endpoints |
| Storefront Offer API | `apps/storefront/src/app/api/rfq/offers/route.ts` | Route-guarded Next.js API route for guest offer interaction |
| Storefront Offer Review UI | `apps/storefront/src/features/rfq/ui/offer-review.tsx` | Accessible React UI for reviewing, accepting, declining, or revising offers |
