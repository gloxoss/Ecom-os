# Ecom OS — Codebase Guide

> Deep-dive reference for developers working on this monorepo. Read this once before touching any code.

---

## Table of Contents

1. [Mental Model](#1-mental-model)
2. [Directory Tree](#2-directory-tree)
3. [Package: `@ecom-os/engine`](#3-package-ecom-osengine)
4. [Package: `@ecom-os/engine-woocommerce`](#4-package-ecom-osengine-woocommerce)
5. [Package: `@ecom-os/brand-config`](#5-package-ecom-osbrand-config)
6. [Package: `@ecom-os/cli`](#6-package-ecom-oscli)
7. [App: `apps/storefront`](#7-app-appsstorefront)
8. [Plugins & Addon System](#8-plugins--addon-system)
9. [Scripts](#9-scripts)
10. [Environment Variables](#10-environment-variables)
11. [Development Workflows](#11-development-workflows)
12. [Architecture Rules (Non-Negotiable)](#12-architecture-rules-non-negotiable)

---

## 1. Mental Model

Ecom OS is a **headless e-commerce kit**. The idea: one Next.js storefront on top, swappable backend underneath.

```
┌─────────────────────────────────────┐
│         Next.js 16 Storefront        │  ← one UI, works for all clients
│   apps/storefront/src/              │
└──────────────┬──────────────────────┘
               │ getEngine()           ← single gateway, never imports engine directly
               ▼
┌──────────────────────────────────────┐
│       EcomEngine interface           │  ← the contract (packages/ecom-engine)
│   listProducts · getProduct          │
│   getCart · addToCart · initCheckout │
│   placeOrder · listCustomerOrders …  │
└──────┬───────────────────┬───────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ WooCommerce │     │  FakeEngine │  ← for local dev without a WC instance
│  Engine     │     │  (built-in) │
│ (packages/  │     └─────────────┘
│  engine-wc) │
└─────────────┘
       ▲
       │  GraphQL (reads) + REST (writes)
       ▼
  WordPress + WooCommerce + WPGraphQL
```

**Key invariant:** The storefront never imports `WooCommerceEngine` or any adapter directly.
It only ever calls `getEngine()` from `apps/storefront/src/lib/engine.ts`. This is enforced by `scripts/check-engine-imports.sh` which runs on every `pnpm verify`.

---

## 2. Directory Tree

```
ecom-os/
│
├── apps/
│   └── storefront/                   ← The Next.js 16 frontend (the only deployed UI)
│       ├── brand.config.ts           ← CLIENT CONFIG: change this to rebrand
│       ├── next.config.ts            ← Next.js config (dual-mode: Node / static export)
│       ├── .env.local                ← Local secrets (never committed)
│       └── src/
│           ├── app/                  ← Next.js App Router (pages live here)
│           │   ├── layout.tsx        ← Root HTML shell: <html>, <body>, font classes
│           │   ├── globals.css       ← Tailwind v4 entry point + brand token import
│           │   ├── (shop)/           ← Route group: public shop pages
│           │   │   ├── page.tsx      ← / (Home)
│           │   │   ├── catalog/      ← /catalog
│           │   │   └── product/[slug]/ ← /product/:slug (PDP)
│           │   ├── (checkout)/       ← Route group: checkout flow
│           │   │   └── checkout/     ← /checkout + /checkout/success
│           │   ├── (auth)/           ← Route group: auth pages
│           │   │   └── login/        ← /login (stub)
│           │   └── (account)/        ← Route group: customer account
│           │       └── account/      ← /account (stub)
│           │
│           ├── lib/
│           │   └── engine.ts         ← THE ENGINE GATEWAY (only file allowed to import adapters)
│           │
│           ├── features/             ← Feature-first UI code
│           │   ├── landing/ui/       ← Hero section (server wrapper + client GSAP island)
│           │   ├── catalog/ui/       ← ProductGrid + ProductCard
│           │   └── cart/ui/          ← AddToCart button (client component)
│           │
│           ├── stores/
│           │   └── cart-store.ts     ← Zustand cart (client-side, persisted to localStorage)
│           │
│           ├── components/shared/
│           │   └── ClientOnly.tsx    ← Prevents Zustand hydration mismatch
│           │
│           ├── styles/
│           │   └── brand.tokens.css  ← AUTO-GENERATED (do not edit by hand)
│           │
│           └── addons.generated.ts   ← AUTO-GENERATED (do not edit by hand)
│
├── packages/
│   ├── ecom-engine/                  ← Type-only contract (no runtime deps)
│   │   └── src/
│   │       ├── types.ts              ← All domain types: Money, Product, Cart, Order …
│   │       ├── interface.ts          ← EcomEngine interface (the contract)
│   │       ├── factory.ts            ← get/setEngine() singleton
│   │       ├── fake-engine.ts        ← FakeEngine: zero-dep stub for local dev
│   │       ├── addons.ts             ← AddonContext + EcomAddon interfaces
│   │       └── index.ts              ← Re-exports everything
│   │
│   ├── engine-woocommerce/           ← WooCommerce adapter (implements EcomEngine)
│   │   └── src/
│   │       ├── client.ts             ← WooCommerceEngine class
│   │       ├── products.ts           ← GraphQL queries: listProducts, getProduct, listCategories
│   │       ├── orders.ts             ← REST: createOrder
│   │       ├── auth.ts               ← REST: register, login (partial), getCustomerOrders
│   │       ├── graphql.ts            ← graphql-request client (reads WC_GRAPHQL_URL)
│   │       ├── rest.ts               ← fetch-based REST client (reads WC_REST_*)
│   │       └── mappers.ts            ← WC schema → EcomEngine types conversion
│   │
│   ├── brand-config/                 ← Brand schema + CSS token generator
│   │   ├── index.ts                  ← Re-exports schema + generateTokensCSS
│   │   └── src/
│   │       ├── schema.ts             ← Zod schema: validates brand.config.ts
│   │       └── tokens.ts             ← generateTokensCSS(): config → CSS @theme string
│   │
│   └── cli/                          ← create-ecom-os scaffold tool
│       └── src/index.ts              ← Interactive CLI: prompts name/engine/addons → copies storefront
│
├── plugins/                          ← Addon packages (opt-in features)
│   ├── dummy-addon/                  ← Proof-of-concept addon structure
│   ├── cod-payment/                  ← Cash on Delivery (stub — Section 06)
│   ├── stripe-payment/               ← Stripe (stub — Section 09)
│   └── wordpress-mcp/               ← MCP server for WordPress AI tooling
│
├── scripts/
│   ├── generate-tokens.ts            ← Reads brand.config.ts → writes brand.tokens.css
│   ├── generate-addons.ts            ← Reads ADDONS env → writes addons.generated.ts
│   ├── check-engine-imports.sh       ← CI guard: no direct engine imports in storefront
│   └── seed-woocommerce.ts           ← (WIP) Populates WC sandbox with test data
│
├── pre-dev/                          ← Read-only spec (charter → blueprint — do not modify)
│   ├── PROGRESS.md                   ← Current build step + decisions log
│   ├── 07-blueprint.md               ← 28-step execution plan
│   └── 03-ADRs/                      ← 8 architecture decisions (read before changing arch)
│
├── .ultraplan/                       ← AI execution plan (10 sections, 48 tasks)
│   └── sections/                     ← One file per section with tasks + acceptance criteria
│
├── package.json                      ← Root workspace: scripts, engines, packageManager
├── pnpm-workspace.yaml               ← Workspace members: apps/*, packages/*, plugins/*
├── tsconfig.base.json                ← Strict TS base all packages extend
└── CAHIER-DE-CHARGES.md              ← Developer handbook (code rules, sprint plan, workflow)
```

---

## 3. Package: `@ecom-os/engine`

**Location:** `packages/ecom-engine/`
**Purpose:** Defines the contract every engine adapter must implement. Contains zero runtime logic — it is types + interface only.

### Files

#### `src/types.ts` — Domain types

Every data shape used across the entire codebase lives here.

```
Money          { amount_minor: number, currency: string }
               ↑ prices are always in minor units (cents). $19.99 = { amount_minor: 1999, currency: 'USD' }

Product        { id, slug, name, description, price: Money, images[], categories[], variants? }
Category       { id, slug, name }
CartItem       { id, productId, variantId?, quantity, price: Money }
Cart           { id, items: CartItem[], subtotal: Money, total: Money }
Customer       { id, email, firstName, lastName }
OrderLine      { id, productId, quantity, price: Money, name }
Order          { id, status, total: Money, items: OrderLine[], customer: Customer }
CheckoutSession { cartId, status: 'PENDING' | 'COMPLETED' }
PaymentRef     { provider, transactionId, status }

ProductListQuery  { category?, search?, limit?, offset? }   ← input for listing products
ProductListResult { items: Product[], total: number }        ← output
AddToCartInput    { productId, quantity, variantId? }        ← input for cart operations
CheckoutInput     { email, firstName, lastName, address, paymentMethod } ← checkout form data
```

**Rule:** If you need a price anywhere in the codebase, use `Money`. Never pass raw `number` prices. Display with `(price.amount_minor / 100).toFixed(2)`.

#### `src/interface.ts` — EcomEngine contract

```typescript
interface EcomEngine {
  listProducts(query: ProductListQuery): Promise<ProductListResult>
  getProduct(slug: string, locale?: Locale): Promise<Product | null>
  listCategories(locale?: Locale): Promise<Category[]>
  getCart(cartId: string): Promise<Cart>
  addToCart(cartId: string, input: AddToCartInput): Promise<Cart>
  initCheckout(cartId: string, input: CheckoutInput): Promise<CheckoutSession>
  placeOrder(session: CheckoutSession): Promise<Order>
  markOrderPaid(orderId: string, paymentRef: PaymentRef): Promise<void>
  getOrder(orderId: string, customerId: string): Promise<Order | null>
  listCustomerOrders(customerId: string): Promise<Order[]>
}
```

Any new backend (Vendure, Shopify, Fake) must implement all 10 methods. TypeScript enforces this.

#### `src/factory.ts` — Singleton registry

```typescript
setEngine(engine: EcomEngine)  // called once at startup by lib/engine.ts
getEngine(): EcomEngine | null // returns the registered instance
```

The storefront never calls `setEngine()` directly — `lib/engine.ts` handles it.

#### `src/fake-engine.ts` — FakeEngine

Used when `ECOM_ENGINE=fake` (or unset). Returns empty arrays and zero-value structs. Lets the storefront boot without a WooCommerce instance — useful for UI development.

---

## 4. Package: `@ecom-os/engine-woocommerce`

**Location:** `packages/engine-woocommerce/`
**Purpose:** Implements `EcomEngine` against a WordPress + WooCommerce + WPGraphQL backend.

### How it connects to WordPress

```
Reads  →  WPGraphQL endpoint  (WC_GRAPHQL_URL)  using graphql-request
Writes →  WooCommerce REST API (WC_REST_URL)      using fetch + Basic auth (key:secret)
```

### Files

#### `src/graphql.ts` — GraphQL client
Reads `WC_GRAPHQL_URL` from env and creates a `graphql-request` client. All `fetchProducts`, `fetchCategories`, `fetchProductBySlug` calls go through here.

#### `src/rest.ts` — REST client
Reads `WC_REST_URL`, `WC_REST_KEY`, `WC_REST_SECRET` from env. Creates the `Authorization: Basic base64(key:secret)` header. All order and auth calls go through here.

#### `src/products.ts` — GraphQL queries
Three exported functions:
- `fetchProducts(category?)` — GetProducts query, returns raw WC nodes
- `fetchCategories()` — GetCategories query
- `fetchProductBySlug(slug)` — GetProduct query by slug

All three catch errors and return `[]` / `null` on failure (network-safe).

#### `src/mappers.ts` — Shape conversion
Converts raw WC GraphQL output into `EcomEngine` types:
- `mapProduct(raw: WCProduct): Product` — normalises `databaseId` to `id`, parses price string to `Money` minor units, maps `image` to `images[]`
- `mapCategory(raw: WCCategory): Category`

#### `src/client.ts` — WooCommerceEngine class
Implements all 10 `EcomEngine` methods. Currently:
- ✅ `listProducts`, `getProduct`, `listCategories` — fully implemented via GraphQL
- ✅ `listCustomerOrders` — REST call
- ❌ `getCart`, `addToCart`, `initCheckout`, `placeOrder`, `markOrderPaid`, `getOrder` — throw `Not implemented` (Section 06/07 work)

#### What's NOT implemented yet (Section 06+)
- Cart methods: WooCommerce Sessions API or WPGraphQL Cart (requires WPGraphQL WooCommerce plugin)
- Auth: JWT login via WPGraphQL JWT Authentication plugin
- `getCustomer`: REST /customers/{id}

---

## 5. Package: `@ecom-os/brand-config`

**Location:** `packages/brand-config/`
**Purpose:** Define a store's brand in one TypeScript file and have it automatically applied to the entire storefront.

### How it works

```
apps/storefront/brand.config.ts
        ↓ (read by)
scripts/generate-tokens.ts
        ↓ (validates with Zod, then calls)
generateTokensCSS(config)
        ↓ (writes)
apps/storefront/src/styles/brand.tokens.css
        ↓ (imported by)
apps/storefront/src/app/globals.css
        ↓ (consumed by)
Tailwind v4 utility classes (bg-primary, text-secondary, font-sans, rounded-md …)
```

This pipeline runs automatically on every `pnpm dev` and `pnpm build` via `predev`/`prebuild` hooks.

### `brand.config.ts` — What you edit per client

```typescript
export const brandConfig: BrandConfig = {
  name: 'Client Store Name',
  logos: { light: '/logo-light.svg', dark: '/logo-dark.svg' },
  colors: {
    primary:    '#000000',  // buttons, links, CTAs
    secondary:  '#666666',  // prices, secondary text
    accent:     '#3b82f6',  // highlights, badges
    background: '#ffffff',  // page background
    foreground: '#111111',  // body text
    muted:      '#f3f4f6',  // subtle backgrounds, disabled states
  },
  fonts: {
    sans: 'Inter',          // body font (must be loaded via CSS/Google Fonts separately)
    mono: 'monospace',      // code blocks
  },
  radii: { sm: '4px', md: '8px', lg: '12px' },
  hero: {
    headline: 'Your Tagline',
    subheadline: 'Supporting text.',
    ctaLabel: 'Shop Now',
    ctaHref: '/catalog',
    image: '/hero-banner.jpg',
  },
  contact: { email: '…', phone: '…', address: '…' },
  social: { instagram: 'https://…', facebook: 'https://…' },
};
```

### `src/schema.ts` — Zod validation

If `brand.config.ts` has an invalid hex color or missing required field, `generate-tokens.ts` fails with a clear error message before any CSS is written. Prevents silent misconfigurations.

### `src/tokens.ts` — CSS generator

`generateTokensCSS(config)` produces a `brand.tokens.css` with two blocks:

1. `:root` — defines `--brand-*` custom properties with actual values from `brand.config.ts`
2. `@theme` — maps Tailwind's design tokens (`--color-primary`, `--font-sans`, `--radius-sm`) to the `--brand-*` vars

This two-level design means you can override a single `--brand-primary` at runtime in CSS without re-running the generator (useful for dark mode or client-specific overrides).

### To rebrand a client deployment

1. Edit `apps/storefront/brand.config.ts`
2. Run `pnpm dev` or `pnpm build` — tokens regenerate automatically
3. Deploy

Total time: under 15 minutes for a full visual rebrand.

---

## 6. Package: `@ecom-os/cli`

**Location:** `packages/cli/`
**Purpose:** `create-ecom-os` — interactive scaffold tool that copies the storefront template for a new client deployment.

### Usage

```bash
npx create-ecom-os
# or
pnpm --filter cli start
```

Prompts for:
1. Project name
2. Engine choice (`woocommerce` / `vendure`)
3. Addons to enable (comma-separated: `cod,i18n,stripe`)

Then:
- Copies `apps/storefront/` to a new directory named after the project
- Updates `package.json` name
- Writes `.env.local` with `ECOM_ENGINE=` and `ADDONS=` prefilled

**Status:** Basic version working. Validation and error handling are minimal (Section 04 hardens this).

---

## 7. App: `apps/storefront`

**Location:** `apps/storefront/`
**Tech:** Next.js 16 · App Router · React 19 · Tailwind v4 · Zustand · GSAP

### Route Groups

Next.js route groups (`(name)`) let you share layouts without affecting the URL path. We use them to separate concerns:

```
(shop)      → public shopping pages (/ , /catalog, /product/[slug])
(checkout)  → checkout flow (/checkout, /checkout/success)
(auth)      → authentication (/login)
(account)   → customer account (/account)
```

Each group can have its own `layout.tsx` in the future (e.g. checkout layout with no header, account layout with sidebar). Currently they share the root layout.

### `src/lib/engine.ts` — The Engine Gateway

**The most important file in the storefront.** Every page that needs data calls this.

```typescript
import { getEngine } from '@/lib/engine';

// In any server component:
const engine = await getEngine();
const products = await engine.listProducts({ limit: 20 });
```

What it does internally:
1. Checks if an engine instance is already registered (singleton)
2. If not, reads `ECOM_ENGINE` env var
3. Dynamically imports the correct adapter (`WooCommerceEngine` or `FakeEngine`)
4. Registers it via `setEngine()` and returns it

**Rule:** This is the ONLY file in `apps/storefront/` allowed to import from `@ecom-os/engine-woocommerce` or any other adapter package. All pages/components must go through `@/lib/engine`. Enforced by `scripts/check-engine-imports.sh`.

### Server Components vs Client Islands

Architecture rule: default to Server Components. Only add `'use client'` when you need browser APIs or React hooks.

```
Page (server) → fetches data from engine → passes to components
Component (server) → renders markup, no interactivity
Component (client) → has 'use client', uses hooks/GSAP/browser APIs
```

Current pattern in the codebase:

```
HeroSection (server)     → passes static props to →  HeroClient (client, GSAP animations)
ProductGrid (server)     → maps products to       →  ProductCard (server, Next.js Image + Link)
ProductPage (server)     → fetches product, then  →  AddToCart (client, uses useCartStore)
CheckoutPage (server)    → has server action       →  <form> (server, no client JS needed)
```

### `src/stores/cart-store.ts` — Zustand Cart

Client-side cart state, persisted to `localStorage` under the key `cart-storage`.

```typescript
// What it stores
items: CartItem[]           // CartItem = Product + quantity

// Actions
addItem(product)            // increments quantity if exists, adds new if not
removeItem(productId)       // removes by id
clearCart()                 // empties cart
getCartTotal()              // sum of (price.amount_minor * quantity) in minor units
```

**Important:** This cart is independent of the engine's `Cart` type. It does not call `engine.getCart()` or `engine.addToCart()`. The cart only syncs to the backend at checkout time via `engine.initCheckout()` and `engine.placeOrder()`. This is a known gap — Section 06 wires the cart data into the checkout flow.

### Current Pages

#### `(shop)/page.tsx` — Home (`/`)
Server component. Calls `engine.listProducts({ limit: 20 })`. Renders `<HeroSection>` + `<ProductGrid>`.

#### `(shop)/catalog/page.tsx` — Catalog (`/catalog`)
Server component. Reads `searchParams.category` → calls `engine.listProducts({ category })`. Renders `<ProductGrid>`.

#### `(shop)/product/[slug]/page.tsx` — PDP (`/product/:slug`)
Server component. Calls `engine.getProduct(slug)`. Renders product image (Next.js `<Image>`), name, price, description, and `<AddToCart>` button.

Price display pattern: `(product.price.amount_minor / 100).toFixed(2)`

#### `(checkout)/checkout/page.tsx` — Checkout (`/checkout`)
Server component with a Server Action (`'use server'` inside the component). On form submit:
1. Calls `engine.initCheckout('cart_dummy', formData)` → `CheckoutSession`
2. Calls `engine.placeOrder(session)` → `Order`
3. Redirects to `/checkout/success`

**Known gap:** Uses `'cart_dummy'` as cartId — doesn't read from Zustand store. Section 06 fixes this.

### `src/features/` — Feature Folders

Each feature has: `ui/` (components), optionally `hooks/`, `lib/`, `data/`.

```
features/landing/ui/
  hero-section.tsx    ← Server component wrapper: sets up markup, passes static props
  hero-client.tsx     ← Client component: GSAP scroll animations run here

features/catalog/ui/
  product-grid.tsx    ← Server: maps Product[] → ProductCard grid layout
  product-card.tsx    ← Server: single card with Image + Link + price

features/cart/ui/
  add-to-cart.tsx     ← Client ('use client'): useCartStore().addItem()
```

### `src/app/globals.css` — Styling Entry Point

```css
@import "tailwindcss";                    /* Tailwind v4 base */
@import "../styles/brand.tokens.css";     /* AUTO-GENERATED: brand colors/fonts/radii */
```

That's it. All styling comes from Tailwind utilities. The brand tokens are auto-injected.

To use brand colors in components: `bg-primary`, `text-secondary`, `text-accent`, `bg-muted`, `font-sans`, `rounded-md`, etc.

---

## 8. Plugins & Addon System

**Location:** `plugins/`

Addons are optional features that can be enabled per deployment via the `ADDONS` environment variable.

### How addons are enabled

1. Set `ADDONS=cod,stripe` in `.env.local`
2. Run `pnpm dev` — the `predev` hook calls `scripts/generate-addons.ts`
3. The script scans `plugins/*/` for packages with matching flags in their `package.json` (`"ecom-os": { "addon": { "flag": "cod" } }`)
4. Writes `apps/storefront/src/addons.generated.ts` with dynamic imports for enabled addons

### Each addon's shape

```typescript
// plugins/cod-payment/index.ts
export function register(ctx: AddonContext): void { /* setup logic */ }
export function disable(): void { /* teardown logic */ }
```

`AddonContext` provides `{ engineType, locale? }`.

### Current addon status

| Addon | Flag | Status |
|---|---|---|
| `dummy-addon` | `dummy` | Proof-of-concept, logs to console |
| `cod-payment` | `cod` | Stub — Section 06 implements real COD flow |
| `stripe-payment` | `stripe` | Stub — Section 09 implements Stripe |

---

## 9. Scripts

All scripts run via `pnpm` hooks or directly with `npx tsx scripts/<name>.ts`.

### `scripts/generate-tokens.ts`

**When it runs:** `predev` and `prebuild` (automatically)
**What it does:**
1. Imports `brandConfig` from `apps/storefront/brand.config.ts`
2. Validates it with `BrandConfigSchema.safeParse()`
3. Calls `generateTokensCSS()` → writes to `apps/storefront/src/styles/brand.tokens.css`

Run manually: `npx tsx scripts/generate-tokens.ts`

### `scripts/generate-addons.ts`

**When it runs:** `predev` and `prebuild` (automatically)
**What it does:**
1. Reads `ADDONS` env var (comma-separated flags)
2. Scans `plugins/*/package.json` for matching `ecom-os.addon.flag`
3. Writes `apps/storefront/src/addons.generated.ts` with imports for enabled addons

Run manually: `ADDONS=cod,stripe npx tsx scripts/generate-addons.ts`

### `scripts/check-engine-imports.sh`

**When it runs:** Part of `pnpm verify`
**What it does:** Fails with exit code 1 if any file under `apps/storefront/src/` (except `lib/engine.ts`) imports from `@ecom-os/engine-woocommerce` or `@ecom-os/engine-vendure`.

This is a CI guardrail preventing architectural drift. If it fails, move the import into `lib/engine.ts`.

### `scripts/seed-woocommerce.ts`

**Status:** WIP. Will populate a WC sandbox with test products. Not yet functional.

---

## 10. Environment Variables

### Root / storefront `.env.local`

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `ECOM_ENGINE` | No | `fake` | Which engine to load: `woocommerce` or `fake` |
| `ECOM_DEPLOY_MODE` | No | (unset = Node/SSR) | Set to `static` for `next export` mode (PHP-only hosting) |
| `ADDONS` | No | (none) | Comma-separated addon flags: `cod,stripe,i18n` |
| `WC_GRAPHQL_URL` | Yes (WC mode) | — | WPGraphQL endpoint: `http://site.local/graphql` |
| `WC_REST_URL` | Yes (WC mode) | — | WC REST base: `http://site.local/wp-json/wc/v3` |
| `WC_REST_KEY` | Yes (WC mode) | — | WC consumer key |
| `WC_REST_SECRET` | Yes (WC mode) | — | WC consumer secret |

### How to get WC REST keys

1. WP Admin → WooCommerce → Settings → Advanced → REST API
2. Add key → Read/Write permissions → Copy key + secret

---

## 11. Development Workflows

### Start the dev server

```bash
pnpm install          # first time only
pnpm dev              # runs predev hooks then starts Next.js
```

The storefront is at `http://localhost:3000`. With `ECOM_ENGINE=fake`, it shows empty product lists. With `ECOM_ENGINE=woocommerce` and a configured `.env.local`, it shows real WC products.

### Rebrand for a client

1. Edit `apps/storefront/brand.config.ts` — change colors, fonts, hero text, contact info
2. Add logo files to `apps/storefront/public/` (referenced as `/logo-light.svg` etc.)
3. Run `pnpm dev` — tokens regenerate automatically
4. Add the client's Google Font `<link>` to `apps/storefront/src/app/layout.tsx`

### Add a new storefront page

1. Create `apps/storefront/src/app/(shop)/your-page/page.tsx` as a server component
2. Use `getEngine()` for data: `const engine = await getEngine()`
3. Create UI components in `src/features/your-feature/ui/`
4. Server components get data and pass it down; client components (`'use client'`) handle interactivity

### Add a new engine adapter

1. Create `packages/engine-yourname/`
2. Implement all 10 methods of `EcomEngine` from `@ecom-os/engine`
3. Add `"@ecom-os/engine-yourname": "workspace:*"` to storefront's `package.json`
4. Add a case to `apps/storefront/src/lib/engine.ts`:
   ```typescript
   } else if (type === 'yourname') {
     const { YourEngine } = await import('@ecom-os/engine-yourname');
     engine = new YourEngine();
   }
   ```
5. Set `ECOM_ENGINE=yourname` in `.env.local`

### Add a new addon

1. Create `plugins/your-addon/` with `package.json` including:
   ```json
   { "ecom-os": { "addon": { "flag": "your-flag" } } }
   ```
2. Export `register(ctx: AddonContext)` and `disable()` from `plugins/your-addon/index.ts`
3. Set `ADDONS=your-flag` in `.env.local`
4. Run `pnpm dev` — addon is auto-imported into `addons.generated.ts`

### Run quality checks

```bash
pnpm verify    # check-engine-imports + lint + typecheck + test
pnpm lint      # ESLint across all workspaces
pnpm typecheck # tsc --noEmit across all workspaces
pnpm test      # Vitest + Playwright
```

---

## 12. Architecture Rules (Non-Negotiable)

These are enforced by TypeScript, CI scripts, or ADRs. Breaking them creates tech debt that compounds.

| # | Rule | Enforced by |
|---|---|---|
| 1 | Storefront never imports engine adapters directly | `check-engine-imports.sh` (CI) |
| 2 | All prices use `Money` (`amount_minor` + `currency`). No raw number prices. | TypeScript interface |
| 3 | `brand.tokens.css` is auto-generated. Never edit it by hand. | File header comment |
| 4 | `addons.generated.ts` is auto-generated. Never edit it by hand. | File header comment |
| 5 | Default to Server Components. `'use client'` only for hooks/browser APIs/GSAP. | Code review |
| 6 | All product images use `next/image`. No raw `<img>`. | ESLint (`next/no-img-element`) |
| 7 | All internal links use `next/link`. No raw `<a href="/...">`. | ESLint |
| 8 | Engine types are imported from `@ecom-os/engine` (workspace alias). Never from relative paths like `../../packages/ecom-engine/src/interface`. | TypeScript path aliases |
| 9 | A new engine must implement all 10 `EcomEngine` methods. `throw new Error('Not implemented')` is allowed during development but must be removed before Sprint completion. | TypeScript compiler |

---

*Last updated: 2026-06-24 — reflects Sprint A state (Sections 01–02 complete)*
