# Pre-Dev Progress — Ecom OS

**Project:** Ecom OS — EPIOSO's modular dual-engine e-commerce starter kit
**Started:** 2026-06-23
**Last updated:** 2026-06-24
**Current phase:** ✅ Pre-dev complete · 🟡 Build started — Sprint A

---

## Build progress (28 steps — see `07-blueprint.md`)

### Sprint A — Foundation (Weeks 1–4)
- [x] **Step 1** — Initialize the monorepo · 2026-06-23
- [ ] Step 2 — Scaffold `apps/storefront` (Next.js 16)
- [ ] Step 3 — Define `EcomEngine` interface
- [ ] Step 4 — Build `WooCommerceEngine` adapter
- [ ] Step 5 — Brand config + theme tokens
- [ ] Step 6 — Addon loader + flag generation
- [ ] Step 7 — `create-ecom-os` CLI
- [ ] Step 8 — Storefront baseline screens (S-01, S-10, S-11, S-12, S-20)
- [ ] Step 9 — Test harness baseline

🎯 Milestone M1 (end of Week 2): repo + storefront baseline online
🎯 Milestone M3 (end of Week 4): real WC data on storefront + Lighthouse ≥ 90

### Sprint B — WC engine v1 + i18n (Weeks 5–8)
- [ ] Steps 10–15 + Gate A

### Sprint C — Multi-payment + ship (Weeks 9–12)
- [ ] Steps 16–22 + Gate B

### Sprint D — Vendure engine (Weeks 13–16)
- [ ] Steps 23–28 + v1 release

---

## Pre-dev pack (read-only spec)

| Phase | Status | Files |
|-------|--------|-------|
| 0 — Project Charter | ✅ Complete | 00-project-charter.md |
| 1 — Discovery & Research | ✅ Complete | 01-market-opportunity.md, 01-competitive-analysis.md, 01-user-personas.md, 01-business-case.md |
| 2 — Product Requirements | ✅ Complete | 02-PRD.md, 02-SRS.md, 02-user-stories.md |
| 3 — System Architecture | ✅ Complete | 03-architecture-overview.md, 03-tech-stack-decisions.md, 03-C4-diagrams.md, 03-ADRs/ADR-001..008 |
| 4 — UX & IA | ✅ Complete | 04-information-architecture.md, 04-user-journey-maps.md, 04-screen-inventory.md |
| 5 — Data & API | ✅ Complete | 05-ERD.md, 05-database-schema.md, 05-data-flow.md, 05-api-contracts/openapi.yaml |
| 6 — Security & Compliance | ✅ Complete | 06-threat-model.md, 06-security-requirements.md, 06-privacy-compliance.md |
| 7 — Execution Blueprint | ✅ Complete | 07-blueprint.md, 07-milestones.md, 07-risk-register.md, 07-definition-of-done.md |
| 8 — Client Package | ✅ Complete | 08-executive-summary.md, 08-project-proposal.md, 08-statement-of-work.md, 08-sign-off-checklist.md |

## Decisions locked

- **Engine priority:** Headless WooCommerce first, custom Vendure-based engine second.
- **Open-source seed:** Fork Vendure for the custom engine; lean Next.js storefront template for the WC engine.
- **v1 addons:** i18n + multi-payment. Multi-branch routing → v1.1.
- **Timeline:** 8wk WC engine, +8wk custom engine. Part-time.
- **Pilot client:** TBD (generic-first build).
- **Co-hosting (ADR-008 · 2026-06-24):** Next.js storefront co-hosted on the same Hostinger account as WordPress. Two modes controlled by `ECOM_DEPLOY_MODE`: **Mode A** (default) = Node.js/PM2 on Hostinger Business+ — full SSR, Server Actions, ISR; **Mode B** = `next export` static HTML on PHP-only plans — products SSG at build time, checkout via client-side WC REST, ~5 min rebuild lag via CI webhook. One env var, no code fork. Domain routing: `yourdomain.com` → storefront, `cms.yourdomain.com` → WordPress.

## Open from Phase 0

- Q1 Vendure GPL v3 implications
- Q2 First pilot client
- Q3 White-label v1 vs v1.1
- Q4 REST vs WPGraphQL for WC adapter → ✅ Closed — ADR-001 decided WPGraphQL for reads, REST for writes.
- Q5 Vendure admin vs custom admin
