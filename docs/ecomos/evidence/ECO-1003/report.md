# ECO-1003 — Owner-scoped durable checkout and RFQ idempotency

**Commit:** `e2c3858` · **Audit finding:** 2 (checkout half; the RFQ half is ECO-1005)

## Defect reproduced

`CheckoutAttemptManager.startAttempt` looked up an attempt by `attemptKey` alone and
returned the stored `orderId`/`orderKey` without comparing the caller's cart token.
Guest B reusing guest A's key received A's confirmed order. A new manager retained
nothing, so a restart could not stop a retry from creating a second order.

## Repairs

- Storage key is `operation + attemptKey`, and each attempt records its owner. A key
  bound to another owner returns `OWNER_MISMATCH` — no order id, no order key — and
  does not overwrite the real owner's record.
- `confirmAttempt` / `failAttempt` refuse to act on another session's attempt.
- `AttemptStore` separates persistence from the manager: `InMemoryAttemptStore`
  (single process) and `JsonFileAttemptStore` (atomic temp-file + rename) for a
  single host that must survive restarts. `ECOM_ATTEMPT_STORE_PATH` selects it.
  Documented as **not** a distributed lock; multi-worker needs a shared store.
- `submitStoreCheckout` / `executeIdempotentCheckout` return and store the contact the
  order was placed with, and `submitCheckoutAction` prefers it over a retry's supplied
  email, so a replay cannot mint a guest access grant for a different address.

## Verification

| Check | Result |
| --- | --- |
| `vitest run packages/engine-woocommerce/src/__tests__/checkout-attempts.test.ts` | exit 0 — 16 passed |
| Cross-owner reuse of a confirmed key | fails closed; the serialized result contains neither the order id nor the order key |
| Replay across a simulated restart over `JsonFileAttemptStore` | returns the original order id and key |
| Same record, different owner, after restart | `OWNER_MISMATCH` |
| `tsc -p apps/storefront/tsconfig.json --noEmit` | exit 0 |
| `vitest run` (whole suite) | exit 0 — 521 passed |

## Not proven

No live WooCommerce. The store is single-host durable; the audit's requirement that
retries across *multiple workers* cannot duplicate an order needs a shared store
(WordPress-side or a database), which does not exist here. Concurrency is simulated.
