# ECO-807 Verification Report: French Client Staging Acceptance & Visual UAT

- **Task**: `ECO-807`
- **Phase**: 8
- **Verifier**: `cleanup-verifier`
- **Submitted SHA**: `f922a1841a55eb84fd97dbc13492541be92f4587`
- **Worktree**: `C:/dev/ecomos-eco301`
- **Date**: 2026-10-10
- **Verdict**: `PASS`

---

## 1. Scope & Isolation Review

Verified `git show --stat f922a1841a55eb84fd97dbc13492541be92f4587`:
All 5 files created are strictly within the assigned and claimed scope:
- `apps/storefront/e2e/paraloca-uat.spec.ts`
- `docs/ecomos/evidence/ECO-807/open-risks.md`
- `docs/ecomos/evidence/ECO-807/report.md`
- `docs/ecomos/evidence/ECO-807/uat.md`
- `docs/ecomos/release/PARALOCA_CUTOVER.md`

Zero scope escape, zero dirty submodule leaks, zero modifications outside assigned paths.

---

## 2. Invariant & Contract Verification

1. **Coming Soon Landing Page**: The independent Coming Soon page on `paraloca.ma` remains active and untouched; cutover requires separate formal authorization.
2. **Permanent Guest-First Policy**: Customer accounts remain strictly disabled (`capabilities.customerAccounts: false`).
3. **Certified Payment Gateways Only**: Payment methods remain restricted to certified Cash on Delivery (`allowedPaymentMethods: ['cod']`).
4. **Domain Isolation**: Quotes and purchasing workflows remain strictly decoupled.

---

## 3. Independent Command Execution

1. `npx tsx --test apps/storefront/e2e/paraloca-uat.spec.ts`:
   - 8/8 tests passed in 131ms (PASS)
2. `npx tsc -p apps/storefront/tsconfig.json --noEmit`:
   - 0 errors (PASS)
3. Full storefront ParaLoca regression suite:
   - `npx tsx --test apps/storefront/e2e/paraloca-*.spec.ts apps/storefront/e2e/favorites.spec.ts apps/storefront/e2e/owned-brands.spec.ts`:
   - 33/33 tests passed in 445ms (PASS)
