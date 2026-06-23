# Ecom OS

> EPIOSO's modular dual-engine e-commerce starter kit. Universal Next.js 16 storefront + interchangeable backends (WooCommerce or Vendure) + plug-and-play addons.

[![status](https://img.shields.io/badge/status-Sprint%20A%20%C2%B7%20Step%201-orange)]()
[![node](https://img.shields.io/badge/node-%E2%89%A522-brightgreen)]()
[![pnpm](https://img.shields.io/badge/pnpm-%E2%89%A59-orange)]()

---

## What it is

A pre-built e-commerce platform EPIOSO deploys per client. Same Next.js 16 storefront on top, two interchangeable backend engines underneath:

- **Engine 1 — Headless WooCommerce** (PHP + MySQL on Hostinger) for SMB-class clients
- **Engine 2 — Vendure** (NestJS + PostgreSQL + Redis on VPS) for mid-market / scale

Turns a new e-commerce client engagement from 8–12 weeks down to 2–3.

## Repo layout

```
ecom-os/
├── apps/                       # Deployable applications (storefront, vendure)
├── packages/                   # Shared packages (ecom-engine, engine-*, addons-*, ui, brand-config)
├── plugins/                    # WP companion plugins + Vendure plugins
├── scripts/                    # CLIs (create-ecom-os, deploy-hostinger, etc.)
├── docs/                       # Setup, addon authoring, deploy runbook
├── pre-dev/                    # Full pre-development pack (charter → blueprint, read-only spec)
├── CAHIER-DE-CHARGES.md        # Dev handbook (single-tab reference)
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## Quickstart (current state — Sprint A · Step 1)

```bash
git clone https://github.com/gloxoss/Ecom-os.git
cd Ecom-os
pnpm install
```

> Storefront and engine packages will land in Step 2 onwards. Track progress in `pre-dev/PROGRESS.md`.

## Documentation

| Read first | Purpose |
|---|---|
| [CAHIER-DE-CHARGES.md](./CAHIER-DE-CHARGES.md) | Dev handbook: stack, structure, env, workflow, code rules, sprint plan |
| [pre-dev/PROGRESS.md](./pre-dev/PROGRESS.md) | Current phase + completed steps |
| [pre-dev/07-blueprint.md](./pre-dev/07-blueprint.md) | 28 atomic build steps (the execution plan) |
| [pre-dev/07-definition-of-done.md](./pre-dev/07-definition-of-done.md) | What "done" means per step / milestone / release |
| [pre-dev/03-ADRs/](./pre-dev/03-ADRs/) | 7 architecture decisions — read before touching architecture |

The full pre-dev pack (charter, market/competitive analysis, PRD, SRS, architecture, UX, data, security, execution, client templates) lives in [`pre-dev/`](./pre-dev/).

## Tech stack (pinned)

Node 22 LTS · pnpm workspaces · TypeScript strict · Next.js 16 (App Router, RSC) · Tailwind CSS v4 · shadcn/ui · Vitest + Playwright · ESLint v9 · WordPress + WooCommerce + WPGraphQL (engine 1) · Vendure + PostgreSQL + Redis (engine 2, plugin-only customization)

Full rationale: [`pre-dev/03-tech-stack-decisions.md`](./pre-dev/03-tech-stack-decisions.md)

## Project status

| Sprint | Weeks | State |
|---|---|---|
| A — Foundation | 1–4 | 🟡 in progress (Step 1 ✅) |
| B — WC engine v1 + i18n | 5–8 | ⏳ pending · **Gate A** |
| C — Multi-payment + ship | 9–12 | ⏳ pending · **Gate B** |
| D — Vendure engine | 13–16 | ⏳ pending |

## License

Proprietary — © 2026 **EPIOSO** (Oussama Zaki). All rights reserved. See [`pre-dev/08-statement-of-work.md`](./pre-dev/08-statement-of-work.md) §5 for IP terms applied to client deployments.

## Contact

**EPIOSO** · Casablanca, Morocco
contact@epioso.com · [epioso.com](https://epioso.com)
