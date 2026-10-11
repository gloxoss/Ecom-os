# ECO-1211 evidence: catalog scale and search freshness

- Assignment base: `2cb3fb7ff380fc93e08ace0dec2a83209cddca97` (ECO-1201 tip)
- Branch: `sprint-b/commerce-ECO-1211` in the isolated commerce worktree
- Changed files in submission slice:
  - `packages/ecom-engine/src/search/__tests__/scale.test.ts` (new, 8 tests)
  - `apps/storefront/e2e/sprint-b-discovery.spec.ts` (new, 5 tests)
  - `docs/ecomos/evidence/ECO-1211/report.md` (this file)
- Claimed but intentionally unchanged: products/mappers/graphql providers,
  catalog features, search components (no application defect found; the one
  real discovery below is a wiring gap, not a code bug in claimed logic).

## Proven at provider level (executed, attributable)

Deterministic 120-document synthetic corpus (seeded PRNG, 80 simple plus 40
variable including one 60-variation product, 110 categories, French-accented
names, exact SKUs) through `NativeWooSearchProvider` plus `SearchSyncManager`:

- Ingest 120 docs, health count 120, category facet breadth >= 100.
- Exact SKU ranks first (`ECOMOS-SCALE-1042` -> `scale-42`, total 1);
  variation SKU resolves to the parent with all 60 variations present.
- Accent folding both directions (`creme` finds `Crème`, `Fès` matches);
  technical identifiers never fuzzy-hijacked (`exact_sku` score path);
  true typos match nothing rather than the wrong item (native provider has
  no fuzzy engine; typo tolerance stays provider-side with Meilisearch /
  Typesense, not claimed here).
- Paging pageSize 20 over 120 docs: 6 pages, pairwise-disjoint union of all
  120 IDs, byte-identical repeat reads (non-repeating, deterministic).
- Combined category/in-stock/price filters plus price asc/desc sorts assert
  every returned row satisfies every predicate and ordering.
- Sync: price/stock update reflected, delete removes, transient failure
  requeues then succeeds, permanent failure dead-letters, rebuild re-indexes,
  reconcile reports exactly missing 1 / stale-stock 1 / orphaned 1 and
  repairs to healthy on re-run.
- Measured (recorded, no budget asserted — no agreed budgets exist):
  native search over 120 docs, 200 mixed queries: p50 0.44ms, p95 2.84ms,
  max 3.75ms on this machine. Freshness metrics counters verified present
  and monotonic; propagation-lag math covered by sync tests.

## Honest UI finding

`SearchAutocomplete` (combobox/listbox, debounce, mobile dialog) exists
with unit tests but is mounted nowhere in the app: keyboard-dropdown,
debounced-suggestion, and mobile-suggestion e2e legs have no surface to
drive. Unit proof stands (keyboard-nav, rate-limit, autocomplete render
tests, all passing); wiring the component into the header is separate
product/UI scope, flagged here, not smuggled into this task.

## Live e2e: BLOCKED with measured evidence (nothing invented)

- Staging is alive: Store API products -> 200 with exactly 2 fixtures
  (12 simple, 13 variable, embedded variation 14); the variations
  collection route 404s (discovery reads parent-embedded IDs instead).
  Fixture scale < 100, so 100-product traversal is NOT MEASURED; seeding
  100 fixtures is php-staging scope, not performed (php-staging held by
  ECO-1203 recovery).
- No runnable storefront can be served from this worktree: pnpm is broken
  in this runtime, `workspace-install` is held elsewhere, and gitignored
  directory junctions for unit-test resolution are rejected by Turbopack
  and unstable under webpack (proven during ECO-1201).
- A foreign-owned same-family dev server occupies :3000 (PID 78784,
  authoritative tree, another session's env branding it "Beano Coffee";
  not killed, not mine). One e2e run executed 3 legs against it and they
  passed there — those passes are EXPLICITLY DISAVOWED as evidence for this
  submission (unknown tree, unknown env, not my claimed code). The census
  leg timed out against the same slow server. The spec now carries an
  app-identity gate plus honest skip reasons so no future run can silently
  attribute foreign behavior.
- Playwright browsers are not installed (needs `workspace-install`);
  system Chrome 154 is wired as fallback, unproven for lack of a server.

## Executed checks (exact)

- `tsc -p packages/ecom-engine/tsconfig.json --noEmit` -> exit 0.
- `tsc --noEmit --incremental false -p apps/storefront/tsconfig.json`
  (covers both spec files) -> exit 0.
- `vitest run` (whole repo) -> exit 0, 62 files + search suite: 555/555
  PASS (547 prior + 8 new scale).
- `playwright --list sprint-b-discovery.spec.ts` -> 5 tests load, 0 parse
  errors. Live run: 3 unattributable passes DISAVOWED, 1 timeout against
  the foreign server, remainder gated skips.
- Per-condition verdict: provider mechanics = PASS with measurements;
  live 100-scale traversal, search-box interaction, and freshness/p95
  budgets against staging = BLOCKED (fixture scale, php-staging, runnable
  server, agreed budgets all absent). The verifier should rule
  inconclusive on those legs; re-running the unchanged specs with staging
  scale plus credentials needs no code change except env
  (`ECOM_LIVE_MUTATIONS=1`, `WC_REST_*`).

## Risks and rollback

- Risk: none to the product; one new unit-test file, one new spec file,
  this report. No application, fixture, staging, or production change.
- Rollback: revert.
- `git-index` remains held by recovery tasks; commits are worktree-local on
  the isolated branch (own index, no shared-tree staging), disclosed as in
  all prior commerce submissions.
