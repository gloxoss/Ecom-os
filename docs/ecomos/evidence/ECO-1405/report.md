# ECO-1405 Evidence Report: Final Pinned Full-Suite Test/Build/Browser Gate & Release Candidate Certification

**Task ID:** `ECO-1405`  
**Executor:** `sprint-recovery-1`  
**Base Commit:** `afca6bfcb8a46fad1a6684fbb94ccc60eedf89c3`  
**Date:** 2026-10-11  

---

## 1. Scope & Objective

Satisfy Next Execution Directive Section 4 & 6 ("Final pinned full-suite test/build/browser gate and release packet certification"):
1. Execute full verification suite on the pinned integrated baseline (`afca6bf`):
   - Import guard and engine isolation (`npm run guard`): 13/13 pass.
   - Strict TypeScript check across storefront and workspace packages (`tsc --noEmit`): 0 errors.
   - Full Vitest suite (`npm test`): 602/602 tests pass across 67 test files (0 failures).
   - Node test suites:
     - Restore isolation & fidelity (`node scripts/verify-restore.test.mjs`): 23/23 pass.
     - Addon lifecycle & core migration guard (`node --test plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs`): 5/5 pass.
     - ParaLoca client suite (`npx tsx --test clients/paraloca/*.test.ts`): 19/19 pass.
     - End-to-end RFQ quotation workflow (`npx tsx --tsconfig apps/storefront/tsconfig.json --test apps/storefront/e2e/sprint-b-rfq.spec.ts`): 10/10 pass.
     - Hub protocol integrity (`npm run hub:test`): 16/16 pass.
   - Next.js 16 production build (`npm --prefix apps/storefront run build`): 15 routes compiled cleanly.
   - Playwright census: 37 tests discovered across commerce, RFQ, and discovery specs.
2. Verify multi-tenant client isolation between Client 1 (`paraloca`, MAD, HPOS tables) and Client 2 (`demo-2`, EUR, legacy post storage).
3. Reconcile readiness records and release packet:
   - Updated `docs/ecomos/release/RELEASE_PACKET.md` with authoritative commit `afca6bf`, comprehensive test summary, and release boundaries.
   - Updated `docs/ecomos/release/READINESS_2026-10-11.md` with reconciled score of 85/100 points.
   - Retained Moroccan Law 84-12 / Law 31-08 regulatory invariants: all 8 merchant facts in `clients/paraloca/content-approval.md` explicitly marked **UNAPPROVED** pending authentic owner sign-off.
   - Operational boundary enforced: Local Release Candidate v1.0.0-rc1 certified; public DNS, automated deployments, live payments, and live database migrations remain gated.

---

## 2. Test Verification Ledger

| Check / Suite | Command | Assertions | Status |
|---|---|---|---|
| **Engine Import Guard** | `npm run guard` | 13 / 13 | **PASS** |
| **Storefront TypeScript** | `npm --prefix apps/storefront run typecheck` | 0 errors | **PASS** |
| **Engine TypeScript** | `npm --prefix packages/ecom-engine run typecheck` | 0 errors | **PASS** |
| **WooCommerce Adapter TS** | `npm --prefix packages/engine-woocommerce run typecheck` | 0 errors | **PASS** |
| **RFQ Addon TS** | `npm --prefix packages/addons-rfq run typecheck` | 0 errors | **PASS** |
| **Multi-Payment Addon TS** | `npm --prefix packages/addons-multi-payment run typecheck` | 0 errors | **PASS** |
| **Workspace Vitest Suite** | `npm test` | 602 / 602 (67 files) | **PASS** |
| **Restore Isolation & Fidelity** | `node scripts/verify-restore.test.mjs` | 23 / 23 | **PASS** |
| **Addon Lifecycle & Guard** | `node --test plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs` | 5 / 5 | **PASS** |
| **ParaLoca Client Dossier** | `npx tsx --test clients/paraloca/*.test.ts` | 19 / 19 | **PASS** |
| **RFQ End-to-End Spec** | `npx tsx --tsconfig apps/storefront/tsconfig.json --test apps/storefront/e2e/sprint-b-rfq.spec.ts` | 10 / 10 | **PASS** |
| **Agent Hub Protocol** | `npm run hub:test` | 16 / 16 | **PASS** |
| **Next.js Production Build** | `npm --prefix apps/storefront run build` | 15 routes compiled | **PASS** |
| **Total Automated Proof** | **Full Monorepo** | **688+ passed, 0 failed** | **PASS** |

---

## 3. Release Certification

- **Release Version:** `v1.0.0-rc1`
- **Pinned Git Base:** `afca6bfcb8a46fad1a6684fbb94ccc60eedf89c3`
- **Status:** **LOCAL RELEASE CANDIDATE CERTIFIED** (Production cutover gated on merchant disclosures).
