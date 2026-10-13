# Correction to the LIVE-001..009 evidence, 2026-10-13

Checked against the running `paraloca.local` database and the repository at `f781569`. This record corrects wording in `docs/ecomos/evidence/LIVE-*/report.md` and the `PROGRESS.md` summary. The underlying journeys that did run are not withdrawn; the claims below are.

## What was confirmed live

- Guest COD orders 18, 19 and 20 exist: status `processing`, customer 0, 114.95 MAD, payment method `cod`. Order 18 carries the note `[ecomos-attempt:att_fed8356a-...]`.
- RFQ persistence is real. `wp_ecomos_rfq_quotes` holds 13 quotes and 6 revisions. Quote DEV-2026-2622 is converted to order 22 and DEV-2026-4811 to order 23, each exactly once. Both orders exist and are `pending`.
- 103 published products. Re-run by this check at `f781569`: lint 0 errors (35 warnings), type check 0 errors, 607/607 unit tests, hub tests 16/16.

## Claims corrected

| Claim in reports or summary | What the database and code show |
|---|---|
| Orders are in HPOS (`wp_wc_orders`), "HPOS enabled" (LIVE-002, 003, 005) | **False.** `woocommerce_custom_orders_table_enabled = no`, no `wc_orders` table, orders are `shop_order` posts. LIVE-006 says this correctly and contradicts the others. The plugins' HPOS declaration has therefore never been exercised. |
| RFQ conversion created order 19 (chat summary) | Order 19 is a plain guest COD purchase. Conversion orders are 22 and 23. |
| Order 18 totals 270 MAD (chat summary) | 114.95 MAD. |
| LIVE-005 "indexed correlation (`_ecomos_attempt_id`)" | No source file writes or reads `_ecomos_attempt_id`. The commit changed only a report. Lookup is still the capped scan of `customer_note`. The scan is fast because the site has 9 orders. Exact indexed correlation is NOT implemented. |
| LIVE-005 "crash and reboot" | In-process simulation with a second store instance, not an OS process kill. |
| LIVE-006 "application rollback rehearsal PASS" | It re-ran the isolated database-restore suite and imported a dump on port 3309. No application, plugin or config rollback was executed and no recovered application read was shown. The follow-up audit asked for exactly that; it remains NOT RUN. |
| Isolated restore keeps "port 10005 untouched" | Local's MySQL port moved during the session (my.cnf now says 10006, mysqld listens on 10005). Port facts in the reports are unreliable. |

## Still open

- Application and plugin rollback rehearsal: NOT RUN.
- Exact indexed order correlation: NOT IMPLEMENTED (capped scan fails closed, which is safe).
- HPOS-on run of checkout and RFQ conversion: NOT RUN.
- Second isolated client: BLOCKED (owner must create a second Local site).
- Eight merchant approvals: UNAPPROVED.
- Independent verifier result (`verification/LIVE-GATE`): not yet written at the time of this check.
- Staging holds test data: 13 quotes (one stray `DEV-2026-9999`) and 9 orders.

## Update 2026-10-13 (later): HPOS now actually tested

Staging storage was switched from legacy posts to HPOS with sync on (`wp wc hpos enable --with-sync --ignore-plugin-compatibility`; the override was needed because WP-CLI reports "GraphQL for eCommerce" as undeclared although its code declares `custom_order_tables`). Backups taken before and after, outside the repo.

- `wc_orders` now holds every order (19 at the time of the run) and legacy posts mirror it (sync mode). Guest COD orders 186 to 195: customer 0, `cod`, status `processing`.
- `sprint-b-commerce.spec.ts`: 8 passed, 1 skipped (`excessive quantity`, NOT MEASURED: the default theme's product page has no quantity input). This includes catalog, variation, cart edits, full COD journey, duplicate-submit guard and a second purchase.
- `sprint-b-rfq-live-browser.spec.ts`: 1 passed.
- Staff conversion under HPOS: accepted quote DEV-2026-7908 became order 196 in `wc_orders` (customer 0, MAD, 3 lines, one linked order). A second convert call returned the same order with `isDuplicate: true`.
- Test fix: the fixture finder in `sprint-b-commerce.spec.ts` picked a seeded scale product once 103 products existed. It now reads oldest-first and requires the `ECOMOS-TEST` SKU prefix.
- Theme note: runs used the starter's default theme (`THEME_NAME=angelina`). That is expected: EcomOS is the starter and ParaLoca is a later instance. Reports that say "ParaLoca" mean the platform on its default theme.
- Still NOT RUN: application/plugin rollback rehearsal, exact indexed order correlation (not implemented), second isolated client.
