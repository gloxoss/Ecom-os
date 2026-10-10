# ECO-704: Custom WordPress RFQ Backend and Durable Revisions Report

## Summary
Evaluated quotation plugin strategies, formalized Architectural Decision AD-704, and implemented the native WordPress companion plugin `wp-ecomos-rfq` (`plugins/wp-ecomos-rfq/`) providing durable custom database tables, immutable revision snapshots, atomic state updates, and versioned REST API routes (`/wp-json/ecomos/v1/rfq/*`) with off-state gating and guest HMAC token verification.

## Scope & Claimed Paths
- `plugins/wp-ecomos-rfq/` (`wp-ecomos-rfq.php`, `schema.php`, `repository.php`, `routes.php`, `tests/repository.spec.mjs`, `tests/routes.spec.mjs`)
- `docs/ecomos/rfq/` (`BACKEND_DECISION.md`)
- `docs/ecomos/evidence/ECO-704/` (`headless-spike.md`, `report.md`)

## Key Implementations & Invariants
1. **Architectural Decision AD-704 (`docs/ecomos/rfq/BACKEND_DECISION.md`)**:
   - Rejected shortcode-centric off-the-shelf plugins due to lack of headless REST APIs, lack of immutable revision ledgers, destructive cart session mutation, and recurring licensing overhead.
   - Adopted lightweight native companion plugin `wp-ecomos-rfq`.
2. **Dedicated Custom Table Schema (`plugins/wp-ecomos-rfq/schema.php`)**:
   - `wp_ecomos_rfq_quotes`: Stores quote entity, contact data, items data, state, access token hash, and expiry.
   - `wp_ecomos_rfq_revisions`: Stores versioned snapshots with priced lines, tax calculations, staff author metadata, and `is_current` boolean flag.
   - Guarantees zero mutation of core WooCommerce tables (`wp_posts`, `wp_wc_orders`).
3. **Durable Repository & Atomic Revision Transitions (`plugins/wp-ecomos-rfq/repository.php`)**:
   - `ecomos_rfq_add_revision`: Atomically clears `is_current` on prior revisions and inserts the new revision incrementing `revision_number`.
   - `ecomos_rfq_verify_guest_access`: Verifies SHA-256 access token using `hash_equals` constant-time comparison.
4. **Versioned REST API Endpoints (`plugins/wp-ecomos-rfq/routes.php`)**:
   - Endpoints: `POST /quotes`, `GET /quotes/{id}`, `POST /quotes/{id}/offers`, `POST /quotes/{id}/accept`, `POST /quotes/{id}/reject`.
   - Addon Off-State Guard: Intercepts all requests with HTTP 404 (`addon_disabled`) when quotes addon is inactive.
   - Staff capability check: Requires `ecomos_operator` or `manage_woocommerce` for offer creation.
   - Stale Revision Guard: Emits HTTP 409 (`stale_revision`) if targeted revision does not match `current_revision_id`.
   - Expiration Guard: Emits HTTP 410 (`quote_expired`) if current time exceeds `expires_at`.

## Executed Verification Commands
```bash
node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs
```
Output:
```text
✔ wp-ecomos-rfq schema.php contract and table structure
✔ wp-ecomos-rfq repository.php functions and revision immutability
✔ wp-ecomos-rfq routes.php endpoint definitions and security callbacks
✔ wp-ecomos-rfq.php entrypoint and activation hooks
✔ BACKEND_DECISION.md document completeness
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
```
