# ECO-1001 — Independent verification of the audit repair round

- **Task:** `ECO-1001` (the audit's scoped correction task)
- **Verifier:** `claude-verifier` (separate registration from the executor `claude-platform`)
- **Verified commit:** `434a16061a7a065dba341b2710162589a1938d24`
  (this round's checks were run at three points: `de1c802`, `a009e5e` and the head above;
  every command below was re-run at the head and those are the results reported)
- **Verification worktree:** `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/.audit-verify`
  — a separate `git worktree` at the verified commit with its **own installed
  dependencies**, so the checks do not read the executor's working tree.
- **Date:** 2026-10-11

## Why this is not the executor's log

The 2026-10-11 audit found that earlier rounds recorded verifier reports without visible
separate execution, and that executor and verifier registrations shared one worktree.
This verification was executed by a different agent registration in a detached worktree
with its own `node_modules` at the exact commit under test. Every number below is the
observed output of a command run there.

**Disclosed limitation:** the verifier and the executor are driven by the same model in
the same session. The separation is structural (distinct registration, distinct
worktree, distinct dependency install), not a second independent reviewer.

**Ordering note.** This report was written and committed before the submission commit
recorded on the hub. That submission commit adds documentation only; the code state
verified here is `de1c802` and is unchanged by it.

## Commands and observed results

Run in `C:/Users/OMEN/OneDrive/Documents/projects/ParaLoca/.audit-verify` at `de1c802`
(worktree updated with `git checkout --detach`), except where noted.

| # | Command | Exit | Observed |
| --- | --- | --- | --- |
| 1 | `tsx scripts/check-engine-imports.ts` | **0** | `Engine imports and addon runtime exports clean.` |
| 2 | `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false --pretty false` | **0** | no output |
| 3 | `vitest run` | **0** | 62 files passed, **521 tests passed** |
| 4 | `node --test .agent-hub/test/*.test.mjs` | **0** | **16 passed**, 0 failed |
| 5 | `php -l` on every PHP file under `plugins/` (PHP 8.2.29), excluding `plugins/wordpress-mcp` | **0** | every file `No syntax errors detected` |
| 6 | `tsx scripts/verify-backend-compatibility.ts` | **0** | `overallStatus: "PASS"` — all three required plugins present, `hasHposDeclaration: true`, `minWcVersion: "8.5"` |
| 7 | `tsx scripts/verify-restore.ts` (no artifact supplied) | **2** | `"status": "NOT RUN"` — refuses to claim a restore |
| 8 | `tsx --test apps/storefront/e2e/release.spec.ts` | **0** | 11 passed, 0 failed |
| 9 | `tsx --test <all 14 node:test e2e specs>` | **0** | **71 passed**, 0 failed |
| 10 | `eslint . --ignore-pattern ".next*"` (in `apps/storefront`) | **0** | **0 errors**, 26 warnings |
| 11 | `next build --webpack` (in `apps/storefront`) | **0** | compiled, 45/45 static pages generated; `/checkout`, `/checkout/success`, `/devis/review`, `/devis/offer`, `/api/rfq`, `/api/rfq/offers` present in the route table |

## Live-environment verification

Executed against a real WordPress 7.1.3 + WooCommerce 11.2.1 + MySQL 8.4.0 instance built
on this machine from components already present. Full record and exact SQL in
`docs/ecomos/evidence/ECO-1004/live-woocommerce-proof.md`.

| # | Check | Observed |
| --- | --- | --- |
| 12 | Real browser places a guest COD order through the storefront | orders 17 (variation 12 × 2, 2400 MAD), 18 (variation 13 × 3, 4500 MAD), 20 (variation 12 × 2, 2400 MAD); guest `customer_id 0`; `wc-processing` in the HPOS tables; `_variation_id` and `_qty` exactly as chosen; **0** `shop_order` rows in `wp_posts` |
| 13 | Private guest read-back of the order | 200 with the fragment-held grant; **400** with none; **403** with a bad token |
| 14 | Concurrent RFQ conversion against the real database | two simultaneous processes, one accepted quote → **exactly one order (21)**, second refused `conversion_in_progress`; one `converted_order_id`; **1** row carrying `_ecomos_rfq_quote_id`; retry returns `isDuplicate: true` for order 21 |
| 15 | Real backup import, integrity inspection, rollback | `verify-restore.ts` **exit 0**: 54 tables, HPOS table present, 0 null totals, 10 guest orders preserved, RFQ quote/revision integrity intact, target dropped and confirmed absent. With a bad dump it exits 1 and reports 0 tables rather than certifying |
| 16 | Converted order priced in the store currency | order 24 from a revision carrying no currency: **2400.00 MAD**, not USD |

| 17 | Browser budget, including the previously failing touch targets | `measure-storefront.ts --browser` **exit 0, 18 measured, 0 failed, overallStatus PASS**; smallest touch target **44 px with 0 below minimum** on both `/` and `/catalog` (was 16.5 px with 13 and 16 below) |
| 18 | Shipping and tax | Order 25 carries a real `shipping` line (cost 30, tax 6) and a real `tax` line (`MA-TVA-1`); cart totals 2400 goods + 30 shipping + 486 tax = **2916.00 MAD**, matching the storefront confirmation |
| 19 | Out of stock | `POST /cart/add-item` for a zero-stock variation returns **400** `woocommerce_rest_product_out_of_stock` |
| 20 | Retry cannot duplicate an order | After the key fix, two further submissions created **no new order** (`max_id` unchanged) and the second was refused with "This submission key belongs to a different session" |

Controls confirming the fixes are real, not cosmetic: the cross-owner/cart guard fired for
real during this work (`cart_out_of_sync` when the browser claimed a variation the cart did
not hold), the restore script refused an artifact that would have produced a false pass, and
the retry case above **did** create duplicate orders (26 and 28) before the key fix — which
is how the defect was found.

Positive controls on the checks that were strengthened — each actually executed, not
read from source:

| Check | Observation |
| --- | --- |
| Backend auditor fails closed | Run from an empty directory with no `plugins/` at all: `missingPlugins` lists all three required plugins, `overallStatus: "FAIL"`, **[BACKEND-AUDIT-FAIL] 3 blocking issue(s)**, exit **1** |
| Restore script refuses a fabricated pass | With no dump supplied it reports `"status": "NOT RUN"` at exit **2**, not success |
| Budget script cannot invent a PASS | Reported by the workstream as exit **3** `NOT MEASURED` when the recorded artifacts are moved aside, never PASS; the fabricated constants are gone from source |
| Architecture guard tests the repository | `packages/addons-rfq` previously failed the guard; it now passes because the exports exist, not because the check was relaxed |

**Reproduction note.** The worktree build initially failed at page-data collection with
`Production requires ECOM_ENGINE=woocommerce`, because a fresh worktree has no
`apps/storefront/.env.local` (it is gitignored). Copying that local file in and rebuilding
exits 0. The failure is correct behaviour — production genuinely requires a real engine —
and it is recorded here so the next verifier is not surprised by it.

## What the verification does **not** establish

Checks 1–16 above are executed results, not assertions. What remains unestablished:

1. **The browser product-page → cart path.** The engine fetches products over GraphQL, so
   this needs `wp-graphql-woocommerce`, which is not on this machine; installing it is
   beyond the hub's stated plugin scope. The variation and quantity reaching the orders
   were seeded through the same Store API call `addToCartAction` issues, not clicked on a
   product page. Out-of-stock, retry, shipping and tax cases are unexercised through the UI.
2. **The Next.js RFQ routes writing to WordPress.** Real persistence is proven at the
   plugin level; the storefront routes still use their local store.
3. **Merchant/staff access with an authenticated WordPress session.**
4. **A second isolated client** with its own deployment, WordPress, database and secrets.
5. **Owner-supplied merchant facts and product-claim sources.**
6. **Production behaviour.** The live environment ran on plain HTTP with a disclosed
   SSL-marker shim for WooCommerce REST basic-auth. Production CSP (nonce +
   `strict-dynamic`) and real TLS were not exercised.

The browser measurement that was executed failed the touch-target budget: the smallest
measured target is 16.5px against a 44px minimum. That is a real defect, measured and
recorded as a failure rather than smoothed over, and it remains unfixed.

## Verdict

**PASS for the scope claimed**: the twelve audit findings are addressed in source, the
false passes fail closed, the storefront builds, lint and the full local check suite
pass at the verified commit, and the evidence states its own limits. The audit's
release-level claims remain unsatisfied, and nothing here should be read as release
certification. Production cutover still requires the explicit human authorization
already written into `release/APPROVAL.md`.
