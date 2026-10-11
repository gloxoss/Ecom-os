# ECO-1201 evidence: guest-commerce browser journeys (spec + static proof; live legs BLOCKED)

- Assignment base: `f66d93b05fff084fa0249ce5d1822f72ce398582` (ECO-1102 tip)
- Branch: `sprint-b/commerce-ECO-1201` in the isolated commerce worktree (main tree untouched)
- Changed files in submission slice:
  - `apps/storefront/e2e/sprint-b-commerce.spec.ts` (new, 9 tests)
  - `docs/ecomos/evidence/ECO-1201/report.md` (this file)
- Claimed but intentionally unchanged: catalog/product/cart/checkout
  features, cart-store, engine (no application defect found that this task
  could fix without live proof; journey code paths are those proven in
  Sprint A unit suites).

## What the spec proves (when staging is available)

- `ECO-1201 guest catalog and PDP (read-only)`: fixture render,
  exact-SKU discovery, variation price/purchasability honesty, honest
  out-of-stock states. Fixtures discovered at runtime by SKU (never
  hardcoded IDs); variation IDs read from the parent-embedded list because
  the Store API has no variations collection route (verified live:
  `/products/13/variations` -> 404, parent embeds `[{id:14,...}]`).
- `ECO-1201 cart edits`: variation add, quantity edit, refresh persistence
  via Cart-Token, removal reconciliation.
- `ECO-1201 COD checkout`: full journey to `/checkout/success` with HPOS
  readback matching email, currency, totals and the exact line multiset;
  repeat-submit single-order guard via HPOS min/max id diff; fresh-context
  second purchase; excessive-quantity refusal.
- `ECO-1201 mobile viewport`: catalog/PDP on an explicit Pixel 7 context
  (device descriptors are forbidden inside describe, so no worker fork).
- Honesty gates (repo NOT MEASURED precedent): staging down -> skip;
  `ECOM_LIVE_MUTATIONS!=1` -> mutation legs skip as BLOCKED on the
  php-staging holder; absent `WC_REST_URL/KEY/SECRET` -> HPOS legs skip;
  system Chrome via `ECOM_CHROME_PATH` since Playwright browsers are not
  installed on this machine.

## Executed checks (exact)

- `tsc --noEmit --incremental false -p apps/storefront/tsconfig.json`
  (covers the spec: tsconfig includes `**/*.ts`) -> exit 0, 0 errors.
- `tsc -p packages/engine-woocommerce/tsconfig.json --noEmit` -> exit 0
  (unchanged package, re-verified).
- `vitest run` (whole repo) -> exit 0, 62 files, 547/547 PASS.
- `playwright test -c apps/storefront/playwright.config.ts --list
  apps/storefront/e2e/sprint-b-commerce.spec.ts` -> 9 tests listed, 0 parse
  errors (one authoring fix needed: `test.use(devices)` inside describe is
  illegal; replaced with an explicit mobile context).
- Live staging probes (read-only GETs, no mutations):
  `http://paraloca.local/wp-json/` -> 200; `…/wc/store/v1/products` -> 200
  with exactly fixtures 12 simple `ECOMOS-TEST-SIMPLE`, 13 variable
  `ECOMOS-TEST-VARIABLE`, embedded variation 14.

## Live execution: BLOCKED with measured evidence

- Read-only legs (4 tests) EXECUTED against a worktree dev server and
  FAILED at `page.goto('/')` with `net::ERR_CONNECTION_REFUSED`, then 500s:
  (1) the dev server binds IPv4 only with `--hostname 127.0.0.1` while
  `localhost` resolves to `::1` first; (2) without the flag it binds dual
  but `/` -> 500 while compiling `/[locale]`, then the process died;
  (3) root cause: this worktree has no installed `node_modules` (pnpm shim
  broken in this runtime, `workspace-install` held elsewhere), and the
  gitignored directory junctions used for unit-test resolution are rejected
  by Turbopack (`Symlink [project]/apps/storefront/node_modules is invalid,
  it points out of the filesystem root`) and unstable under webpack.
  No storefront could be served from this worktree; the server processes
  were stopped and the temporary env hardlink removed (main-tree
  `.env.local` untouched, no secret printed or committed).
- Mutation legs (5 tests) SKIPPED by gate: `php-staging` is held by ECO-1203
  recovery, and order creation is a staging mutation. HPOS legs additionally
  need runner `WC_REST_*` credentials, absent here.
- Playwright browsers (`~/.cache/ms-playwright`) absent; download needs
  `workspace-install`. System Chrome 154 present and wired as fallback,
  unproven for lack of a server.
- Per-condition verdict: catalog/PDP/cart/journey/HPOS browser proof =
  BLOCKED (environment), spec authoring plus static suites = PASS. The
  verifier should return inconclusive on the live legs and re-run this exact
  spec once php-staging plus an installed worktree are available; no spec
  change is needed for that run except `ECOM_LIVE_MUTATIONS=1` and staging
  credentials in the runner environment.

## Risks and rollback

- Risk: none to the product; this submission adds one spec file plus this
  report. No application, fixture, staging, or production state changed.
- Rollback: revert.
- `git-index` remains held by recovery tasks; the commit is worktree-local
  on the isolated branch (own index, no shared-tree staging), disclosed as
  with ECO-1099/ECO-1101/ECO-1102.
