# ECO-1104 — RFQ Immutable Offer Revisions, Terminal State Guards & Single-Conversion Locking

**Task:** `ECO-1104` · **Agent:** `sprint-rfq-1` · **Lane:** `commerce` · **Base commit:** `60eccd2f7409e062dcba83ca61b29fe637fcbb02`

## Defects Identified & Addressed

| # | Defect | Location | Security & Business Impact |
| --- | --- | --- | --- |
| 1 | Staff offer creation allowed mutating quotes in terminal or protected states (`accepted`, `converting`, `converted_to_order`, `rejected`, `cancelled`, `expired`) | `plugins/wp-ecomos-rfq/offers.php`, `routes.php` | Post-conversion quote alteration: staff could amend lines or pricing on accepted or already-converted quotes |
| 2 | State updates lacked atomic compare-and-set (CAS) with multi-state conditionals | `plugins/wp-ecomos-rfq/repository.php`, `routes.php` | Race conditions: concurrent accept/reject/revise requests could overwrite each other or escape state machine invariants |
| 3 | Superseded (stale) or expired revisions could be accepted by guests | `packages/addons-rfq/src/state-machine.ts`, `apps/storefront/src/app/api/rfq/offers/route.ts`, `plugins/wp-ecomos-rfq/offers.php` | Financial risk: customer could accept older discounted or expired pricing after terms changed |
| 4 | Order conversion lacked atomic single-conversion claim, unlinked order rollback, and replay safety | `plugins/wp-ecomos-rfq/conversion.php` | Duplicate purchase orders: network retries or concurrent calls could create orphan duplicate Woo orders |
| 5 | Terminal states (`converted`, `rejected`, `expired`) lacked strict outbound transition barriers | `packages/addons-rfq/src/state-machine.ts`, `plugins/wp-ecomos-rfq/routes.php` | State degradation: terminal quotes could be revived or transitioned improperly |

## Architectural Repairs & Safeguards

### 1. Immutable Revisions & Explicit Domain Mapping
- **Explicit Domain Mapping**: In `apps/storefront/src/features/rfq/model/server-quote-store.ts`, `mapRevisions()` parses raw database records (handling stringified JSON `lines_data`, snake_case fields like `subtotal_excl_tax`, and staff identities) into strongly-typed `OfferRevision[]` objects.
- **Snapshot Immutability**: Each offer creation or revision in `packages/addons-rfq/src/state-machine.ts` appends a new revision snapshot (`rev_1`, `rev_2`, etc.) while leaving prior revisions completely immutable (only marking `isCurrent: false`).
- **Persistence Durability**: Verified in `JsonFileRfqQuoteStore` and `server-quote-store.test.ts` that multiple revisions and quote states survive process restarts with exact line items, taxes, and currency intact.

### 2. Atomic Compare-And-Set (CAS) State Transitions
- **Multi-State SQL CAS**: In `plugins/wp-ecomos-rfq/repository.php`, `ecomos_rfq_update_state()` was extended to support an array condition for `$current_state_condition`. It executes an atomic `UPDATE ... WHERE id = %s AND state IN (%s, %s, ...)` and checks affected rows (`$affected === 0` indicates conflict).
- **Route State Invariants**:
  - `ecomos_rfq_rest_accept_offer`: Requires state to be `offer_created` or `revised`. Transitions to `accepted` via atomic CAS; returns HTTP 409 on conflict.
  - `ecomos_rfq_rest_reject_quote`: Prohibits rejecting quotes in terminal or protected states (`accepted`, `converting`, `converted_to_order`, `rejected`, `expired`). Transitions to `rejected` via atomic CAS; returns HTTP 409 on conflict.
  - `ecomos_rfq_rest_request_revision`: Requires state to be `offer_created` or `revised`. Transitions to `revision_requested` via atomic CAS; returns HTTP 409 on conflict.
  - `ecomos_rfq_create_staff_offer`: Immediately rejects offer creation on quotes in protected states (`cancelled`, `rejected`, `converted_to_order`, `accepted`, `converting`, `expired`) with HTTP 409 `invalid_quote_state`.

### 3. Stale & Expired Revision Rejection
- In `plugins/wp-ecomos-rfq/offers.php` (`ecomos_rfq_can_accept_revision`), `packages/addons-rfq/src/state-machine.ts`, and `apps/storefront/src/app/api/rfq/offers/route.ts`:
  - Enforces `$revision_id === $quote['current_revision_id']`. If the targeted revision is superseded, throws `StaleRevisionError` and returns HTTP 409 `STALE_REVISION`.
  - Enforces `quote.expiresAt` future validity against server timestamp. If the expiration timestamp has passed, throws `ExpiredQuoteError` and returns HTTP 410 `QUOTE_EXPIRED`.

### 4. Durable Single-Conversion Locking
- **Atomic Claim**: In `plugins/wp-ecomos-rfq/conversion.php`:
  `ecomos_rfq_claim_quote_for_conversion()` atomically updates `state = 'converting'` `WHERE id = %s AND state = 'accepted' AND (converted_order_id IS NULL OR converted_order_id = '')`. If another conversion holds the lock, returns HTTP 409 `conversion_in_progress`.
- **Duplicate Replay Idempotency**: If `converted_order_id` is already populated on the quote, `ecomos_rfq_conversion_replay()` returns the existing order reference with `'isDuplicate' => true` and `'success' => true` without creating duplicate orders.
- **Unlinked Order Rollback**: If order creation succeeds but linking the order to the quote fails during final guarded CAS write, `ecomos_rfq_discard_unlinked_order()` deletes or cancels the orphan order and releases the conversion claim (`ecomos_rfq_release_conversion_claim()`) to prevent ghost orders.
- **Authoritative Totals**: Line items are mapped with variation identity preserved and priced from the active accepted revision with store currency (`MAD`).

### 5. Private Document Protection & Anti-Caching
- HTML/PDF document generation (`/quotes/{id}/document`) strictly validates guest token / staff capability via `ecomos_rfq_verify_document_access()`.
- Both document and quote REST endpoints emit `Cache-Control: no-store, private` headers to prevent public intermediate caching.

## Attack & Contract Test Matrix

| Scenario / Attack Vector | Target / Route | Expected Result | Verified Result |
| --- | --- | --- | --- |
| Terminal state immutability: transition out of `converted` | `state-machine.ts` | `IllegalTransitionError` | PASS |
| Terminal state immutability: transition out of `rejected` | `state-machine.ts` | `IllegalTransitionError` | PASS |
| Terminal state immutability: transition out of `expired` | `state-machine.ts` | `IllegalTransitionError` | PASS |
| Revision snapshot immutability across edits | `state-machine.ts` | Old revisions preserved intact with `isCurrent: false` | PASS |
| Accept superseded / stale offer revision | POST `/api/rfq/offers` (`action: accept`) | HTTP 409 `STALE_REVISION` | PASS |
| Accept expired offer revision | POST `/api/rfq/offers` (`action: accept`) | HTTP 410 `QUOTE_EXPIRED` | PASS |
| Reject already accepted quote | POST `/api/rfq/offers` (`action: reject`) | HTTP 400 / 409 Invalid State Transition | PASS |
| Revise already accepted quote | POST `/api/rfq/offers` (`action: revise`) | HTTP 400 / 409 Invalid State Transition | PASS |
| Amend offer on accepted/converted quote | POST `/quotes/{id}/offers` | HTTP 409 `invalid_state_transition` | PASS |
| Multi-revision durability across process restart | `JsonFileRfqQuoteStore` | Full revision array & accepted state preserved | PASS |
| Raw WordPress persistence mapping | `WordPressRfqQuoteStore.map()` | Strongly-typed `OfferRevision[]` with parsed lines | PASS |
| Concurrent conversion lock race | `conversion.php` (`claim_quote_for_conversion`) | Exactly 1 winner, loser gets 409 `conversion_in_progress` | PASS |
| Replayed conversion idempotent response | `conversion.php` (`convert_quote_to_order`) | Replay returns existing order, `isDuplicate: true` | PASS |
| Order creation link failure rollback | `conversion.php` (`discard_unlinked_order`) | Orphan order voided, claim released | PASS |
| Addon OFF isolation | All RFQ routes | HTTP 404 `ADDON_DISABLED`, zero side effects | PASS |

## Test Suite Executions

- **Plugin Contracts Suite**:
  `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs`
  -> **11/11 passed**, exit code 0.
- **RFQ Vitest Suite**:
  `pnpm test rfq`
  -> **9 test files, 69/69 passed**, exit code 0.
- **Full Workspace Test Suite**:
  `pnpm test`
  -> **63 test files, 543/543 passed**, exit code 0.
- **Typecheck Verification**:
  `pnpm --filter @ecom-os/addons-rfq typecheck`
  -> **0 errors**, exit code 0.
