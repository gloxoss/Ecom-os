# EcomOS v1.0.0 Release Candidate Packet: ParaLoca

- **Document:** `RELEASE_PACKET.md`
- **Application:** EcomOS Dual-Engine Modular Storefront
- **Release Candidate Version:** `v1.0.0-rc1` (Post-Audit Hardened)
- **Target Domain:** `paraloca.ma` (DNS cutover gated)
- **Staging Domain:** `staging.paraloca.ma`
- **Merchant Entity:** ParaLoca SARL (Casablanca, Maroc)
- **Status:** **LOCAL RELEASE CANDIDATE (RC1) — ENGINEERING REGRESSIONS REPAIRED · BROWSER RUN & PRODUCTION CUTOVER GATED**

---

## 1. Executive Summary & Release Decision

This release packet consolidates the complete Sprint A (Platform Stabilization & Restore Safety), Sprint B (Commerce Scale, RFQ & Multi-Client Isolation), and Sprint C (Hardening & Candidate Verification) milestones, along with the complete engineering resolution of the October 12 technical audit (`Audit 2026-10-12.md`). All identified engineering defects have been independently verified and repaired on the canonical integration line.

### Launch Candidate Gating Status:
- **Engineering & Core Platform:** **PASS (READY)**. Zero build or type errors, 604/604 workspace Vitest tests passing, 5/5 isolated audit regression tests passing (`audit-vitest.config.mts`), PHP 8.2 CLI migration guard verified, Next.js 16 production build passing (15/15 routes compiled), live checkout recovery wired into WooCommerce adapter with in-flight concurrency protection, SearchAutocomplete mounted without synthetic demo suggestions, and migration guard constraints proven.
- **Live Staging Browser Journeys:** **GATED / NOT RUN**. Playwright test census lists 37 journey tests across commerce, rfq, and discovery; real browser execution against live local services (`apps/storefront` dev server and local WordPress staging) is gated on staging server availability.
- **Client Merchant Disclosures:** **GATED / BLOCKED**. In accordance with Moroccan Law 84-12 / Law 31-08 compliance invariants, the eight merchant facts in [`clients/paraloca/content-approval.md`](../../clients/paraloca/content-approval.md) remain explicitly flagged as **UNAPPROVED**.
- **Operational Boundary:** **LOCAL RELEASE CANDIDATE ONLY**. Automated production deployments, live payment gateway activations, public DNS repointing, and destructive database operations are strictly quarantined until authentic merchant owner authorization.

---

## 2. Pinned Milestone Provenance & Architecture Ledger

Every deliverable across Sprint A, Sprint B, Sprint C, and the October 12 audit remediation is represented on this release candidate line:

| Milestone / Task | Lane | Core Guarantee | Accepted Commit SHA | Status |
|---|---|---|---|---|
| **ECO-1099** | Commerce | ExactOptionalPropertyTypes strict payload compliance | `8659352` | ACCEPTED |
| **ECO-1100** | Platform | Pinned green monorepo stabilization baseline | `5dd5bce` | ACCEPTED |
| **ECO-1101** | Commerce | Authoritative cart multiset diff reconciliation | `daa4811` | ACCEPTED |
| **ECO-1102** | Commerce | Durable atomic attempt claims & crash recovery | `f66d93b` | ACCEPTED |
| **ECO-1103** | RFQ | Decoupled guest secrets & transport error propagation | `60eccd2` | ACCEPTED |
| **ECO-1104** | RFQ | Immutable quote revisions & single-conversion lock | `2fbada8` | ACCEPTED |
| **ECO-1105** | Platform | Isolated MySQL port 3309 with restricted target user | `ceb8f3d` | ACCEPTED |
| **ECO-1106** | Platform | Database fidelity (54 tables) & non-destructive rollback | `dce9598` | ACCEPTED |
| **ECO-1107** | Platform | Sprint A unified integration gate | `e98aa51` | ACCEPTED |
| **ECO-1201** | Commerce | Guest catalog, PDP variation resolution, out-of-stock | `2cb3fb7` | ACCEPTED |
| **ECO-1202** | RFQ | End-to-end quotation journeys & RFQ-off fail-closed | `325ca7d` | ACCEPTED |
| **ECO-1203** | Platform | Real WP 7.1.3 + WC 11.2.1 + PHP 8.2 backend boot & CI | `1f3f8f2` | ACCEPTED |
| **ECO-1211** | Commerce | 120-product scale corpus, exact-SKU & accent folding | `f48ab12` | ACCEPTED |
| **ECO-1212** | RFQ | Theme registry (`paraloca`, `demo-2`), CMS fallbacks | `325ca7d` | ACCEPTED |
| **ECO-1213** | Platform | Scoped store manager roles & dynamic table prefix guard | `9e9af98` | ACCEPTED |
| **ECO-1204** | Platform | Multi-client deployment isolation & Sprint B gate | `090bc00` | ACCEPTED |
| **ECO-1301** | RFQ | ParaLoca merchant UAT dossier & Law 84-12 invariants | `6121ed4` | ACCEPTED |
| **ECO-1302** | Platform | Pinned release candidate packet & readiness audit | `cf23d18` | ACCEPTED |
| **ECO-1401** | Commerce | Checkout intent binding, attempt recovery & status HMAC | `ab44fa8` | ACCEPTED |
| **ECO-1402** | Commerce | SearchAutocomplete mounting & catalog scale discovery | `aee7ad8` | ACCEPTED |
| **ECO-1403** | RFQ | Real page-driven RFQ quotation & single conversion | `a34578a` | ACCEPTED |
| **ECO-1404** | Platform | Application rollback verification & migration guard constraints | `afca6bf` | ACCEPTED |
| **ECO-1405** | Platform | Release candidate packaging & readiness audit baseline | `1e939b6` | ACCEPTED |
| **Audit Remediation** | Commerce / Platform | F1-F5 concurrency, suggestions truthfulness, migration guard fixes | `sprint-integrated-authoritative` | ACCEPTED |

---

## 3. Core Architectural Guarantees & Audit Hardening

### 3.1 Checkout Attempt Durability, In-Flight Protection & Multi-Page Recovery
- **File-Claim Locking & In-Flight Tracking**: Simultaneous purchase attempts across separate OS processes acquire atomic filesystem locks (`FileClaimAttemptStore`). In-flight attempts register active workers (`inFlightCheckoutAttempts`), strictly preventing duplicate Store API POST submissions for active workers even after the 15-second window.
- **Uncertain Outcome Preservation**: When network errors occur during Store API submission, if lookup returns `null`, the attempt remains `PENDING` rather than transitioning to `FAILED`, preventing hazardous premature retries.
- **Multi-Page Correlation Query**: The live `WooCommerceEngine` adapter query traverses up to 10 pages (1,000 orders) by default, 50 pages (5,000) at most, to discover matching correlation tokens `[ecomos-attempt:<key>]`, ensuring attempts are not missed when store history exceeds 100 orders.
- **Session Intent Retention**: `purchaseAttemptId` is preserved in `sessionStorage` per cart session, ensuring attempts remain bound across browser reloads.

### 3.2 Discovery & Truthful Search Autocomplete
- **Mounted Search Surface**: `SearchAutocomplete` is mounted in both desktop and mobile header navigation (`SiteHeaderClient`) and within the search results page (`SearchBar`).
- **Accent Folding & Honest Catalog Results**: Suggestions endpoint (`/api/search/suggestions`) performs French diacritic folding (`normalizeText`, matching `creme` to `Crème Hydratante Bio`). Hardcoded demo products (`DEMO_ITEMS`) have been completely removed; empty catalog queries or engine communication errors honestly return empty groups without spoofing products.
- **Scale Corpus**: Verified against 120-document corpus, 110 categories, 60 product variations, exact-SKU matching, and stable 6-page pagination.

### 3.3 Quotation Lifecycle & Single Conversion
- **Decoupled Guest Secrets**: Guest quote interaction relies on cryptographically secure 64-char SHA-256 tokens (`accessSecretHash`).
- **Immutable Revision Progression**: Revisions advance append-only (`rev_1` -> `rev_2`), archiving older revisions with `isCurrent: false`.
- **Conversion Lock**: Guest quote acceptance transitions to `accepted` and WooCommerce order generation atomically links the order ID, strictly preventing double order creation on replay.
- **Domain Contract Validation**: RFQ route contracts and state machine lifecycles pass all 10 integration contract tests (`apps/storefront/e2e/sprint-b-rfq.spec.ts`).

### 3.4 Two-Client Tenant Isolation
- **Client 1 (`ParaLoca`)**: Runs on port 10005/3308, database `ecomos_wp`, currency MAD. Storage uses native WooCommerce HPOS tables (`wp_wc_orders`), with 18 real orders verified and 0 legacy posts. Quotation capability is enabled.
- **Client 2 (`Nordic Craft Supplies` / `demo-2`)**: Runs on port 8081/3307, database `ecomos_client2`, currency EUR. Storage uses legacy post storage (`wp_posts` with `post_type = 'shop_order'`), holding Order 12 (158.00 EUR, COD, `_customer_user = 0`). HPOS tables are absent. Quotation capability is disabled (`quotes: false`, fail-closed HTTP 404).
- **Tenant Separation**: Zero cross-tenant data crossover, independent authentication salts and REST key pairs, separate databases.

### 3.5 Hardened Migration Guard & Regulatory Disclaimers
- **Strict Migration SQL Guard**: `ecomos_sql_targets_core_table` in `lifecycle.php` blocks any destructive statement (`DROP`, `ALTER`, `TRUNCATE`, `RENAME`, `DELETE`) referencing core WordPress or WooCommerce tables, explicitly blocking multi-table operations (`DROP TABLE t1, wpt_posts`, `RENAME TABLE t1 TO t2, wpt_posts TO wpt_posts_old`) and alias deletes (`DELETE p FROM wpt_posts AS p`). Verified via direct PHP 8.2 CLI execution.
- **Moroccan Law 84-12 / Law 31-08 Compliance**: Zero fictitious Ministry of Health (DMP) registration codes, zero clinical superiority or cure claims, and mandatory patient disclaimers on all diagnostic and orthopaedic PDPs.
- **Merchant Content Invariant**: All eight proposed merchant disclosures in `clients/paraloca/content-approval.md` remain explicitly marked `UNAPPROVED` until authentic merchant signature is recorded.

---

## 4. Test & Verification Summary

| Test Suite | Scope | Assertions Passed | Exit Code |
|---|---|---|---|
| **Vitest Full Workspace** | Commerce, RFQ, Engines, Themes, Brands | 604 / 604 (67 files) | **0** |
| **Audit Regressions (Oct 12)** | Concurrency (F1), Unknown State (F2), Pagination (F3), Suggestions (F4) | 5 / 5 (`audit-vitest.config.mts`) | **0** |
| **PHP Migration Guard Audit** | Core table protection across multi-table/alias DDL/DML (F5) | 4 / 4 blocked (PHP 8.2 CLI) | **0** |
| **Next.js Production Build** | Next.js 16 storefront bundle & 15 routes | 15 / 15 routes generated | **0** |
| **ParaLoca Client Suite** | Profiles, schemas, content approval, RFQ policy | 19 / 19 | **0** |
| **Restore Isolation Suite** | MySQL port 3309 isolation, credentials, decoys | 23 / 23 | **0** |
| **Addon Lifecycle & Migration Guard** | DDL/DML core table guard, data retention | 6 / 6 (`lifecycle.spec.mjs`) | **0** |
| **RFQ Contract Spec** | Quotation workflow, local sink, RFQ-off fail-closed | 10 / 10 | **0** |
| **Engine Import Guard** | Clean modular import boundaries & runtime reexports | 13 / 13 | **0** |
| **Agent Hub Protocol** | Immutability, lock safety, phase gates | 16 / 16 | **0** |
| **TypeScript Compiler** | Storefront & workspace packages | 0 errors | **0** |
| **Playwright E2E Census** | E2E journeys (commerce, rfq, discovery) | 37 tests listed (Gated on staging) | **0** |
| **Total Automated Proof** | **Full Monorepo** | **695+ passed, 0 failed** | **0** |

---

## 5. Rollback & Disaster Recovery Runbook

1. **Storefront Rollback**: In the event of application regression, revert the storefront process to the previous known green release tag. Configuration reverts via environment backup.
2. **Database Rollback**: Rehearsed in `docs/ecomos/operations/rollback.md`. Restorations execute exclusively against isolated MySQL instances (port 3309) with restricted target credentials, leaving live databases untouched.
3. **Data Protection Invariant**: The dynamic core table guard (`ecomos_sql_targets_core_table`) prevents destruction of core WooCommerce orders, posts, postmeta, options, users, or order items tables during addon migrations and rollbacks.



> **Recovery limit (2026-10-12 follow-up audit).** If the order scan reaches its cap with every page full, the lookup now throws and checkout keeps the attempt PENDING. It no longer returns "not found", which would not prove an older order is absent.
