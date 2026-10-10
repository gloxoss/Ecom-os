# ECO-704 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `tooling-cleanup`, platform lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `226c5ac10de2677eaaf7ccf3be6cec28f977e8ff`.
- Base: `dda478cd7463fcca4b4812aea1a9687a86e0db93`.
- Executor evidence: `docs/ecomos/evidence/ECO-704/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-704/verification.md`).

## Verdict

PASS for custom WordPress RFQ companion plugin (`wp-ecomos-rfq`), dedicated database schema, durable repository with immutable revision tracking, and versioned REST API routes at commit `226c5ac10de2677eaaf7ccf3be6cec28f977e8ff`.

## Executed verification commands

1. RFQ plugin contract and route test suite:
   - `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`
   - Exit: 0.
   - Result: 5 passed in 69ms across 2 test files.
   - Verified:
     - DDL schemas for `wp_ecomos_rfq_quotes` and `wp_ecomos_rfq_revisions` correctly define primary and unique keys.
     - Revision immutability: prior revisions are deactivated (`is_current = 0`) while new revisions are created atomically.
     - Constant-time guest token authentication using `hash_equals`.
     - REST routes `/quotes`, `/quotes/{id}`, `/quotes/{id}/offers`, `/quotes/{id}/accept`, `/quotes/{id}/reject`.
     - Addon off-state returns HTTP 404 (`addon_disabled`).
     - Staff capability check (`ecomos_operator`, `manage_woocommerce`).
     - Stale revision returns HTTP 409 (`stale_revision`).
     - Expired quote returns HTTP 410 (`quote_expired`).
     - Response headers enforce `Cache-Control: no-store, private`.

2. Git scope containment:
   - Submitted commit `226c5ac10de2677eaaf7ccf3be6cec28f977e8ff` alters exactly 9 files:
     - `docs/ecomos/evidence/ECO-704/headless-spike.md`
     - `docs/ecomos/evidence/ECO-704/report.md`
     - `docs/ecomos/rfq/BACKEND_DECISION.md`
     - `plugins/wp-ecomos-rfq/repository.php`
     - `plugins/wp-ecomos-rfq/routes.php`
     - `plugins/wp-ecomos-rfq/schema.php`
     - `plugins/wp-ecomos-rfq/tests/repository.spec.mjs`
     - `plugins/wp-ecomos-rfq/tests/routes.spec.mjs`
     - `plugins/wp-ecomos-rfq/wp-ecomos-rfq.php`
   - All files remain within the authorized scope claim. Zero files modified in protected paths.

## Invariant Assessment
- **HPOS & Core Table Protection**: Plugin introduces zero modifications to `wp_posts`, `wp_postmeta`, or `wp_wc_orders`.
- **Headless REST Completeness**: All quotation workflows operate via JSON REST endpoints without requiring shortcodes or browser sessions.
- **Revision Immutability**: Historical offer lines remain frozen in `wp_ecomos_rfq_revisions`.
