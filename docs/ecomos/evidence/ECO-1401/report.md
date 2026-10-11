# ECO-1401: Checkout Intent, Durable Attempt Tracking, and Adapter Recovery Correctness

**Date:** 2026-10-11  
**Lane:** Commerce (`sprint-commerce-1`)  
**Task:** `ECO-1401`  
**Base Commit:** `35af485bfaff1c7c13681e7f1767b53b3266d6f2`  

---

## 1. Summary of Changes

Following the 2026-10-11 Next Execution Directive (Section 1: Checkout intent and recovery correctness), this slice resolves all four remaining risks in checkout intent and recovery:

1. **Per-Purchase Attempt ID Binding**:
   - `CheckoutForm` (`apps/storefront/src/features/checkout/ui/checkout-form.tsx`) now mints a cryptographically secure purchase-attempt ID (`purchaseAttemptId`) upon form mount, retaining it across inline retries of that intent.
   - The form renders a hidden `<input type="hidden" name="attemptId" value={purchaseAttemptId} />` field.
   - `submitCheckoutFormAction` (`apps/storefront/src/features/checkout/server/checkout-form-actions.ts`) extracts `attemptId` from `FormData` and supplies it directly to `submitCheckoutAction`.

2. **Preservation of Unknown Outcomes**:
   - In `executeIdempotentCheckout` (`packages/engine-woocommerce/src/checkout.ts`), if `submitStoreCheckout` throws an error (e.g. gateway timeout, socket hangup, or network reset), the engine invokes `opts.lookupOrder` to check if WooCommerce recorded the order before the error.
   - If found, the confirmed order is revived and returned.
   - If recovery lookup fails or is inconclusive, the attempt is preserved in `PENDING` state and throws `Checkout outcome is unknown: ...`, strictly refusing to mark the attempt `FAILED` (which would allow blind retry and duplicate order creation).

3. **Active Purchase Owner Preservation**:
   - On encountering a `PENDING` attempt state, a lookup miss no longer supersedes an active owner.
   - If `age < activeLockTimeoutMs` (default 15,000ms), `executeIdempotentCheckout` refuses the secondary request with `BUSY_ATTEMPT_ERROR` (`'A checkout attempt for this submission is currently processing.'`).
   - Only when an attempt has exceeded the active lock window and lookup confirms no order exists is it marked failed-retryable.

4. **Fail-Closed Exact Correlation Lookup**:
   - `findOrderByAttemptCorrelation` (`packages/engine-woocommerce/src/checkout.ts`) defaults to scanning up to 100 recent orders (`per_page=100`).
   - If WooCommerce returns a non-array or malformed REST response, it throws an explicit error rather than silently returning `null`.
   - Optional properties in `OrderCorrelation` and `OrderLookupContext` allow `undefined` under strict `exactOptionalPropertyTypes: true`.

---

## 2. Decisive Test Proof

### 2.1 Workspace Suite
- Command: `npx vitest run`
- Result: **66 test files passed, 598 tests passed (0 failures, exit 0)**.
- New test assertions added:
  - `refuses to supersede an active pending checkout owner when lookup finds no order yet` -> PASS
  - `recovers when submitStoreCheckout throws but order was created in WooCommerce` -> PASS
  - `preserves unknown outcome and prevents duplicate POST when submission and lookup both fail` -> PASS
  - `proves concurrent full checkout requests produce exactly one order and reject the other as busy` -> PASS
  - `fails closed when correlation lookup receives a non-array response` -> PASS

### 2.2 Strict TypeScript Compilation
- Command: `npx tsc --noEmit -p apps/storefront/tsconfig.json` -> **0 errors (exit 0)**
- Command: `npx tsc --noEmit -p packages/engine-woocommerce/tsconfig.json` -> **0 errors (exit 0)**

---

## 3. Verified Invariants

- **Idempotency**: Concurrent requests presenting the same attempt ID produce exactly one WooCommerce order.
- **Fail-Closed Recovery**: Unverified or interrupted states do not downgrade to retryable without authoritative proof.
- **Form Integrity**: Form retries keep the initial attempt ID; fresh visits mint a new attempt ID.
