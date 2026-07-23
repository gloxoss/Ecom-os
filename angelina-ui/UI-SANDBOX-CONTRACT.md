# Ecom OS — UI Sandbox Contract

> Copy this file into the root of EVERY new standalone Next.js project you use to design
> a client storefront UI. Any agent (or human) building in the sandbox follows this
> contract. If the contract is respected, merging the finished UI into the Ecom-os
> monorepo as a client theme is a mechanical half-day task, not a rewrite.

---

## 0. What This Sandbox Is

You are building the **look** of one client's storefront: pages, components, styling,
animations. You are NOT building a store. All commerce logic (engine, cart sync,
checkout server actions, auth, payments, i18n plumbing) already exists in the Ecom-os
monorepo and will replace your mocks at merge time.

```
Sandbox (this repo)                          Ecom-os monorepo (merge target)
─────────────────────                        ─────────────────────────────────
UI components, pages, animations   ──────►   packages/themes/src/clients/<client>/
CSS token values in globals.css    ──────►   theme.ts (color/radius config)
Component variations               ──────►   templates registry entries
Mock engine (fixtures)             ──────►   deleted — real getEngine() takes over
Mock server actions                ──────►   deleted — real server actions take over
```

**The golden rule:** every line you write is either (a) pure UI that survives the merge
untouched, or (b) a clearly-marked mock that gets deleted. Nothing in between.

---

## 1. Project Setup

```bash
npx create-next-app@latest <client>-ui --typescript --tailwind --app --src-dir --no-eslint
cd <client>-ui
npm i zustand gsap @gsap/react
```

Pinned expectations (must match the monorepo): **Next.js 16 App Router · React 19 ·
TypeScript strict · Tailwind v4 · Zustand (cart only) · GSAP (animations)**.

Dependency rule: **do not add any other runtime dependency without approval.**
Especially banned: framer-motion, styled-components, emotion, CSS modules, Radix
installed as a lib (shadcn copy-in is fine), redux, react-query, axios. Every extra
dep is a merge conflict and a bundle cost. Icons: inline SVG or lucide-react only.

---

## 2. File Layout (mirror the monorepo exactly)

```
src/
├── app/
│   ├── layout.tsx                 root shell: fonts (next/font), header, footer
│   ├── globals.css                token definitions (§4) — the ONLY place raw colors exist
│   ├── (shop)/
│   │   ├── page.tsx               Home
│   │   ├── catalog/page.tsx       Catalog (+ catalog/[categorySlug]/page.tsx)
│   │   ├── product/[slug]/page.tsx
│   │   ├── cart/page.tsx
│   │   ├── search/page.tsx
│   │   ├── blog/page.tsx  (+ blog/[slug])       — if the client needs it
│   │   └── stores/page.tsx                      — if the client needs it
│   ├── (checkout)/checkout/page.tsx  (+ checkout/success)
│   ├── (account)/account/…        login · register · orders · orders/[orderId] ·
│   │                              addresses · profile
│   └── (legal)/legal/…            privacy · terms · returns
├── features/<feature>/            landing · catalog · product · cart · checkout · account
│   ├── ui/                        components: x.tsx (server) + x-client.tsx (client island)
│   └── data/                      static copy, nav links, fixture content
├── components/shared/             site-header.tsx · brand-footer.tsx · pagination.tsx
├── stores/cart-store.ts           Zustand cart (§6)
└── lib/
    ├── ecom-types.ts              COPY VERBATIM from §3 — never modify
    ├── engine.ts                  mock engine (§3) — deleted at merge
    └── mock-actions.ts            mock server actions (§7) — deleted at merge
```

In the monorepo all routes live under `app/[locale]/…`. You build without the
`[locale]` segment; the merge moves your route folders under it unchanged. Because of
this: **never hardcode locale-dependent logic, and never build absolute internal URLs.**

Naming: kebab-case files · PascalCase types/components · client islands end in
`-client.tsx` · no `index.ts` barrel files.

---

## 3. Data Layer — Types Are Law, Fetching Is Mocked

### 3.1 `src/lib/ecom-types.ts` — copy verbatim, never edit

These are the real Ecom OS domain types. Every component prop that carries commerce
data uses these shapes. If a component needs a field that doesn't exist here, STOP and
flag it — do not invent fields.

```typescript
export type Money = { amount_minor: number; currency: string };

export interface ProductVariant {
  id: string; sku: string; name: string; price: Money; stock_quantity: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: Money;
  images: { url: string; altText: string }[];
  categories: string[];
  variants?: ProductVariant[];
  relatedProducts?: { id: string; slug: string; name: string; price: Money; images: { url: string; altText: string }[] }[];
  reviewCount?: number;
  averageRating?: number;
}

export interface Category { id: string; slug: string; name: string }

export interface CartItem {
  id: string; productId: string; variantId?: string; quantity: number; price: Money;
}

export interface Customer { id: string; email: string; firstName: string; lastName: string }

export interface Address {
  id: string; firstName: string; lastName: string; street: string; city: string;
  postalCode: string; country: string; isDefaultShipping?: boolean; isDefaultBilling?: boolean;
}

export interface OrderLine { id: string; productId: string; quantity: number; price: Money; name: string }

export interface Order {
  id: string; status: string; total: Money; items: OrderLine[]; customer: Customer;
  shippingAddress?: Address; billingAddress?: Address;
}

export interface ProductListQuery {
  category?: string; search?: string; limit?: number; offset?: number;
  minPrice?: number; maxPrice?: number; sort?: 'price_asc' | 'price_desc' | 'newest';
}
export interface ProductListResult { items: Product[]; total: number }

export interface ShippingMethod { id: string; title: string; cost: Money; description?: string }

export type CouponResult =
  | { ok: true; discount: Money; description: string }
  | { ok: false; error: 'invalid' | 'expired' | 'min_order' | 'already_applied' };

export interface StoreCapabilities {
  couponsEnabled: boolean; loyaltyEnabled: boolean; guestCheckout: boolean;
  multiCurrency: boolean; version: string;
}

export interface LoyaltyBalance { points: number; value_minor: number }
```

### 3.2 Money — the rule you must never break

Prices are integers in minor units. `$19.99` is `{ amount_minor: 1999, currency: 'USD' }`.

```tsx
// ✅ the only way to display a price
const fmt = (m: Money) => `${(m.amount_minor / 100).toFixed(2)} ${m.currency}`;
// ❌ never: price: number, parseFloat, toFixed on floats, currency symbols hardcoded in JSX
```

### 3.3 `src/lib/engine.ts` — the mock engine (deleted at merge)

Pages fetch through `getEngine()` exactly like the real app. Only the implementation is
fake. Signatures mirror the real `EcomEngine` — do not rename or "improve" them.

```typescript
// MOCK — replaced by the real @/lib/engine at merge. Keep signatures identical.
import type {
  Product, Category, ProductListQuery, ProductListResult,
  ShippingMethod, CouponResult, StoreCapabilities, Money,
} from './ecom-types';

const usd = (amount_minor: number): Money => ({ amount_minor, currency: 'USD' });

const PRODUCTS: Product[] = Array.from({ length: 12 }, (_, i) => ({
  id: `p-${i + 1}`,
  slug: `sample-product-${i + 1}`,
  name: `Sample Product ${i + 1}`,
  description: 'Fixture description. Two sentences so cards and PDPs have real texture.',
  price: usd(1999 + i * 500),
  images: [{ url: `https://picsum.photos/seed/p${i}/800/1000`, altText: `Sample Product ${i + 1}` }],
  categories: [i % 2 ? 'accessories' : 'apparel'],
  reviewCount: 12 + i,
  averageRating: 4.5,
}  ));

const CATEGORIES: Category[] = [
  { id: 'c-1', slug: 'apparel', name: 'Apparel' },
  { id: 'c-2', slug: 'accessories', name: 'Accessories' },
];

export async function getEngine() {
  return {
    async listProducts(q: ProductListQuery = {}): Promise<ProductListResult> {
      let items = PRODUCTS;
      if (q.category) items = items.filter((p) => p.categories.includes(q.category!));
      if (q.search) items = items.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
      if (q.sort === 'price_asc') items = [...items].sort((a, b) => a.price.amount_minor - b.price.amount_minor);
      if (q.sort === 'price_desc') items = [...items].sort((a, b) => b.price.amount_minor - a.price.amount_minor);
      const offset = q.offset ?? 0;
      return { items: items.slice(offset, offset + (q.limit ?? 12)), total: items.length };
    },
    async getProduct(slug: string): Promise<Product | null> {
      return PRODUCTS.find((p) => p.slug === slug) ?? null;
    },
    async listCategories(): Promise<Category[]> {
      return CATEGORIES;
    },
    async listShippingMethods(): Promise<ShippingMethod[]> {
      return [
        { id: 'standard', title: 'Standard', cost: usd(500), description: '3–5 days' },
        { id: 'express', title: 'Express', cost: usd(1500), description: '1–2 days' },
      ];
    },
    async applyCoupon(_cartId: string, code: string): Promise<CouponResult> {
      return code === 'WELCOME10'
        ? { ok: true, discount: usd(1000), description: '10 off' }
        : { ok: false, error: 'invalid' };
    },
    async getCapabilities(): Promise<StoreCapabilities> {
      return { couponsEnabled: true, loyaltyEnabled: true, guestCheckout: true, multiCurrency: false, version: 'mock' };
    },
  };
}
```

Usage in pages — identical to production:

```tsx
export default async function CatalogPage() {
  const engine = await getEngine();
  const [categories, result] = await Promise.all([
    engine.listCategories(),
    engine.listProducts({ limit: 12 }),
  ]);
  return <Catalog categories={categories} products={result.items} total={result.total} />;
}
```

**Absolute bans:** no `fetch()` to any real website or API anywhere in the sandbox. No
scraping calls at runtime. When you clone a section from another site, you clone its
*markup and motion*, rebuilt on our tokens and fed by fixture data — never its data
pipeline. Multiple independent fetches always go through `Promise.all` (no waterfalls).

---

## 4. Styling — Tokens Only, Values Live in One File

### 4.1 `src/app/globals.css` — the single source of color

The variable names match the Ecom OS theme registry (`ThemeColors` in
`packages/themes`). Values are **HSL channel triplets** (no `hsl()` wrapper, no hex) —
this exact block is what gets lifted into `theme.ts` at merge.

```css
@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 4px);
}
```

### 4.2 Styling rules

1. Components use ONLY token classes: `bg-background`, `text-foreground`, `bg-primary`,
   `text-primary-foreground`, `bg-card`, `border-border`, `text-muted-foreground`,
   `ring-ring`, `rounded-md`… Set the client's palette by editing the `:root` values.
2. **No raw colors in components.** No `bg-[#1a1a1a]`, no `text-red-500`, no inline
   `style={{ color: … }}`. When cloning a design, translate every color it uses into
   one of the 19 tokens (add nothing).
3. Fonts via `next/font` in `layout.tsx`, exposed as CSS vars, mapped in `@theme`
   (`--font-sans: var(--font-inter)` etc.). No `<link>` to font CDNs.
4. Spacing/layout: Tailwind scale utilities. Prefer logical properties (`ms-*`, `me-*`,
   `ps-*`, `text-start`) over `ml-*`/`text-left` — the production app supports RTL
   (Arabic) and logical utilities make your UI RTL-ready for free.
5. Dark mode only if the client needs it; if so, a `.dark { … }` block overriding the
   same `:root` variables — nothing else.
6. `next/image` for every raster image (with real `width`/`height` or `fill`),
   `next/link` for every internal route. No `<img>`, no `<a href="/...">`.

---

## 5. Components — Server First, Islands for Motion

1. `page.tsx` is always an async Server Component that fetches via `getEngine()` and
   passes plain JSON props down. No `'use client'` on pages.
2. `'use client'` only for hooks, event handlers, browser APIs, GSAP. Keep islands at
   the leaves: `AddToCartButton`, a carousel, a filter drawer — not whole sections.
3. Animated section = pair of files: `hero-section.tsx` (server: markup, props) +
   `hero-client.tsx` (client: GSAP via `useGSAP` from `@gsap/react`). Register ScrollTrigger
   inside the island only. Motion style: fast in (~0.3s, ease-out), settled stop —
   no endless floaty loops, nothing blocking the main thread.
4. Variations, not conditionals. If you design two heros to choose from, build
   `hero-default.tsx` and `hero-bold.tsx` side by side. At merge they become entries in
   the theme's `templates` registry. Never `if (clientWantsX)` inside a component.
5. No hardcoded copy in JSX for anything the client might change (headlines, nav
   labels, USPs, contact info). Put it in `features/<feature>/data/*.ts` and import it.
   Microcopy that is structurally part of the component ("Add to cart") may stay inline —
   it gets translated through the i18n layer at merge.
6. Accessibility floor: semantic landmarks, one `h1` per page, alt text on images,
   visible focus states (`ring-ring`), touch targets ≥ 40px, keyboard-reachable menus.

---

## 6. Cart & Interactive State

`src/stores/cart-store.ts` — a Zustand store persisted to localStorage under the key
`cart-storage`, exposing exactly this API (the production store has the same names —
components written against it survive the merge):

```typescript
items: CartItem[]
addItem(product: Product, quantity?: number): void
removeItem(productId: string): void
updateQuantity(productId: string, quantity: number): void
clearCart(): void
getCartTotal(): number          // minor units
```

Rules: Zustand is for cart/drawer state only. No global state lib for anything else —
server components own data, `useState` owns local UI state. Wrap store-reading UI in a
`<ClientOnly>` gate (or render after mount) to avoid hydration mismatch with persisted
state.

---

## 7. What You Mock vs. What You Skip

`src/lib/mock-actions.ts` — fake server actions with production-shaped signatures, so
forms are designed against the real flow:

```typescript
'use server';
// MOCK — replaced by real server actions at merge.
export async function checkoutAction(formData: FormData) {
  await new Promise((r) => setTimeout(r, 800));      // let loading states be designed
  return { ok: true, orderId: 'MOCK-1001' };
}
export async function loginAction(_formData: FormData) {
  return { ok: true };
}
```

**Build the UI for (with mocks):** checkout form (3-step: info → shipping/coupon →
payment method choice), login/register forms with error states, order list + order
detail, address book, profile, empty states (empty cart, no results, no orders),
loading skeletons, error states.

**Do NOT build (exists in the monorepo, arrives at merge):** real auth/cookies/
middleware, payment SDK integration (Stripe Elements/CMI redirect), webhook handling,
price recomputation, coupon validation logic, i18n routing, rate limiting, CSP.

**Design constraint from production:** checkout never trusts client prices — your
checkout UI must display totals but submit only item IDs/slugs + quantities. Design the
form data flow accordingly.

---

## 8. Definition of Done (sandbox side)

- [ ] Every page in §2's route map exists with real fixture content (or is explicitly descoped)
- [ ] Zero raw colors/hex outside `globals.css` — grep check: `#[0-9a-fA-F]{3,6}` in `src/**/*.tsx` returns nothing
- [ ] Zero `fetch(` outside `lib/engine.ts` — grep check
- [ ] All prices rendered from `Money` (grep for `toFixed` — every hit divides `amount_minor` by 100)
- [ ] `'use client'` only in leaf/interactive files; every page is a server component
- [ ] `next/image` + `next/link` everywhere; `npx next build` passes with strict TS
- [ ] Empty/loading/error states designed for catalog, cart, checkout, account
- [ ] Mobile-first verified at 375px, 768px, 1280px
- [ ] A `THEME-NOTES.md` at sandbox root: palette values, fonts + weights, radius,
      animation inventory (what animates, how, which files), template variations built,
      any deliberate deviations from this contract

---

## 9. Merge-Day Playbook (done in the Ecom-os monorepo)

1. **Scaffold the theme:** run the CLI theme command → creates
   `packages/themes/src/clients/<client>/` + registry entry.
2. **Lift tokens:** copy the sandbox `:root` values into `theme.ts` `config.colors`
   (they're already HSL channel strings — 1:1), plus `radius` and fonts.
3. **Move UI:** copy `features/*/ui` components and `components/shared` overrides into
   the monorepo. Generic improvements go into the shared components; client-specific
   variations go in as template registry entries referenced by the theme's `templates` map.
4. **Rewire data:** change `import { getEngine } from '@/lib/engine'` — same path,
   real module. Delete `lib/ecom-types.ts` (types now come from `@ecom-os/engine`),
   `lib/engine.ts` mock, and `mock-actions.ts`; point forms at the real server actions.
5. **Routes:** drop your route folders under `app/[locale]/…` (they were built to mirror it).
6. **Copy → content system:** move `features/*/data` strings into locale JSON if the
   client uses `ADDONS=i18n`.
7. **Design kit:** write `DESIGN.md` + `ui-patterns.md` in the client theme folder
   (from your `THEME-NOTES.md`).
8. **Env + verify:** `THEME_NAME=<client>`, then `pnpm verify` (engine-import guard,
   lint, typecheck, tests) and a visual pass on home / catalog / PDP / cart / checkout
   / account.

If steps 3–5 require rewriting components (not just moving them), the sandbox violated
this contract somewhere — fix the pattern in the sandbox before merging, and note the
violation so the next sandbox doesn't repeat it.
