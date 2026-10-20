# ECO-1401: Independent Verification Report

**Task:** `ECO-1401`  
**Verifier:** `sprint-verifier-1`  
**Submitted Commit:** `ab44fa84eed1b5aa395f88b54575b16cf88d61c9`  
**Date:** 2026-10-11  
**Verdict:** **PASS**  

---

## 1. Provenance & Scope Audit

- **Submitted Base:** `35af485bfaff1c7c13681e7f1767b53b3266d6f2`
- **Submitted Tip:** `ab44fa84eed1b5aa395f88b54575b16cf88d61c9`
- **Claimed Paths:** `apps/storefront/src/features/checkout`, `packages/engine-woocommerce/src/checkout.ts`, `packages/engine-woocommerce/src/client.ts`, `packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts`, `docs/ecomos/evidence/ECO-1401`
- **Changed Files:** All 5 modified files in commit `ab44fa8` strictly reside within the claimed boundaries.
- **Evidence Report:** Verified nonempty at `docs/ecomos/evidence/ECO-1401/report.md`.

---

## 2. Independent Verification Results

1. **Per-Purchase Attempt ID**:
   - Verified `CheckoutForm` creates `purchaseAttemptId` state via `crypto.randomUUID()` upon mounting and renders `<input type="hidden" name="attemptId" value={purchaseAttemptId} />`.
   - Verified `submitCheckoutFormAction` forwards `attemptId` to `submitCheckoutAction`.

2. **Preservation of Unknown Outcomes**:
   - Verified in `checkout.ts` that if `submitStoreCheckout` throws, `lookupOrder` is queried.
   - If `lookupOrder` is inconclusive or throws, outcome is preserved in `PENDING` state and throws `Checkout outcome is unknown: ...`, preventing duplicate order creation.

3. **Active Owner Protection**:
   - Verified that `executeIdempotentCheckout` checks `existing && age < activeLockMs`. If an active worker is still executing within the lock window, subsequent requests receive `BUSY_ATTEMPT_ERROR` rather than superseding the owner.

4. **Fail-Closed Correlation**:
   - Verified `findOrderByAttemptCorrelation` queries up to 100 orders and throws when receiving non-array responses.

5. **Test Assertions**:
   - `vitest packages/engine-woocommerce` -> 158 / 158 PASS (39/39 in `checkout-attempts.test.ts`).
   - `vitest full suite` -> 598 / 598 PASS (66 test files, 0 failures).
   - `tsc` across storefront and engine-woocommerce -> 0 errors.

---

## 3. Verification Conclusion

All acceptance criteria for directive Section 1 (ECO-1401) are satisfied. Verified PASS.

