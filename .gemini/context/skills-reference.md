# Ecom OS — Skills Reference

> Complete mapping of workspace skills to project domains and blueprint steps.

---

## How to Use Skills

When working on a specific area, load the relevant skills before starting. Skills provide specialized knowledge, patterns, and constraints that prevent common mistakes.

---

## Skills by Domain

### 🏗️ Monorepo & Architecture
| Skill | When to Use |
|-------|------------|
| `nextjs-app-structure` | Scaffolding routes, feature folders, layout decisions |
| `architecture` | Evaluating trade-offs, making ADR decisions |
| `architecture-patterns` | Implementing Clean Architecture, adapter pattern |
| `software-architecture` | Code quality, system design |
| `api-design-principles` | Designing the EcomEngine interface |
| `blueprint` | Step-by-step execution planning |
| `karpathy-guidelines` | Avoiding overcomplication, making surgical changes |

### 🎨 Frontend & UI
| Skill | When to Use |
|-------|------------|
| `next-best-practices` | RSC boundaries, async APIs, hydration errors |
| `nextjs-seo` | Metadata, sitemaps, JSON-LD, robots.txt |
| `nextjs-shadcn` | Building UI components with shadcn/ui |
| `tailwind-design-system` | Design tokens, component library |
| `tailwind-patterns` | Tailwind v4, container queries, RTL |
| `frontend-design` | Premium visual design, avoiding generic aesthetics |
| `gsap-react` | React animations with useGSAP hook |
| `gsap-scrolltrigger` | Scroll-linked animations, pinning |
| `gsap-performance` | 60fps optimization, will-change |

### 🔌 WooCommerce
| Skill | When to Use |
|-------|------------|
| `woocommerce` | WC adapter, REST API, product handling |
| `wordpress` | PHP plugins, WP coding standards |

### 💳 Payment & Security
| Skill | When to Use |
|-------|------------|
| `api-security-best-practices` | Webhook verification, auth, rate limiting |
| `insecure-defaults` | Auditing for fail-open patterns |
| `owasp-top-10` | Common vulnerability remediation |
| `threat-modeling-expert` | STRIDE methodology |
| `stride-analysis-patterns` | Systematic threat identification |
| `privacy-by-design` | Data minimization, consent, GDPR |

### 🧪 Testing
| Skill | When to Use |
|-------|------------|
| `webapp-testing` | Playwright E2E, screenshots, verification |

### 🚀 CI/CD & Deployment
| Skill | When to Use |
|-------|------------|
| `devops-cicd` | CI pipelines, deployment strategies |
| `github-workflow-automation` | GitHub Actions setup |
| `github-automation` | Repo management, PR automation |
| `gloxoss-cloud-manager` | SSH, Docker, PM2, Nginx on remote servers |

### 📝 Documentation
| Skill | When to Use |
|-------|------------|
| `api-documentation` | API docs, developer guides |
| `documentation-templates` | README, guides, code comments |
| `openapi-spec-generation` | OpenAPI 3.1 specs from code |
| `epioso-agency` | Client proposals, SOW, pricing |

### 🗃️ Database
| Skill | When to Use |
|-------|------------|
| `database-design` | Schema design, indexing |
| `supabase-postgres-best-practices` | PostgreSQL optimization |

---

## Blueprint Step → Skills Quick Lookup

| Step | Skills |
|------|--------|
| 1 Init monorepo | `nextjs-app-structure` |
| 2 Scaffold storefront | `nextjs-app-structure`, `tailwind-patterns` |
| 3 EcomEngine interface | `api-design-principles`, `architecture` |
| 4 WC adapter | `woocommerce`, `wordpress` |
| 5 Brand config | `tailwind-design-system`, `nextjs-shadcn` |
| 6 Addon loader | `nextjs-app-structure` |
| 7 create-ecom-os CLI | `blueprint` |
| 8 Storefront screens | `frontend-design`, `gsap-react`, `nextjs-seo` |
| 9 Test harness | `webapp-testing` |
| 10 Checkout screens | `next-best-practices`, `nextjs-shadcn` |
| 11 Account screens | `next-best-practices`, `woocommerce` |
| 12 i18n addon | `nextjs-app-structure`, `tailwind-patterns` |
| 13 i18n WP plugin | `wordpress`, `woocommerce` |
| 14 RTL polish | `tailwind-patterns` |
| 15 Staging deploy | `gloxoss-cloud-manager`, `devops-cicd` |
| 16 Payment scaffold | `api-design-principles` |
| 17 COD provider | `woocommerce` |
| 18 Stripe provider | `api-security-best-practices` |
| 19 CMI provider | `api-security-best-practices`, `owasp-top-10` |
| 20 Security hardening | `insecure-defaults`, `stride-analysis-patterns`, `threat-modeling-expert` |
| 21 Documentation | `api-documentation`, `documentation-templates`, `openapi-spec-generation` |
| 22 First client deploy | `gloxoss-cloud-manager`, `epioso-agency` |
| 23 Vendure scaffold | `architecture-patterns`, `database-design`, `devops-cicd` |
| 24 Vendure adapter | `api-design-principles`, `architecture-patterns` |
| 25 Vendure i18n plugin | `architecture-patterns` |
| 26 Vendure payment plugin | `architecture-patterns` |
| 27 Vendure deploy | `gloxoss-cloud-manager`, `devops-cicd` |
| 28 v1 release | `documentation-templates`, `epioso-agency` |

---

## Skills to Search & Install (Gaps)

These are not yet installed. Search on [skills.sh](https://skills.sh/) when needed:

```bash
# Before Sprint B (Step 12)
npx skills find next-intl i18n

# Before Sprint C (Steps 16-19)
npx skills find stripe payment
npx skills find react-hook-form

# Before Sprint D (Step 23)
npx skills find docker compose

# For testing (Step 9)
npx skills find playwright e2e
```
