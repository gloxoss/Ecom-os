# EcomOS v1.0.0 Release Candidate Packet: ParaLoca

- **Document:** `RELEASE_PACKET.md`
- **Application:** EcomOS Dual-Engine Modular Storefront
- **Release Candidate Version:** `v1.0.0-rc1`
- **Pinned Git Base:** `afca6bfcb8a46fad1a6684fbb94ccc60eedf89c3` (authoritative integrated line)
- **Target Domain:** `paraloca.ma` (DNS cutover gated)
- **Staging Domain:** `staging.paraloca.ma`
- **Merchant Entity:** ParaLoca SARL (Casablanca, Maroc)
- **Status:** **LOCAL RELEASE CANDIDATE (RC1) — PRODUCTION CUTOVER GATED**

---

## 1. Executive Summary & Release Decision

This release packet consolidates the complete Sprint A (Platform Stabilization & Restore Safety), Sprint B (Commerce Scale, RFQ & Multi-Client Isolation), and Sprint C (Hardening & Candidate Verification) milestones. All 20 engineering deliverables across the stabilization program have been independently executed, verified, and accepted on the canonical integration line.

### Launch Candidate Gating Status:
- **Engineering & Core Platform:** **PASS (READY)**. Zero build or type errors, 602/602 workspace Vitest tests passing, Next.js 16 production build passing (15/15 routes compiled), live checkout recovery wired into WooCommerce adapter, SearchAutocomplete mounted, real page-driven quotation workflow verified, and migration guard constraints proven.
- **Client Merchant Disclosures:** **GATED / BLOCKED**. In accordance with Moroccan Law 84-12 / Law 31-08 compliance invariants, the eight merchant facts in [`clients/paraloca/content-approval.md`](../../clients/paraloca/content-approval.md) remain explicitly flagged as **UNAPPROVED**.
- **Operational Boundary:** **LOCAL RELEASE CANDIDATE ONLY**. Automated production deployments, live payment gateway activations, public DNS repointing, and destructive database operations are strictly quarantined until authentic merchant owner authorization.

---

## 2. Pinned Milestone Provenance & Architecture Ledger

Every deliverable across Sprint A, Sprint B, and Sprint C is an ancestor of this release candidate:

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

---

## 3. Core Architectural Guarantees

### 3.1 Checkout Attempt Durability & Adapter Recovery
- **File-Claim Locking**: Simultaneous purchase attempts across separate OS processes acquire atomic filesystem locks (`FileClaimAttemptStore`). Duplicate submissions receive HTTP 409 or replay confirmed orders.
- **Authoritative Recovery**: The live `WooCommerceEngine` adapter is wired directly to `findOrderByAttemptCorrelation`. When a submission attempt is interrupted by network loss, recovery queries the customer note correlation token `[ecomos-attempt:<key>]` to revive the confirmed order rather than minting duplicate transactions.

### 3.2 Discovery & Search Autocomplete
- **Mounted Search Surface**: `SearchAutocomplete` is mounted in both desktop and mobile header navigation (`SiteHeaderClient`) and within the search results page (`SearchBar`).
- **Accent Folding**: Suggestions endpoint (`/api/search/suggestions`) performs French diacritic folding (`normalizeText`, matching `creme` to `Crème Hydratante Bio`).
- **Scale Corpus**: Verified against 120-document corpus, 110 categories, 60 product variations, exact-SKU matching, and stable 6-page pagination.

### 3.3 Quotation Lifecycle & Single Conversion
- **Decoupled Guest Secrets**: Guest quote interaction relies on cryptographically secure 64-char SHA-256 tokens (`accessSecretHash`).
- **Immutable Revision Progression**: Revisions advance append-only (`rev_1` -> `rev_2`), archiving older revisions with `isCurrent: false`.
- **Conversion Lock**: Guest quote acceptance transitions to `accepted` and WooCommerce order generation atomically links the order ID, strictly preventing double order creation on replay.

### 3.4 Two-Client Tenant Isolation
- **Client 1 (`ParaLoca`)**: Runs on port 10005/3308, database `ecomos_wp`, currency MAD. Storage uses native WooCommerce HPOS tables (`wp_wc_orders`), with 18 real orders verified and 0 legacy posts. Quotation capability is enabled.
- **Client 2 (`Nordic Craft Supplies` / `demo-2`)**: Runs on port 8081/3307, database `ecomos_client2`, currency EUR. Storage uses legacy post storage (`wp_posts` with `post_type = 'shop_order'`), holding Order 12 (158.00 EUR, COD, `_customer_user = 0`). HPOS tables are absent. Quotation capability is disabled (`quotes: false`, fail-closed HTTP 404).
- **Tenant Separation**: Zero cross-tenant data crossover, independent authentication salts and REST key pairs, separate databases.

### 3.5 Regulatory Truthfulness & Disclaimers
- In accordance with Moroccan Law 84-12: Zero fictitious Ministry of Health (DMP) registration codes, zero clinical superiority or cure claims, and mandatory patient disclaimers on all diagnostic and orthopaedic PDPs.
- All eight proposed merchant disclosures in `clients/paraloca/content-approval.md` remain explicitly marked `UNAPPROVED` until authentic merchant signature is recorded.

---

## 4. Test & Verification Summary

| Test Suite | Scope | Assertions Passed | Exit Code |
|---|---|---|---|
| **Vitest Full Workspace** | Commerce, RFQ, Engines, Themes, Brands | 602 / 602 (67 files) | **0** |
| **Next.js Production Build** | Next.js 16 storefront bundle & 15 routes | 15 / 15 routes generated | **0** |
| **ParaLoca Client Suite** | Profiles, schemas, content approval, RFQ policy | 19 / 19 | **0** |
| **Restore Isolation Suite** | MySQL port 3309 isolation, credentials, decoys | 23 / 23 | **0** |
| **Addon Lifecycle & Migration Guard** | DDL/DML core table guard, data retention | 5 / 5 | **0** |
| **RFQ End-to-End Spec** | Quotation workflow, local sink, RFQ-off | 10 / 10 | **0** |
| **Engine Import Guard** | Clean modular import boundaries & runtime reexports | 13 / 13 | **0** |
| **Agent Hub Protocol** | Immutability, lock safety, phase gates | 16 / 16 | **0** |
| **TypeScript Compiler** | Storefront & workspace packages | 0 errors | **0** |
| **Playwright E2E Census** | E2E journeys (commerce, rfq, discovery) | 37 tests listed | **0** |
| **Total Automated Proof** | **Full Monorepo** | **688+ passed, 0 failed** | **0** |

---

## 5. Rollback & Disaster Recovery Runbook

1. **Storefront Rollback**: In the event of application regression, revert the storefront process to the previous known green release tag. Configuration reverts via environment backup.
2. **Database Rollback**: Rehearsed in `docs/ecomos/operations/rollback.md`. Restorations execute exclusively against isolated MySQL instances (port 3309) with restricted target credentials, leaving live databases untouched.
3. **Data Protection Invariant**: The dynamic core table guard (`ecomos_sql_targets_core_table`) prevents destruction of core WooCommerce orders, posts, postmeta, options, users, or order items tables during addon migrations and rollbacks.

