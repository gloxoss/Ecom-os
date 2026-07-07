# Ecom OS — Agent Implementation Plan
## Sections 03 Close · 05 Complete · 06 Full · 07 Full

> **For the agent:** Read this entire document before writing a single line of code. Every file path, type, and decision is intentional. Follow it precisely.

---

## 1. Project Context

**What this is:** A headless e-commerce monorepo. One Next.js 16 storefront that connects to WooCommerce (WordPress + WPGraphQL + WC REST) via a typed `EcomEngine` adapter pattern.

**Stack:** pnpm workspaces · TypeScript strict · Next.js 16 App Router · React 19 · Tailwind v4 · Zustand · GSAP · Zod · Vitest · Playwright

**What is already built (do not rebuild):**
- `packages/ecom-engine/` — `EcomEngine` interface, all domain types (`Money`, `Product`, `Cart`, etc.), `FakeEngine`, factory singleton
- `packages/engine-woocommerce/` — `WooCommerceEngine` class (catalog reads work; cart/auth/order write are stubs)
- `packages/brand-config/` — Zod schema + CSS token generator
- `apps/storefront/` — Next.js app with route groups, `lib/engine.ts` gateway, Zustand cart store, 5 working pages
- `scripts/generate-tokens.ts`, `scripts/generate-addons.ts`, `scripts/check-engine-imports.sh`

**Monorepo root:** `D:\Users\zakio\Desktop\Work\Ecom-os\`

---

## 2. Architecture Rules — Hard Constraints

Violating any of these creates tech debt the plan explicitly accounts for.

| # | Rule |
|---|---|
| 1 | **Engine import guard:** `apps/storefront/src/` may only import engine adapters in `src/lib/engine.ts`. Every other file imports types from `@ecom-os/engine` only. `scripts/check-engine-imports.sh` enforces this. |
| 2 | **Money type everywhere:** All prices are `Money { amount_minor: number, currency: string }`. Never `number`. Display: `(price.amount_minor / 100).toFixed(2)`. |
| 3 | **Server-first:** Page files (`page.tsx`, `layout.tsx`) are Server Components unless they literally need browser APIs. Add `'use client'` only to leaf components with hooks/events/GSAP. |
| 4 | **next/image always** for raster images. **next/link always** for internal routes. No `<img>` or `<a href="/">`. |
| 5 | **No hardcoded business strings in JSX.** Content comes from `brandConfig` or from the engine. |
| 6 | **Price integrity:** The server recomputes all prices from the engine before creating an order. Client-supplied prices are ignored. Non-negotiable security property (SR-VAL-002). |
| 7 | **`brand.tokens.css` and `addons.generated.ts` are auto-generated.** Never edit them by hand. |
| 8 | Import types from `@ecom-os/engine` (workspace alias). Never from relative paths like `../../packages/ecom-engine/src/interface`. |

---

## 3. Key Files Reference

Read these before starting. They define the types and contracts everything else must conform to.

```
packages/ecom-engine/src/types.ts          ← ALL domain types
packages/ecom-engine/src/interface.ts      ← EcomEngine interface (10 methods)
packages/ecom-engine/src/factory.ts        ← get/setEngine() singleton
apps/storefront/src/lib/engine.ts          ← engine gateway (only file that imports adapters)
apps/storefront/src/stores/cart-store.ts   ← Zustand client cart
apps/storefront/brand.config.ts            ← brand values
apps/storefront/src/app/globals.css        ← Tailwind entry point
packages/engine-woocommerce/src/client.ts  ← WooCommerceEngine (implement stubs here)
packages/engine-woocommerce/src/rest.ts    ← WC REST client (use this for all REST calls)
packages/engine-woocommerce/src/graphql.ts ← WPGraphQL client (use this for all GQL reads)
```

---

## 4. Environment Variables

```bash
ECOM_ENGINE=woocommerce          # or 'fake' for local dev without WC
ECOM_DEPLOY_MODE=                # unset = Node/SSR; 'static' = next export
ADDONS=cod                       # comma-separated addon flags
WC_GRAPHQL_URL=http://cms-ecom-os.local/graphql
WC_REST_URL=http://cms-ecom-os.local/wp-json/wc/v3
WC_REST_KEY=<consumer_key>
WC_REST_SECRET=<consumer_secret>
REVALIDATE_SECRET=<random_string>   # needed for ISR webhook (Phase 3)
NOTIFICATION_EMAIL=<merchant_email> # for COD order notifications (Phase 4)
```

---

## Phase 0 — Pre-flight Bug Fixes

Run these first. They are blocking bugs in already-shipped code.

### Fix 1: `product-grid.tsx` — direct relative import

**File:** `apps/storefront/src/features/catalog/ui/product-grid.tsx`

**Change line 1:**
```typescript
// BEFORE (wrong — direct relative import from packages/)
import { Product } from '../../../../../../packages/ecom-engine/src/interface';

// AFTER
import { Product } from '@ecom-os/engine';
```

### Fix 2: `orders.ts` — `any` type + wrong Money return

**File:** `packages/engine-woocommerce/src/orders.ts`

Rewrite it completely:
```typescript
import { Order, CheckoutInput, CartItem, Money } from '@ecom-os/engine';
import { restFetch } from './rest';

type WCLineItem = { product_id: number; quantity: number };

export async function createOrderRest(
  input: CheckoutInput,
  items: CartItem[],
): Promise<Order> {
  const line_items: WCLineItem[] = items.map(item => ({
    product_id: Number(item.productId),
    quantity: item.quantity,
  }));

  const payload = {
    payment_method: input.paymentMethod,
    payment_method_title: input.paymentMethod === 'cod' ? 'Cash on Delivery' : input.paymentMethod,
    set_paid: false,
    billing: {
      first_name: input.firstName,
      last_name: input.lastName,
      address_1: input.address,
      email: input.email,
    },
    line_items,
  };

  const response = await restFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const total: Money = {
    amount_minor: Math.round(parseFloat(response.total ?? '0') * 100),
    currency: response.currency ?? 'USD',
  };

  return {
    id: String(response.id),
    status: response.status ?? 'pending',
    total,
    items: [],
    customer: {
      id: String(response.customer_id ?? 0),
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
    },
  };
}
```

### Fix 3: `hero-section.tsx` — hardcoded business strings

**File:** `apps/storefront/src/features/landing/ui/hero-section.tsx`

```typescript
import { brandConfig } from '../../../../brand.config';
import { HeroClient } from './hero-client';

export function HeroSection() {
  return (
    <section>
      <HeroClient
        title={brandConfig.hero.headline}
        subtitle={brandConfig.hero.subheadline}
        ctaLabel={brandConfig.hero.ctaLabel}
        ctaHref={brandConfig.hero.ctaHref}
      />
    </section>
  );
}
```

Then update `hero-client.tsx` props interface to accept `ctaLabel` and `ctaHref` if it doesn't already.

---

## Phase 1 — Section 03: Close Addon Loader

**Estimated time:** 30–45 min
**Acceptance:** addons register on app boot; unknown addon flag fails with helpful error; CI rejects addons missing exports.

### Task 1.1 — Create `apps/storefront/src/lib/addons.ts`

This file is called once at app startup to register all enabled addons.

```typescript
// apps/storefront/src/lib/addons.ts
import { AddonContext } from '@ecom-os/engine';
import { registeredAddons } from '@/addons.generated';

export function initAddons(ctx: AddonContext): void {
  for (const addon of registeredAddons) {
    addon.register(ctx);
  }
}
```

### Task 1.2 — Call `initAddons` from root layout

**File:** `apps/storefront/src/app/layout.tsx`

```typescript
import './globals.css';
import { initAddons } from '@/lib/addons';

initAddons({ engineType: process.env.ECOM_ENGINE ?? 'fake' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        {children}
      </body>
    </html>
  );
}
```

### Task 1.3 — Extend `scripts/check-engine-imports.sh`

Add a check that every `plugins/*/index.ts` exports both `register` and `disable`:

```bash
#!/bin/bash
set -e

# Rule 1: No direct engine adapter imports in storefront (except lib/engine.ts)
echo "Checking for illegal direct engine imports..."
ILLEGAL=$(grep -rnE "import .* from '.*engine-(woocommerce|vendure)" apps/storefront/src \
  | grep -v "apps/storefront/src/lib/engine.ts")
if [ -n "$ILLEGAL" ]; then
  echo "❌ Illegal direct engine imports:"
  echo "$ILLEGAL"
  exit 1
fi
echo "✅ Engine imports clean."

# Rule 2: Every addon in plugins/ must export register and disable
echo "Checking addon exports..."
for dir in plugins/*/; do
  index="$dir/index.ts"
  if [ ! -f "$index" ]; then continue; fi
  if ! grep -q "export function register" "$index"; then
    echo "❌ $index is missing export 'register'"
    exit 1
  fi
  if ! grep -q "export function disable" "$index"; then
    echo "❌ $index is missing export 'disable'"
    exit 1
  fi
done
echo "✅ Addon exports clean."

exit 0
```

### Task 1.4 — Verify Section 03 acceptance criteria

Run:
```bash
ADDONS= pnpm dev        # zero addons registered — no errors
ADDONS=cod pnpm dev     # COD addon registers
ADDONS=fake pnpm dev    # should exit with "Addon 'fake' not found in plugins/"
bash scripts/check-engine-imports.sh  # both checks pass
```

---

## Phase 2 — Section 05: Complete Home · Catalog · PDP

**Estimated time:** 1–2 days
**Acceptance:** all screens render real WC data; ISR wired; error states exist; Lighthouse ≥ 90 on mobile.

### Task 2.1 — Add ISR caching to all engine data fetches

**File:** `packages/engine-woocommerce/src/graphql.ts`

Wrap all `gqlClient.request` calls in Next.js `fetch` cache tags. The simplest way in Next.js 16 is to configure `fetch` via Next.js cache options. Since `graphql-request` uses `fetch` internally, extend the client to pass `next` options:

```typescript
// packages/engine-woocommerce/src/graphql.ts
import { GraphQLClient } from 'graphql-request';

const url = process.env.WC_GRAPHQL_URL;
if (!url) throw new Error('WC_GRAPHQL_URL is not set');

export const gqlClient = new GraphQLClient(url, {
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      next: { revalidate: 60, tags: ['wc-products'] },
    }),
});
```

### Task 2.2 — Add `generateStaticParams` to PDP

**File:** `apps/storefront/src/app/(shop)/product/[slug]/page.tsx`

Add at the top (before the default export):

```typescript
export async function generateStaticParams() {
  const engine = await getEngine();
  const result = await engine.listProducts({ limit: 100 });
  return result.items.map(p => ({ slug: p.slug }));
}

export const revalidate = 60;
```

Also add `export const revalidate = 60` to `(shop)/page.tsx` and `(shop)/catalog/page.tsx`.

### Task 2.3 — Add ISR revalidation API route

**File:** `apps/storefront/src/app/api/revalidate/route.ts` (create)

```typescript
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }
  revalidateTag('wc-products');
  return NextResponse.json({ revalidated: true });
}
```

Set `REVALIDATE_SECRET` in `.env.local`. Wire this URL as a WooCommerce webhook (product.created + product.updated + product.deleted → POST to `https://yourdomain.com/api/revalidate?secret=XXX`).

### Task 2.4 — Add proper error + empty states

**File:** `apps/storefront/src/app/(shop)/product/[slug]/page.tsx`

Wrap engine call in try/catch:
```typescript
let product = null;
try {
  product = await engine.getProduct(slug);
} catch {
  notFound();
}
if (!product) notFound();
```

**File:** `apps/storefront/src/app/(shop)/catalog/page.tsx`

Already has `if (!products.length)` check in `ProductGrid`. Extend the page to handle engine errors:
```typescript
let result = { items: [], total: 0 };
try {
  result = await engine.listProducts({ category: searchParams.category });
} catch {
  // engine down — show empty state, don't crash
}
```

### Task 2.5 — Add category filter to catalog page

**File:** `apps/storefront/src/app/(shop)/catalog/page.tsx`

The page already fetches categories but never renders them. Add a category nav:

```typescript
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const engine = await getEngine();
  const [result, categories] = await Promise.all([
    engine.listProducts({ category }).catch(() => ({ items: [], total: 0 })),
    engine.listCategories().catch(() => []),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight mb-8">All Products</h1>

      {/* Category filter bar */}
      <div className="flex gap-3 flex-wrap mb-10">
        <a
          href="/catalog"
          className={`px-4 py-2 rounded-full text-sm font-medium border transition ${!category ? 'bg-foreground text-background' : 'border-foreground/20 hover:bg-muted'}`}
        >
          All
        </a>
        {categories.map(cat => (
          <a
            key={cat.id}
            href={`/catalog?category=${cat.slug}`}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition ${category === cat.slug ? 'bg-foreground text-background' : 'border-foreground/20 hover:bg-muted'}`}
          >
            {cat.name}
          </a>
        ))}
      </div>

      <ProductGrid products={result.items} />
    </main>
  );
}
```

Note: use `<a>` tags here (not `Link`) because these are search-param navigations that need a full query string — `Link` works fine too, just preserve the query correctly.

Actually use `Link` from `next/link` with `href={{ pathname: '/catalog', query: { category: cat.slug } }}`.

### Task 2.6 — Add a breadcrumb to the PDP

**File:** `apps/storefront/src/features/catalog/ui/breadcrumb.tsx` (create)

```typescript
import Link from 'next/link';

type Crumb = { label: string; href?: string };

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-secondary mb-8">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-foreground transition">{crumb.label}</Link>
          ) : (
            <span className="text-foreground">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
```

Use in PDP:
```typescript
<Breadcrumb crumbs={[
  { label: 'Home', href: '/' },
  { label: 'Catalog', href: '/catalog' },
  { label: product.name },
]} />
```

### Task 2.7 — Lighthouse check

After completing 2.1–2.6:
1. Run `pnpm build` then `pnpm start`
2. Open Chrome DevTools → Lighthouse → Mobile → Performance
3. Run on `/` and `/catalog`
4. Target: Performance ≥ 90, LCP < 2.0s

Common fixes if score is low:
- Ensure hero image has `priority` prop on `next/image`
- Add `sizes` prop to all `next/image` in product grid: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"`
- Move GSAP `ScrollTrigger` animation behind `useEffect` with `{ passive: true }` listeners
- Ensure no render-blocking fonts (use `font-display: swap` or Next.js font optimization)

---

## Phase 3 — Section 06: Cart · Checkout · COD

**Estimated time:** 3–5 days
**Risk:** 🔴 RED — most complex section. Read every task before starting any.
**Dependency:** Phase 2 must be complete first.

### Architecture Decision for Cart

The WooCommerce REST API (`/wp-json/wc/v3/`) does not expose standard cart endpoints for headless use. We use this pattern:

```
Client (browser):
  - Zustand store holds cart items for UI (productId, quantity, display price)
  - Cart ID (UUID) stored in an HttpOnly cookie

Server (Next.js):
  - Server actions receive cart item IDs + quantities (NOT prices)
  - Server fetches current prices from engine (WC GraphQL)
  - Server creates WC order with authoritative prices
  - Price integrity: client can never control final prices
```

This means `engine.getCart()` and `engine.addToCart()` operate on our own server-side cart model (cookie-based), NOT on WC's internal cart (which is PHP session-based and not headless-friendly).

### Task 3.1 — Cart cookie server actions

**File:** `apps/storefront/src/features/cart/server/cart-actions.ts` (create)

```typescript
'use server';

import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

const CART_COOKIE = 'ecom_cart_id';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

export async function getOrCreateCartId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CART_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  cookieStore.set(CART_COOKIE, id, COOKIE_OPTIONS);
  return id;
}

export async function clearCartCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE);
}
```

### Task 3.2 — Update Zustand cart store to sync cart ID

**File:** `apps/storefront/src/stores/cart-store.ts`

Keep the existing Zustand store as-is (it handles client-side UI state). Add a `cartId` field:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@ecom-os/engine';

export interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) =>
        set((state) => {
          const existing = state.items.find(i => i.id === product.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({ items: state.items.filter(i => i.id !== productId) })),
      updateQty: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter(i => i.id !== productId)
            : state.items.map(i => i.id === productId ? { ...i, quantity } : i),
        })),
      clearCart: () => set({ items: [] }),
      getCartTotal: () =>
        get().items.reduce((sum, item) => sum + item.price.amount_minor * item.quantity, 0),
      getItemCount: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    { name: 'cart-storage' }
  )
);
```

### Task 3.3 — Implement WooCommerceEngine cart stubs

**File:** `packages/engine-woocommerce/src/client.ts`

Implement the three cart/checkout methods. The WC adapter treats the cart as a validated snapshot — it doesn't store cart state (that's the client/cookie layer's job). What it DOES do: validate stock + fetch authoritative prices.

```typescript
async getCart(cartId: string): Promise<Cart> {
  // In this architecture, cart state is managed by the storefront cookie layer.
  // The engine returns an empty cart shell; actual items are held in Zustand.
  // This method exists to satisfy the interface — real cart data comes from
  // client → server action → validateAndCheckout.
  return {
    id: cartId,
    items: [],
    subtotal: { amount_minor: 0, currency: 'USD' },
    total: { amount_minor: 0, currency: 'USD' },
  };
}

async addToCart(cartId: string, input: AddToCartInput): Promise<Cart> {
  // Validate product exists and has stock before adding to client cart.
  const product = await fetchProductBySlug(input.productId).then(
    raw => raw ? mapProduct(raw) : null
  );
  if (!product) throw new Error(`Product not found: ${input.productId}`);
  // Return a cart with just this item — the client merges it into Zustand.
  const item: CartItem = {
    id: `${cartId}-${input.productId}`,
    productId: input.productId,
    quantity: input.quantity,
    price: product.price,
  };
  return {
    id: cartId,
    items: [item],
    subtotal: {
      amount_minor: product.price.amount_minor * input.quantity,
      currency: product.price.currency,
    },
    total: {
      amount_minor: product.price.amount_minor * input.quantity,
      currency: product.price.currency,
    },
  };
}

async initCheckout(cartId: string, input: CheckoutInput): Promise<CheckoutSession> {
  // Validate checkout input — actual order creation is in placeOrder.
  if (!input.email || !input.firstName || !input.lastName || !input.address) {
    throw new Error('Missing required checkout fields');
  }
  return { cartId, status: 'PENDING' };
}
```

### Task 3.4 — Implement `placeOrder` with price integrity

**File:** `packages/engine-woocommerce/src/client.ts`

Add a new method signature for placeOrder that accepts cart items (needed for price recomputation). The interface has `placeOrder(session: CheckoutSession)` but `CheckoutSession` only has `cartId` + `status`. We need to pass cart items + checkout input through.

**Solution:** Store checkout data in `CheckoutSession` via a discriminated type extension. Add optional fields to `CheckoutSession` in the engine types:

**File:** `packages/ecom-engine/src/types.ts` — add to `CheckoutSession`:
```typescript
export type CheckoutSession = {
  cartId: string;
  status: 'PENDING' | 'COMPLETED';
  // Populated by initCheckout for use by placeOrder
  _input?: CheckoutInput;
  _items?: Array<{ productId: string; quantity: number; slug: string }>;
};
```

**File:** `packages/engine-woocommerce/src/client.ts` — update `initCheckout` to carry data:
```typescript
async initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; quantity: number; slug: string }>): Promise<CheckoutSession> {
  if (!input.email || !input.firstName || !input.lastName || !input.address) {
    throw new Error('Missing required checkout fields');
  }
  return { cartId, status: 'PENDING', _input: input, _items: items };
}
```

**File:** `packages/engine-woocommerce/src/client.ts` — implement `placeOrder`:
```typescript
async placeOrder(session: CheckoutSession): Promise<Order> {
  if (!session._input) throw new Error('No checkout input on session — call initCheckout first');

  // PRICE INTEGRITY: fetch authoritative prices from WC for every cart item
  // Never trust client-supplied prices.
  const items: CartItem[] = [];
  for (const item of session._items ?? []) {
    const raw = await fetchProductBySlug(item.slug);
    if (!raw) throw new Error(`Product not found at checkout: ${item.slug}`);
    const product = mapProduct(raw);
    items.push({
      id: `${session.cartId}-${item.productId}`,
      productId: item.productId,
      quantity: item.quantity,
      price: product.price, // authoritative server price — client price ignored
    });
  }

  const order = await createOrderRest(session._input, items);
  return order;
}
```

### Task 3.5 — Build the Cart UI (drawer + page)

**File:** `apps/storefront/src/features/cart/ui/cart-drawer.tsx` (create)

Client component. Shows the cart items, quantities, total, and a link to `/checkout`.

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import Link from 'next/link';
import { useState } from 'react';

export function CartDrawer() {
  const { items, removeItem, updateQty, getCartTotal, getItemCount } = useCartStore();
  const [open, setOpen] = useState(false);
  const total = getCartTotal();

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="relative p-2"
        aria-label="Open cart"
      >
        <span>Cart</span>
        {getItemCount() > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {getItemCount()}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative z-10 w-full max-w-md bg-background h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Your Cart ({getItemCount()})</h2>
              <button onClick={() => setOpen(false)} className="p-2">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 && (
                <p className="text-secondary text-center py-12">Your cart is empty.</p>
              )}
              {items.map(item => (
                <div key={item.id} className="flex gap-4 items-start">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-secondary text-sm">${(item.price.amount_minor / 100).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="w-7 h-7 border rounded flex items-center justify-center"
                    >−</button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="w-7 h-7 border rounded flex items-center justify-center"
                    >+</button>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-secondary hover:text-foreground"
                  >✕</button>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between mb-4 font-bold text-lg">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="block w-full bg-foreground text-background text-center py-4 rounded font-bold hover:opacity-90 transition"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
```

### Task 3.6 — Add a site header with cart trigger

**File:** `apps/storefront/src/components/shared/site-header.tsx` (create)

```typescript
import Link from 'next/link';
import { CartDrawer } from '@/features/cart/ui/cart-drawer';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-foreground/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          {/* Replace with <Image> of brand logo when logo files are added */}
          Ecom OS
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/catalog" className="text-sm hover:text-primary transition">Shop</Link>
          <Link href="/account" className="text-sm hover:text-primary transition">Account</Link>
          <CartDrawer />
        </nav>
      </div>
    </header>
  );
}
```

Then import `SiteHeader` into `apps/storefront/src/app/layout.tsx`:
```typescript
import { SiteHeader } from '@/components/shared/site-header';

export default function RootLayout(...) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground font-sans">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
```

### Task 3.7 — Rebuild the Checkout page (3-step flow with price integrity)

**File:** `apps/storefront/src/app/(checkout)/checkout/page.tsx` (rewrite)

This page:
1. Reads cart items from Zustand (client-side) via a hidden form field
2. Server action receives item IDs + quantities (NOT prices)
3. Server fetches authoritative prices from engine
4. Server creates WC order with server prices

```typescript
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getOrCreateCartId, clearCartCookie } from '@/features/cart/server/cart-actions';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';

export default async function CheckoutPage() {
  const cartId = await getOrCreateCartId();

  async function placeOrder(formData: FormData) {
    'use server';

    // Parse cart items sent from client (IDs + quantities only — NO prices)
    const cartJson = formData.get('cartItems') as string;
    let clientItems: Array<{ productId: string; quantity: number; slug: string }> = [];
    try {
      clientItems = JSON.parse(cartJson ?? '[]');
    } catch {
      throw new Error('Invalid cart data');
    }

    if (clientItems.length === 0) {
      throw new Error('Cart is empty');
    }

    const engine = await getEngine();
    const cartId = await getOrCreateCartId();

    // Server calls initCheckout with items (slugs used to re-fetch prices)
    const session = await engine.initCheckout(
      cartId,
      {
        email: formData.get('email') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        paymentMethod: formData.get('paymentMethod') as string,
      },
      clientItems,
    );

    // placeOrder re-fetches prices server-side — client prices ignored
    const order = await engine.placeOrder(session);

    // Send merchant notification (best-effort — do NOT await or block on this)
    notifyMerchant(order).catch(() => {});

    await clearCartCookie();
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  return <CheckoutForm cartId={cartId} action={placeOrder} />;
}

async function notifyMerchant(order: { id: string; total: { amount_minor: number; currency: string } }) {
  const email = process.env.NOTIFICATION_EMAIL;
  if (!email) return;
  // ponytail: basic fetch to a notification endpoint or log only
  // Replace with nodemailer / Resend / SendGrid in Section 10
  console.log(`[ORDER] New order ${order.id} — total ${order.total.amount_minor / 100} ${order.total.currency} → notify ${email}`);
}
```

### Task 3.8 — Create `CheckoutForm` client component

**File:** `apps/storefront/src/features/checkout/ui/checkout-form.tsx` (create)

This is a client component that serializes the Zustand cart into a hidden field before form submit:

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect, useRef } from 'react';

interface Props {
  cartId: string;
  action: (formData: FormData) => Promise<void>;
}

export function CheckoutForm({ cartId, action }: Props) {
  const { items, getCartTotal } = useCartStore();
  const cartItemsRef = useRef<HTMLInputElement>(null);

  // Serialize cart items (IDs + quantities + slugs) into hidden field
  useEffect(() => {
    if (cartItemsRef.current) {
      const payload = items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
        slug: item.slug,
      }));
      cartItemsRef.current.value = JSON.stringify(payload);
    }
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-secondary mb-4">Your cart is empty.</p>
        <a href="/catalog" className="underline">Continue shopping</a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <form action={action} className="space-y-6">
        {/* Hidden: cart items for server price recomputation */}
        <input type="hidden" name="cartItems" ref={cartItemsRef} />
        <input type="hidden" name="cartId" value={cartId} />

        {/* Contact */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Contact</h2>
          <input
            type="email" name="email" placeholder="Email address" required
            className="w-full border border-foreground/20 p-3 rounded-md"
          />
        </section>

        {/* Shipping */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Shipping address</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input name="firstName" placeholder="First name" required className="border border-foreground/20 p-3 rounded-md" />
            <input name="lastName" placeholder="Last name" required className="border border-foreground/20 p-3 rounded-md" />
          </div>
          <textarea
            name="address" placeholder="Full address" required rows={3}
            className="w-full border border-foreground/20 p-3 rounded-md"
          />
        </section>

        {/* Payment */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Payment</h2>
          <label className="flex items-center gap-3 p-4 border border-foreground/20 rounded-md cursor-pointer">
            <input type="radio" name="paymentMethod" value="cod" defaultChecked />
            <span className="font-medium">Cash on Delivery</span>
            <span className="text-secondary text-sm ml-auto">Pay when you receive</span>
          </label>
        </section>

        {/* Order summary */}
        <section className="bg-muted p-4 rounded-md">
          <h2 className="text-lg font-semibold mb-3">Order summary</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <span>{item.name} × {item.quantity}</span>
              <span>${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-foreground/10 mt-3 pt-3 flex justify-between font-bold">
            <span>Total (display only — server recomputes)</span>
            <span>${(getCartTotal() / 100).toFixed(2)}</span>
          </div>
        </section>

        <button
          type="submit"
          className="w-full bg-foreground text-background py-4 rounded-md font-bold text-lg hover:opacity-90 transition"
        >
          Place Order
        </button>
      </form>
    </main>
  );
}
```

### Task 3.9 — Update success page to show order ID

**File:** `apps/storefront/src/app/(checkout)/checkout/success/page.tsx` (rewrite)

```typescript
export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-3xl font-bold mb-4">Order confirmed!</h1>
      {orderId && (
        <p className="text-secondary mb-6">Order #{orderId}</p>
      )}
      <p className="text-secondary mb-8">
        Thank you for your order. You will receive a confirmation shortly.
      </p>
      <a
        href="/"
        className="inline-block bg-foreground text-background px-8 py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        Continue shopping
      </a>
    </main>
  );
}
```

### Task 3.10 — Clear Zustand cart after successful order

After the server action redirects to `/checkout/success`, the Zustand cart still has items. Add a `CartClearer` client component that auto-clears on mount:

**File:** `apps/storefront/src/features/cart/ui/cart-clearer.tsx` (create)

```typescript
'use client';

import { useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';

export function CartClearer() {
  const clearCart = useCartStore(state => state.clearCart);
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}
```

Add `<CartClearer />` to the success page (import it as a client component).

### Task 3.11 — Price integrity integration test

**File:** `apps/storefront/src/features/checkout/__tests__/price-integrity.test.ts` (create)

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Simulates what the server action does:
// client sends a tampered price → server re-fetches → server price wins
describe('checkout price integrity', () => {
  it('server recomputes price regardless of client-supplied price', async () => {
    // Arrange: engine returns authoritative price of $29.99
    const mockEngine = {
      initCheckout: vi.fn().mockResolvedValue({
        cartId: 'cart-1',
        status: 'PENDING',
        _input: { email: 'a@b.com', firstName: 'A', lastName: 'B', address: '1 Main', paymentMethod: 'cod' },
        _items: [{ productId: '42', quantity: 1, slug: 'test-product' }],
      }),
      placeOrder: vi.fn().mockResolvedValue({
        id: 'order-1',
        status: 'pending',
        total: { amount_minor: 2999, currency: 'USD' },
        items: [],
        customer: { id: '0', email: 'a@b.com', firstName: 'A', lastName: 'B' },
      }),
    };

    // Act: client sends tampered price ($0.01 = 1 minor unit)
    const clientSentItems = [{ productId: '42', quantity: 1, slug: 'test-product' }];
    // (client prices are NEVER passed to server — only IDs + qty + slug)
    const session = await mockEngine.initCheckout('cart-1', {} as any, clientSentItems);
    const order = await mockEngine.placeOrder(session);

    // Assert: server price ($29.99) is what landed in the order
    expect(order.total.amount_minor).toBe(2999);
    expect(order.total.amount_minor).not.toBe(1); // tampered price rejected
  });
});
```

### Task 3.12 — Playwright E2E smoke test

**File:** `apps/storefront/e2e/checkout.spec.ts` (create)

```typescript
import { test, expect } from '@playwright/test';

test('COD checkout happy path', async ({ page }) => {
  // 1. Visit home page
  await page.goto('/');
  await expect(page).toHaveTitle(/Ecom OS/i);

  // 2. Click first product
  const firstProduct = page.locator('a[href^="/product/"]').first();
  await firstProduct.click();
  await page.waitForURL(/\/product\//);

  // 3. Add to cart
  await page.click('button:has-text("Add to Cart")');

  // 4. Open cart and go to checkout
  await page.click('button:has-text("Cart")');
  await page.click('a:has-text("Proceed to Checkout")');
  await page.waitForURL('/checkout');

  // 5. Fill checkout form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="firstName"]', 'Test');
  await page.fill('input[name="lastName"]', 'User');
  await page.fill('textarea[name="address"]', '1 Main Street, City, 12345');

  // 6. Submit
  await page.click('button:has-text("Place Order")');

  // 7. Confirm success
  await page.waitForURL(/\/checkout\/success/);
  await expect(page.locator('h1')).toContainText('Order confirmed');
});
```

---

## Phase 4 — Section 07: Account & Auth

**Estimated time:** 2–3 days
**Dependency:** Phase 3 (cart cookie pattern is reused for auth session)

### Architecture for WC Auth

WooCommerce REST auth options:
- **JWT (WPGraphQL JWT Authentication plugin):** Best for headless. Returns a JWT stored in HttpOnly cookie.
- **WC REST /customers:** Create customers, but doesn't handle login.
- **Application Passwords (WP 5.6+):** For admin use, not end-user login.

**Decision:** Use WPGraphQL JWT Authentication plugin for login. It adds `mutation Login` to the GraphQL API that returns `authToken` + `refreshToken`. Store `authToken` in an HttpOnly cookie (`ecom_auth`).

If WPGraphQL JWT is not installed: login returns an error with a clear message ("Install WPGraphQL JWT Authentication plugin").

### Task 4.1 — Auth cookie helpers

**File:** `apps/storefront/src/features/account/server/auth-actions.ts` (create)

```typescript
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';

const AUTH_COOKIE = 'ecom_auth';
const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

export async function login(formData: FormData) {
  const engine = await getEngine();
  const token = await engine.login({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, SESSION_OPTIONS);
  redirect('/account');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/');
}

export async function register(formData: FormData) {
  const engine = await getEngine();
  await engine.register({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
  });
  redirect('/account/login?registered=1');
}
```

### Task 4.2 — Update EcomEngine interface for auth

**File:** `packages/ecom-engine/src/interface.ts`

Add the auth methods:

```typescript
export interface LoginInput { email: string; password: string }
export interface RegisterInput { email: string; password: string; firstName: string; lastName: string }

export interface EcomEngine {
  // ... existing methods ...
  login(input: LoginInput): Promise<string>;           // returns session token
  logout(token: string): Promise<void>;
  register(input: RegisterInput): Promise<Customer>;
  getCustomer(token: string): Promise<Customer | null>;
  listCustomerOrders(customerId: string): Promise<Order[]>;
  getOrder(orderId: string, customerId: string): Promise<Order | null>;
}
```

Update `FakeEngine` to implement these:
```typescript
async login(input: LoginInput): Promise<string> { return 'fake-token'; }
async logout(token: string): Promise<void> {}
async register(input: RegisterInput): Promise<Customer> {
  return { id: 'fake-1', email: input.email, firstName: input.firstName, lastName: input.lastName };
}
async getCustomer(token: string): Promise<Customer | null> {
  return { id: 'fake-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' };
}
```

### Task 4.3 — Implement WC auth methods

**File:** `packages/engine-woocommerce/src/auth.ts` (rewrite)

```typescript
import { Customer, LoginInput, RegisterInput } from '@ecom-os/engine';
import { restFetch } from './rest';
import { gqlClient } from './graphql';
import { gql } from 'graphql-request';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { username: $username, password: $password }) {
      authToken
      customer { databaseId email firstName lastName }
    }
  }
`;

export async function loginGql(input: LoginInput): Promise<string> {
  try {
    const data = await gqlClient.request<any>(LOGIN_MUTATION, {
      username: input.email,
      password: input.password,
    });
    const token = data?.login?.authToken;
    if (!token) throw new Error('Login failed — no token returned');
    return token;
  } catch (err) {
    throw new Error(
      'Login failed. Ensure WPGraphQL JWT Authentication plugin is installed and configured.'
    );
  }
}

export async function registerRest(input: RegisterInput): Promise<Customer> {
  const response = await restFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name: input.firstName,
      last_name: input.lastName,
      username: input.email,
    }),
  });
  return {
    id: String(response.id),
    email: response.email,
    firstName: response.first_name ?? '',
    lastName: response.last_name ?? '',
  };
}

export async function getCustomerRest(token: string): Promise<Customer | null> {
  try {
    // With JWT token, call /customers/me or decode token for customer ID
    const response = await restFetch('/customers/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return {
      id: String(response.id),
      email: response.email,
      firstName: response.first_name ?? '',
      lastName: response.last_name ?? '',
    };
  } catch {
    return null;
  }
}

export async function getCustomerOrdersRest(customerId: string): Promise<any[]> {
  try {
    const response = await restFetch(`/orders?customer=${customerId}`);
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
}
```

### Task 4.4 — Account pages

Create the following routes under `apps/storefront/src/app/(account)/`:

```
account/page.tsx               → Hub: redirect to /account/login if no token
account/login/page.tsx         → Login form (server action: auth-actions.login)
account/register/page.tsx      → Register form (server action: auth-actions.register)
account/orders/page.tsx        → Order history (server: fetch via engine.listCustomerOrders)
account/orders/[id]/page.tsx   → Order detail (ownership check: order.customer.id === session customer id → 404 if mismatch)
```

**Account hub** (`account/page.tsx`):
```typescript
import { getSessionToken } from '@/features/account/server/auth-actions';
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import Link from 'next/link';
import { logout } from '@/features/account/server/auth-actions';

export default async function AccountPage() {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">My Account</h1>
      <p className="text-secondary mb-8">{customer.firstName} {customer.lastName} · {customer.email}</p>
      <nav className="space-y-3 mb-10">
        <Link href="/account/orders" className="block p-4 border border-foreground/10 rounded-md hover:bg-muted transition">My Orders</Link>
      </nav>
      <form action={logout}>
        <button type="submit" className="text-sm text-secondary hover:text-foreground underline">Sign out</button>
      </form>
    </main>
  );
}
```

### Task 4.5 — Auth middleware guard

**File:** `apps/storefront/src/middleware.ts` (create)

```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/account'];
const PUBLIC_AUTH = ['/account/login', '/account/register'];
const AUTH_COOKIE = 'ecom_auth';

// ponytail: simple path-prefix guard; rate limiting added in Section 10
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED.some(p => pathname.startsWith(p));
  const isPublicAuth = PUBLIC_AUTH.some(p => pathname.startsWith(p));

  if (isProtected && !isPublicAuth) {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/account/login';
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};
```

---

## Global Acceptance Checklist

Run these after completing all phases. All must pass before marking any section done.

### Section 03
- [ ] `ADDONS=` → `addons.generated.ts` imports zero addons
- [ ] `ADDONS=cod` → COD addon's `register()` is called on app boot (visible in console)
- [ ] `ADDONS=xyz` → generate-addons.ts exits with helpful error "Addon 'xyz' not found"
- [ ] `bash scripts/check-engine-imports.sh` passes with zero violations
- [ ] A plugin missing `register` or `disable` export fails the CI check

### Section 05
- [ ] `/`, `/catalog`, `/product/[slug]` render real WC data
- [ ] Product URLs have `generateStaticParams` — PDPs are pre-rendered at build time
- [ ] `revalidate: 60` on all data fetches
- [ ] `/api/revalidate?secret=XXX` returns 200 and triggers cache purge; bad secret returns 401
- [ ] `/catalog?category=slug` filters correctly
- [ ] Empty catalog shows "No products found" not a crash
- [ ] Product with no image renders without crashing
- [ ] Lighthouse Performance ≥ 90 on `/` mobile emulation
- [ ] LCP < 2.0s on `/catalog`

### Section 06
- [ ] Cart persists across browser restart (localStorage)
- [ ] Cart ID is set in an HttpOnly cookie on first add-to-cart
- [ ] Guest can complete COD checkout end-to-end; real order appears in WC admin
- [ ] Tampering `cartItems` JSON to set fake prices → server ignores client prices, uses WC prices
- [ ] `placeOrder` error does NOT clear the cart (user can retry)
- [ ] Merchant notification logged (or emailed) on order — failure does NOT block order creation
- [ ] Cart is cleared on client after successful order
- [ ] Cart cookie: `HttpOnly=true`, `SameSite=Lax`, `Max-Age=2592000`
- [ ] Playwright E2E (Home → PDP → Cart → COD → Success) passes

### Section 07
- [ ] Register creates a real WC customer
- [ ] Login stores JWT in HttpOnly cookie
- [ ] `/account` redirects to `/account/login` when not authenticated
- [ ] After login, `/account` shows customer name + email
- [ ] `/account/orders` shows only the logged-in customer's orders
- [ ] `/account/orders/[id]` with another customer's ID → 404 (not 403)
- [ ] Logout clears the auth cookie and redirects to home

---

## Notes for the Agent

1. **Run `pnpm typecheck` after every task.** TypeScript strict mode with `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` is unforgiving. Fix type errors before moving on.

2. **Run `bash scripts/check-engine-imports.sh` before committing.** If it fails, a component is importing an adapter directly — move it to `lib/engine.ts`.

3. **Never trust client prices.** The comment `// server recomputes price` in the checkout flow is a security property, not a suggestion.

4. **FakeEngine must implement every new interface method** you add to `EcomEngine`. Both TypeScript (compile-time) and `pnpm typecheck` (CI) will reject it otherwise.

5. **`brand.tokens.css` is auto-generated.** If you need to change brand colors, edit `apps/storefront/brand.config.ts` and run `pnpm dev`. Do not edit the CSS file directly.

6. **`orders.ts` `input: any` has been fixed** (Phase 0 Fix 2). Do not reintroduce `any` in the WC adapter.

7. **The `_input` and `_items` fields on `CheckoutSession`** are prefixed with `_` to signal they are internal transport fields, not part of the public contract. They exist only to carry data from `initCheckout` to `placeOrder` without changing the interface signature.
