# Tech Stack Decisions — Ecom OS

Final v1 stack. One row per technology. The "Why this" column answers the only question that matters: why this choice and not the alternative that any senior engineer would otherwise reach for.

---

## Frontend layer

| Concern | Choice | Why this (vs. the obvious alternative) |
|---|---|---|
| Framework | **Next.js 16 (App Router, RSC)** | RSC-first matches `nextjs-app-structure` rules; same stack EPIOSO already ships everywhere; SSR + ISR cover all storefront perf needs without a separate caching layer. |
| Language | **TypeScript strict** | Required for the typed `EcomEngine` contract to mean anything. |
| Styling | **Tailwind CSS v4** | One styling system rule from project guidelines. CSS-first @theme tokens make per-client theming trivial. |
| UI primitives | **shadcn/ui** (local components) | Owned source, not a dependency; easy per-client brand override; works with Tailwind v4. |
| Forms / validation | **Zod + React Hook Form** | Zod schemas shared between server actions and the SRS-mandated input validation (NFR-032). |
| Icons | **Lucide React** | Tree-shakable, MIT, broad coverage. |
| Animation | **GSAP** (where motion is needed) | Already standard in EPIOSO projects; not required for v1 storefront baseline. |

---

## Engine adapter layer

| Concern | Choice | Why this |
|---|---|---|
| Contract location | **`packages/ecom-engine`** (interface only, zero deps) | Lets adapters be developed/tested independently; no engine-specific types leak upward. |
| WC read API | **WPGraphQL** | See **ADR-001**. Single round-trip, typed, ISR-friendly. |
| WC write API | **WooCommerce REST API** | Native to WC; WPGraphQL Pro mutations are licensed; REST is sufficient for order creation. |
| Vendure read+write | **Vendure Shop API (GraphQL)** | Native; built for this exact use case. |
| GraphQL client | **`graphql-request`** | Tiny (~5KB); no Apollo overhead; works fine with RSC `fetch`. |

---

## Backend engines

| Concern | Choice | Why this |
|---|---|---|
| Engine 1 (v1) | **WordPress + WooCommerce (latest stable)** | Where Yasmine-class clients already live; lowest-friction admin. |
| Engine 1 host | **Hostinger Business plan** | See **ADR-005**. EPIOSO operates this every day. |
| Engine 1 customization | **EPIOSO WP plugin (`wp-epioso-i18n`)** | Avoids forking WC core; clean upgrades. |
| Engine 2 (v1, ships second) | **Vendure (fork, plugin-only customization)** | See **ADR-002**. Plugin architecture maps 1:1 onto our addon model. |
| Engine 2 runtime | **Node.js 22 LTS** | Vendure requirement; matches EPIOSO standard. |
| Engine 2 DB | **PostgreSQL 16** | Vendure's primary supported DB; better for relational commerce data than Mongo. |
| Engine 2 queue/cache | **Redis 7** | Required by Vendure for job queues. |
| Engine 2 deploy | **Docker Compose on a small VPS** | Predictable, portable, only spun up per client who chose Vendure. |

---

## Addons

| Addon | Tech | Why this |
|---|---|---|
| i18n | JSON dictionaries + `next-intl` (or built-in i18n routing) | Simpler than a CMS-based approach; admin editor writes to JSON via a small WP/Vendure plugin endpoint. |
| Multi-payment | TypeScript interface `PaymentGateway` + provider modules | Adapter pattern keeps providers swappable per deployment. |
| CMI provider | Hand-rolled HTTPS form post + HMAC verification | No official Node SDK exists; the protocol is small and stable. |
| Stripe provider | `stripe` official Node SDK | First-party, well-maintained, idempotency-key support built-in. |
| COD provider | In-house code | No external dependency. |

---

## Infrastructure & ops

| Concern | Choice | Why this |
|---|---|---|
| Monorepo tool | **pnpm workspaces** | Standard in EPIOSO projects; cheap; no Turborepo lock-in. |
| CI | **GitHub Actions** | Free for private repos at EPIOSO's scale; plugs into existing workflow. |
| Deploy (WC engine) | **`pnpm deploy:hostinger`** — SSH + rsync + PM2 reload | Matches `epioso-hosting` skill; no new ops surface. |
| Deploy (Vendure engine) | **Docker Compose pull + restart on VPS** | Standard pattern; rollback by re-pulling previous image. |
| Secrets | **`.env` files server-side; never committed** | NFR-031. |
| Logs | **PM2 logs + stdout** | No external observability service in v1 (NFR/cost discipline). |
| Error tracking | **Sentry free tier** (optional per deployment) | Cheap insurance; only enabled where the client wants it. |

---

## Quality tooling

| Concern | Choice | Why this |
|---|---|---|
| Lint | ESLint v9 flat config + `eslint-config-next` | Standard in `nextjs-app-structure` skill. |
| Formatter | Prettier + Tailwind plugin | Consistency, no debate. |
| Test runner | **Vitest** for adapters/addons; **Playwright** for one happy-path E2E per engine | Vitest is faster than Jest and TypeScript-native; Playwright is the only realistic way to verify a checkout flow end-to-end. |
| Coverage threshold | ≥ 70% lines on addon and adapter packages (NFR-041) | Pragmatic floor; storefront UI isn't unit-tested. |
| SAST | Semgrep (free tier) | Catches OWASP basics. |
| Secret scanning | Gitleaks pre-commit | Cheap safety net. |

---

## Explicitly rejected

| Rejected | In favor of | Why |
|---|---|---|
| Medusa.js | Vendure | Less architectural rigor for the B2B/multi-channel use cases Karim represents. |
| Saleor | Vendure | Python stack would force a second language into EPIOSO's ops. |
| Next.js Commerce 2.0 | Custom universal frontend | Shopify-only since v2; not a starter for our engines. |
| Shopify Hydrogen | Custom universal frontend | Vendor lock-in to Shopify; defeats the point of Ecom OS. |
| Apollo Client | `graphql-request` | Overhead unjustified for our query volume. |
| MongoDB for Vendure | PostgreSQL | Vendure is built for relational data; Mongo support is community/unofficial. |
| Turborepo | pnpm workspaces alone | Cache complexity unjustified at v1 scale. |
| Yarn / npm | pnpm | Faster, smaller, deterministic; EPIOSO standard. |
| Nginx in front of Next.js on Hostinger | Hostinger's bundled Apache + Node app slot | Avoids fighting shared-hosting limits; works out of the box. |
