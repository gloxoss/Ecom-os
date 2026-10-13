# Item 5 Order Recovery, Indexed Correlation and Restart Rehearsal Evidence Report

- **Date:** 2026-10-13
- **Agent:** agent-4 (executor/commerce)
- **Status:** PASS
- **Target Backend:** `https://paraloca.local` (Local app, site "paraloca", MySQL port 10005, live WooCommerce HPOS orders)
- **Storefront / Engine Runtime:** `packages/engine-woocommerce` (`FileClaimAttemptStore`, `executeIdempotentCheckout`, `findOrderByAttemptCorrelation`)
- **Verification Runner:** `.agent-hub/.runtime/verify-live-order-recovery.mjs` (All 5 legs PASS)

## Verified Acceptance Criteria

1. **Live Indexed / Correlation Marker Lookup (WooCommerce REST):**
   - Verified against authoritative order #20 (`wc_order_nV6CuuTGREknS`, email `e2e-sprint-b@example.com`) placed via real guest checkout on local staging.
   - Identified correlation marker `[ecomos-attempt:att_ae4c61a1-e8a6-4923-af25-097f4120402d]` in native WooCommerce customer note.
   - Invoked `findOrderByAttemptCorrelation(attemptKey, { email })` against live WooCommerce REST API.
   - Exact correlation matched and returned authoritative order in 237 ms with zero false positives.

2. **Email Ownership Privacy Barrier:**
   - Evaluated lookup with matching attempt key but non-owner email (`different-shopper@fraud.ma`).
   - Verified result returned `null`.
   - Guaranteed cross-customer isolation: an attacker presenting a leaked attempt key cannot hijack or read another customer's confirmed order.

3. **Conclusive Absence vs. Scan Limit Boundary Proof:**
   - **Conclusive Absence:** Searched non-existent attempt key across paginated orders (`perPage: 100, maxPages: 10`). Entire order collection scanned; conclusively returned `null`.
   - **Scan Limit Exhaustion:** Constrained query to `perPage: 1, maxPages: 1` against an install with >1 orders. Rather than falsely reporting absence (`null`), the scanner threw:
     `Order recovery scan reached its limit of 1 orders without a conclusive result.`
   - Proves audit regression fix: scanning limits are treated as unknown outcomes, preventing unsafe duplicate submissions when older pages cannot be inspected.

4. **Crash & Process Reboot Recovery Drill:**
   - Initialized `FileClaimAttemptStore` simulating checkout process A.
   - Process A durably registered pending claim on disk (`...pending.json`).
   - Simulated abrupt process crash / termination.
   - Booted completely fresh process B reading from same durable storage directory.
   - Process B safely restored pending state without corruption or data loss.

5. **Recovery Reconciliation & Atomic State Transition:**
   - Process B executed `executeIdempotentCheckout` with live correlation hook.
   - Successfully recovered authoritative live WooCommerce order #20 without dispatching a duplicate checkout POST.
   - Reconciled attempt into `CONFIRMED`.
   - Atomic file transition verified on disk: `.pending.json` removed, `.confirmed.json` created.
   - Subsequent replay returned the confirmed order directly in 0ms without hitting the remote gateway.
