# ECO-1006 — RFQ conversion authorization, atomicity and variation mapping

**Commit:** `2bfd21e` · **Audit finding:** 4

## Defects reproduced

| # | Defect | Location |
| --- | --- | --- |
| 1 | Conversion route used the guest-readable permission | `routes.php` permission_callback |
| 2 | Caller-supplied `reserve_stock` overrode server policy | `conversion.php` |
| 3 | Read, create order, then an unchecked non-atomic link update | `conversion.php` |
| 4 | Parent product id used; variation collapsed | `conversion.php` |
| 5 | Route forwarded the request body into conversion | `routes.php` |

## Repairs

- Conversion requires `current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')`;
  otherwise a 403 `WP_Error`. The addon-off 404 path is preserved. Public guest
  endpoints (`POST /quotes`, guest read/accept/reject/revise/document) are unchanged.
- Policy comes only from `get_option('ecomos_rfq_stock_reservation')`. The route no
  longer reads the body at all; `$options` is unset in the helper.
- The quote is claimed with a compare-and-set (`accepted` -> transient `converting`,
  and `converted_order_id IS NULL`) and the affected-row count is checked. Zero rows
  re-reads: an existing link returns `isDuplicate`, else 409 `conversion_conflict`. A
  quote already `converting` returns 409 before any write. Order-creation failure
  releases the claim. The final link is itself guarded; if it is not exactly one row
  the order is voided and 500 `conversion_link_failed` is returned — no unlinked order.
- Each line resolves to an exact product or variation before any write; a variation
  whose `get_parent_id()` differs from the quoted product is rejected with 409 and no
  order is created.

## Verification

| Check | Result |
| --- | --- |
| `php -l` on all 8 plugin files (PHP 8.2.29) | exit 0 each |
| `node --test plugins/wp-ecomos-rfq/tests/*.spec.mjs` | exit 0 — 11 passed |
| PHP harness over the real plugin code, stubbed `$wpdb` | exit 0 — 47 checks, 0 failures |

Harness coverage: happy path, `isDuplicate` retry, held-claim 409, lost-claim 409,
policy override attempted in **both** directions, link-failure rollback plus claim
release, bad/unknown product rejection, all four authorization verdicts, the
registered route's guard, and the state gate.

## Not proven

- **No real database.** Concurrency is simulated with stubbed affected-row
  semantics, not observed against MySQL. The audit's requirement — concurrent and
  retried conversion against a real WordPress database yielding exactly one linked
  order — is **not** met.
- Residual design choice: the `converting` claim has no automatic stale recovery, so
  a fatal crash mid-conversion needs a manual reset. Deliberate (stealing a slow claim
  could duplicate an order) and documented at the claim helper.
- Adjacent hole left untouched, outside this task: `POST /revise` and `/reject` call
  `ecomos_rfq_update_state()` with no state condition, so a guest holding the quote
  token can flip an `accepted` quote to `revision_requested`. The conversion link
  guard makes that safe (lost claim voids the order), but the missing transition
  guard is its own finding.
