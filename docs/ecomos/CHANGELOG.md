# EcomOS Release Changelog

All notable changes to the EcomOS codebase across all development phases are documented here.

> **Read with the correction record.** The `1.0.0` entries below are hub task titles, not verified outcomes. Several are withdrawn in whole or part by `release/CORRECTION_2026-10-11.md`: the "CI matrix" (a single workflow job, see `release/CI_MATRIX.md`), the PHP/HPOS "compatibility matrix with Store API upgrade proofs" (no plugin declares HPOS; see `release/BACKEND_MATRIX.md`), the "provisioning CLI" (no runnable command; see `operations/PROVISION.md`), the "disaster recovery rehearsal" (a simulation; see `operations/RESTORE.md`), and "proving engine reuse" (no second deployment; see the correction record). Where this changelog and that record conflict, the record wins.

---

## [1.0.0-rc.5] - 2026-10-13

- **Added:** client shell overrides (`client-shells/<id>.tsx`: `htmlLang`, `Header`, `Footer`, `Landing`) so a client instance can own its storefront without editing core files. The starter ships none.
- **Migration:** see `MIGRATIONS.md` section 1.0.0-rc.5.

## [1.0.0-rc.4] - 2026-10-13

- **Fixed:** `THEME_NAME` from `.env.local` is honored by the theme generator; an unknown theme fails loudly.
- **Added:** `scripts/seed-instance-fixtures.php`, configurable Playwright `STOREFRONT_URL`, connector-role guidance.
- **Fixed (tests):** the live RFQ browser spec no longer depends on the starter site: it reads `STOREFRONT_URL`, `ECOM_STAGING_URL`, finds fixtures by SKU and takes staff credentials from `ECOM_RFQ_WP_*`.
- **Proven on an instance:** the ParaLoca instance (own WordPress, own database, HPOS only, no legacy sync) passes the guest checkout spec (8 passed, 1 not measured) and the RFQ browser journey, and a staff quote-to-order conversion is idempotent.
- **Migration:** see `MIGRATIONS.md` section 1.0.0-rc.4.

## [1.0.0-rc.3] - 2026-10-13

- **Added:** `scripts/generate-clients.mjs` generates the client profile and theme registries from the folders on disk. Adding a client no longer edits `client-profile.ts` or the themes index. The guard fails if the generated files are stale.
- **Migration:** see `MIGRATIONS.md` section 1.0.0-rc.3.

## [1.0.0-rc.2] - 2026-10-13

First release cut with git tags and instance tooling. A release candidate, not production-certified (see `release/CORRECTION_2026-10-13_LIVE.md`).

- **Fixed:** order recovery no longer reports "not found" after a capped scan; search suggestions report 503 instead of an empty 200 on upstream failure; storefront lint is clean (0 errors); `typescript` pinned in two packages; `@ecom-os/addons-rfq` added to the lockfile so a fresh install works.
- **Tested live on HPOS:** guest COD checkout, duplicate-submit guard, RFQ browser journey and staff quote-to-order conversion with idempotent replay.
- **Added:** `scripts/ecomos-release.mjs` (validate, bump, tag), `scripts/ecomos-upgrade.mjs` (preview or apply a starter update in an instance), `docs/ecomos/MIGRATIONS.md`, `docs/ecomos/FIX_LEDGER.md`, `docs/ecomos/UPDATING_INSTANCES.md`, `docs/ecomos/PARALOCA_INSTANCE_PLAN.md`, and the `ecomos-*` skills for instances.
- **Migration:** see `MIGRATIONS.md` section 1.0.0-rc.2.
- **Not done:** application rollback rehearsal, exact indexed order correlation, a second isolated client, merchant approvals.

## [1.0.0] - 2026-10-10

### Phase 9: Release Readiness, Hardening & Final Launch Gate
- `ECO-901`: Stable CI matrix, performant release budgets, and cross-profile regression test suite.
- `ECO-902`: WordPress, WooCommerce, PHP, and HPOS compatibility matrix with Store API upgrade proofs.
- `ECO-903`: Client environment provisioning CLI, disaster recovery rehearsal, and safe health observability.
- `ECO-904`: Demo Client 2 initialization with contrasting theme, proving engine reuse without source duplication.
- `ECO-905`: Complete installation, extension, and compatibility documentation suite.
- `ECO-906`: Production launch authorization gate and signed domain cutover runbook.

### Phase 8: French-Moroccan ParaLoca Profile & Storefront Customization
- `ECO-801`: Canonical ParaLoca client profile (`paraloca.ma`, `fr-MA`, `MAD`, certified `cod` only).
- `ECO-802`: Light minimal medical-lifestyle visual direction and accessible presentation shell.
- `ECO-803`: Medical equipment taxonomy, multi-brand showcase, and guest-first local favorites.
- `ECO-804`: Owned-brand classification within single B2C WooCommerce product catalog.
- `ECO-805`: Discreet healthcare professional quotes addon activation and PDP CTAs.
- `ECO-806`: Truthful medical content dossier, Moroccan Law 84-12 compliance, and claims inventory.
- `ECO-807`: Mobile and desktop French staging acceptance suite preserving Coming Soon landing page.

### Phase 7: Quotes / RFQ Addon Architecture
- `ECO-701` to `ECO-707`: Formal RFQ state machine, variation-aware quote basket, duplicate-safe submission, WordPress companion plugin (`wp-ecomos-rfq`), revisioned offers, HPOS order conversion, and complete off-state isolation.

### Phase 0–6: Foundation, Commerce, Search, Themes & Administration
- Complete dual-engine architecture, headless WooCommerce integration, search abstraction (Native, Typesense, Meilisearch), client theme engine, and merchant administration bridges.
