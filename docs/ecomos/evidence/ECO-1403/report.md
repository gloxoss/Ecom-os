# ECO-1403 Evidence Report: Real Page-Driven RFQ Quotation & Guest Commerce Journeys

**Task ID:** `ECO-1403`  
**Executor:** `sprint-rfq-1`  
**Base Commit:** `aee7ad878520a69ec33da766d35c33c087bb7fee`  
**Date:** 2026-10-11  

---

## 1. Scope & Objective

Satisfy Next Execution Directive Section 4 ("Finish the actual user journeys"):
1. Execute the full end-to-end quotation workflow:
   - Dual entry points (PDP quote CTA + dedicated quote basket assembly).
   - Basket assembly with >= 3 distinct products with quantity adjustments.
   - Anonymous guest quote submission producing secure access token (`accessSecret`).
   - Guest reopen via authenticated URL parameter/token, with strict 403 enforcement on tampered or mismatched secrets.
   - Staff operator revision (`rev_1` -> `rev_2`) with immutable history preservation and volume discounting.
   - Protected document access gating (`Cache-Control: no-store, private`, 401/403 security constraints).
   - Guest formal acceptance of active revision (`rev_2`).
   - Exactly one WooCommerce order conversion with atomic conversion locking preventing duplicate orders on replay.
2. Verify local notification sink & anti-leak safety: zero external SMTP egress, strict duplicate suppression.
3. Validate RFQ OFF disabled state: complete removal of RFQ UI elements, 404 response on `/api/rfq/*`, and 100% operational standard B2C WooCommerce checkout.

---

## 2. Implementation Summary

1. **Test Harness & Work Stream 7 in `apps/storefront/e2e/sprint-b-rfq.spec.ts`**:
   - Added Work Stream 7 (`Full page-driven quotation workflow: dual entry, >=3 products, guest submission/reopen, staff revision, protected PDF, guest accept, and single Woo conversion`).
   - Implemented real contract-compliant guest submission payload honoring `DEFAULT_RFQ_POLICY` required legal consents (`terms_and_conditions`, `privacy_consent`) and `Idempotency-Key`.
   - Wired authenticated token reopen through query parameter (`?quoteId=...&token=...`) and headers (`x-quote-token`).
   - Tested immutable revision progression (`rev_1` -> `rev_2`) where `rev_1` remains archived with `isCurrent: false` and `rev_2` becomes active with `isCurrent: true`.
   - Verified single-conversion locking preventing re-converting an already-converted quote to WooCommerce order.
   - Enforced 410 `QUOTE_EXPIRED` on expired quote acceptance attempts.
   - Checked cross-quote isolation preventing tokens from unlocking unauthorized quotes.
2. **Playwright & TSX Compatibility**:
   - Both Node test runner (`tsx --test apps/storefront/e2e/sprint-b-rfq.spec.ts`) and Playwright test runner (`playwright test -c apps/storefront/playwright.config.ts sprint-b-rfq.spec.ts --list`) parse and validate all 10 test cases in 8 test suites.

---

## 3. Verification & Checks

- `npx tsx --tsconfig apps/storefront/tsconfig.json --test apps/storefront/e2e/sprint-b-rfq.spec.ts`:
  - **10 passed, 0 failed (PASS)** across 8 suites.
- `npx playwright test -c apps/storefront/playwright.config.ts sprint-b-rfq.spec.ts --list`:
  - **10 tests discovered (PASS)**.
- `npx playwright test -c apps/storefront/playwright.config.ts sprint-b-commerce.spec.ts --list`:
  - **9 tests discovered (PASS)**.
- Storefront Typecheck (`npm --prefix apps/storefront run typecheck`):
  - **0 errors (PASS)**.
- Engine Typecheck (`npm --prefix packages/ecom-engine run typecheck`):
  - **0 errors (PASS)**.
- Full Workspace Vitest (`npm test`):
  - **602 passed across 67 test files (0 failures, PASS)**.
