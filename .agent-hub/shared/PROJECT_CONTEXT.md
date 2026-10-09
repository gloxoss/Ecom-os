# EcomOS project context

This hub coordinates engineering work on the existing EcomOS repository. It does not become a second commerce engine, merchant back office, or database of customer records. WooCommerce remains the commercial authority.

## Mission and authority

Build a reusable, secure, guest-first headless WordPress/WooCommerce starter. ParaLoca is the first client profile; RFQ/devis is an optional extension. Each client has its own deployment, WordPress installation, database and secrets. Shared SaaS tenancy is outside current scope.

Read the owner handoff in the repository's parent directory: [start](../../../00_START_HERE.md), [master mission](../../../01_MASTER_AGENT_PROMPT.md), [phased plan](../../../02_PHASED_EXECUTION_PLAN.md), [architecture](../../../03_TARGET_ARCHITECTURE_AND_ADDONS.md), and [acceptance](../../../04_REPORTING_AND_ACCEPTANCE.md). Product vision, modular architecture, integration catalog and admin strategy are supporting drafts. Numbered integration/admin copies are identical; use canonical filenames.

Latest explicit owner decisions govern scope and authorization. Current code and fresh verification govern implementation claims. The hub summarizes these sources; it cannot silently override them. Read the original requirement before changing policy or accepting a phase. Historical readiness percentages are not current evidence.

## Repository map

- `apps/storefront`: Next.js App Router buyer experience and server boundary.
- `packages/ecom-engine`: existing domain types and `EcomEngine` interface; preserve and refine its seam.
- `packages/engine-woocommerce`: GraphQL/REST catalog adapter; guest Store API integration still to implement.
- `packages/addons-multi-payment`, `packages/addons-i18n`: existing extension seams, not proof every provider works.
- `packages/themes`, `packages/brand-config`: existing theme and deployment identity configuration.
- `plugins/wp-epioso-*`: existing PHP extensions; activation and permissions require separate proof.
- `angelina-ui`: visual sandbox; rendering here proves no commerce behavior.
- `docs/ecomos`: execution log, reports and sanitized evidence. `.agent-hub` coordinates tasks, ownership and review, not customer operations.

Target folders in architecture documents are proposals. Do not rename packages or replace working abstractions merely to match a diagram. Do not include the preexisting dirty `plugins/wordpress-mcp` submodule in unrelated work.

## Recorded baseline, 2026-10-09

Evidence source: [progress](../../docs/ecomos/PROGRESS.md), [Phase 0 report](../../docs/ecomos/PHASE_0_REPORT.md), [staging setup](../../docs/ecomos/STAGING_SETUP.md). Revalidate this snapshot before reporting new completion.

- Repair branch: `fix/ecomos-phase-0`. Handoff-alignment checkpoint `6541de1`; local backend proof `148e913`. These are historical reference commits, not a permanently asserted HEAD.
- Frozen install, lint, type checking, 74 unit tests and a production build passed at the recorded repair checkpoint. Later staging checks passed `pnpm run verify`; the production build did not prove a live checkout.
- Unsafe customer identity paths, unverified online payments and legacy checkout writes are disabled. Canonical integer-minor money mapping and production configuration checks are implemented.
- Owner-approved local plugins: WordPress 7.1.3, WooCommerce 11.2.1, WPGraphQL 2.23.1, commerce bridge 1.0.3. These are recorded local versions, not a compatibility promise for other clients.
- Real backend fixture retrieval and Store API guest COD smoke passed. Synthetic order 15: guest ID 0; exact variation 14; 202.84 MAD total; one order after a sequential retry. Local Mailpit captured its notification.
- Fixture shipping 25.00 MAD and fixture tax 10% are synthetic. They are not Moroccan merchant policy or advice. The storefront's cart/checkout methods still reject; its confirmation UI is unavailable.
- Phase 0 remains PARTIAL. Browser/CSP/hydration, concurrent checkout retries, Local image processing and one high development dependency advisory remain unresolved. Backup files exist outside the repo; restore has not been rehearsed.
- Catalog arguments still omit real search/category/sort/offset handling; first-20 behavior, incomplete categories/variations and swallowed backend failures remain. CMS/search/admin/RFQ completion is not established.

## Settled client decisions

Core buying and guest RFQ never require customer accounts. Accounts are an optional future addon, disabled by default. Staff authentication and server-side capabilities are mandatory independently.

ParaLoca uses French-first presentation, MAD and Morocco through its profile and backend configuration. Owned brands live within one B2C catalog. Medical metadata/documents and approved claims belong to a configured extension/profile. Do not invent certifications, stock, legal classification or product rights.

Merchant administration is WordPress/WooCommerce plus a small role-scoped EcomOS Operations complement. A parallel Next.js merchant application requires a demonstrated unmet requirement and an explicit architecture decision.

## Safe work boundaries

Local source edits, scoped tests and synthetic staging checks may proceed under the user's task. User approval already covers the three named local plugins, not arbitrary future installations. No production changes, live charges, DNS cutover, paid service commitments or destructive data operations without the applicable explicit approval. Backups and a rollback plan precede consequential staging migrations.

Keep credentials, Cart-Tokens, cookies, payment payloads, private customer/RFQ data and backup contents out of task boards, chat, commits and evidence. Configure secrets locally through the existing ignored environment mechanism. A successful smoke test is not authorization to enable an unfinished feature.
