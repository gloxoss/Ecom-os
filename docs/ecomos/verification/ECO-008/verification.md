# ECO-008 independent verification

## Identity and scope

- Date: 2026-10-09.
- Executor: `commerce-cleanup`, commerce lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `2a0c84ce701f4da9f15844f941a9679ce7faa8cb`.
- Base: `21d844a31b034338e335cfe55b4afb936b20b989`.
- Executor evidence: `docs/ecomos/evidence/ECO-008/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-008/verification.md`).

## Verdict

PASS for WooCommerce staging backend verification and Store API guest smoke at commit `2a0c84ce701f4da9f15844f941a9679ce7faa8cb`.

## Executed verification commands

1. Staging preflight verification:
   - `docs/ecomos/staging-preflight.json` verified:
     - Origin: `https://paraloca.local`.
     - WordPress 7.1.3, PHP 8.2.29, WooCommerce 11.2.1, WPGraphQL 2.23.1, WPGraphQL for WooCommerce 1.0.3.
     - Store API products, cart, and GraphQL respond with 200.
     - Read-only connector verified (customer order read 403, settings write denied).
2. Store API smoke proof:
   - `docs/ecomos/store-api-smoke.json` verified:
     - Synthetic guest COD order #15 verified with exact variation #14 and Moroccan flat rate shipping (25.00 MAD).
     - Subtotal 159.40 MAD + Shipping 25.00 MAD + Tax 18.44 MAD = Total 202.84 MAD.
     - Sequential retry returned 409 conflict; exactly 1 order created.
     - Independent CRUD confirms customer ID 0.
3. Scope boundaries verified:
   - Headless storefront checkout UI remains unavailable pending Phase 2 implementation.
   - Deployed permissions and uncertified gateways stay quarantined.
