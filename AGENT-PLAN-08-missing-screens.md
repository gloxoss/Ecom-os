# AGENT-PLAN-08 — Missing Screens + Shared Layout Shell
> **Closes the MVP gap.** After this plan, every page a real customer touches exists.
> Read this document fully before writing any code.

---

## Skills Active
- `nextjs-app-structure` — RSC-first, feature-first, no client unless needed
- `tailwind-patterns` — Tailwind v4 logical properties, no hardcoded colors
- `/ponytail` — minimum code, no speculative abstractions
- `/karpathy-guidelines` — correctness over cleverness
- `/nonstop` — ship all tasks before reporting done

---

## What Already Exists — DO NOT REDO

```
apps/storefront/src/app/[locale]/(shop)/page.tsx              ✅ home
apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx      ✅ catalog index
apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx ✅ PDP
apps/storefront/src/app/[locale]/(checkout)/checkout/page.tsx  ✅ checkout
apps/storefront/src/app/[locale]/(checkout)/checkout/success/page.tsx ✅
apps/storefront/src/app/[locale]/(account)/account/page.tsx   ✅ account hub
apps/storefront/src/app/[locale]/(account)/account/login/page.tsx ✅
apps/storefront/src/app/[locale]/(account)/account/register/page.tsx ✅
apps/storefront/src/app/[locale]/(account)/account/orders/page.tsx ✅ list
apps/storefront/src/features/catalog/ui/product-card.tsx      ✅
apps/storefront/src/features/catalog/ui/product-grid.tsx      ✅
apps/storefront/src/features/catalog/ui/product-card-skeleton.tsx ✅
apps/storefront/src/features/catalog/ui/breadcrumb.tsx        ✅ (exists, check before re-creating)
apps/storefront/src/features/cart/ui/cart-button.tsx          ✅
apps/storefront/src/lib/engine.ts                             ✅
packages/ecom-engine/src/types.ts                             ✅ (Product, Order, Category, Customer)
packages/ecom-engine/src/interface.ts                         ✅ (listCategories, getOrder, getCustomer)
```

### Key engine methods available
```typescript
engine.listProducts({ limit, categorySlug?, locale? })  → ProductListResult
engine.getProduct(slug, locale?)                         → Product | null
engine.listCategories(locale?)                           → Category[]
engine.getOrder(orderId, customerId)                     → Order | null
engine.listCustomerOrders(customerId)                    → Order[]
engine.getCustomer(token)                                → Customer | null
```

### Key types
```typescript
type Order = { id: string; status: string; total: Money; items: OrderLine[]; customer: Customer }
type OrderLine = { id: string; productId: string; name: string; quantity: number; price: Money }
type Category = { id: string; slug: string; name: string }
type Customer = { id: string; email: string; firstName: string; lastName: string }
```

---

## Architecture Laws

1. Server Components by default. `'use client'` only for interactions/hooks.
2. Feature-first: `features/<feature>/ui/<component>.tsx`.
3. `next/image` for all images. `next/link` for all internal links.
4. No hardcoded colors. Only design tokens (`text-foreground`, `text-secondary`, `bg-muted`, etc.).
5. No `any` types without `// ponytail:` justification.
6. Use `getTranslations` (server) or `useTranslations` (client) for all user-facing strings.
7. Add translation keys to ALL THREE locale files: `en.json`, `fr.json`, `ar.json`. Keys must be identical across files.
8. RTL: use logical CSS properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`) not `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-`.
9. No `console.log` — use `logger` from `@/lib/logger` if needed.

---

## Missing Translation Keys

Before coding, add these keys to ALL THREE locale JSON files at `packages/addons-i18n/locales/`:

```json
// Add to the top-level of en.json / fr.json / ar.json
{
  "catalog": {
    // existing keys +
    "filterBy": "Filter by category",
    "allProducts": "All products",
    "showing": "Showing {count} products",
    "noResults": "No products found in this category."
  },
  "cart": {
    // existing keys +
    "pageTitle": "Your Cart",
    "remove": "Remove",
    "continueShopping": "Continue shopping",
    "proceedToCheckout": "Proceed to checkout",
    "itemCount": "{count} items"
  },
  "orders": {
    // existing keys +
    "orderDetail": "Order detail",
    "placedOn": "Placed on",
    "items": "Items",
    "status": "Status",
    "total": "Total",
    "shippingTo": "Shipping to",
    "paymentMethod": "Payment method",
    "notFound": "Order not found."
  },
  "account": {
    // existing keys +
    "profile": "Profile",
    "profileSaved": "Profile saved.",
    "saveChanges": "Save changes"
  },
  "footer": {
    "tagline": "Modern e-commerce, built for growth.",
    "catalog": "Catalog",
    "account": "Account",
    "privacy": "Privacy",
    "terms": "Terms",
    "returns": "Returns"
  },
  "errors": {
    "notFound": "Page not found.",
    "backHome": "Back to home",
    "tryAgain": "Try again",
    "somethingWrong": "Something went wrong."
  }
}
```

For `fr.json` and `ar.json` — translate accordingly. Arabic is RTL; the arrow in "back" links should be `→` not `←`.

---

## Task 1 — Brand Footer

**File:** `apps/storefront/src/components/shared/brand-footer.tsx`

Server component. Simple, clean.

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function BrandFooter() {
  const t = await getTranslations('footer');
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-foreground/10 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <p className="font-bold text-lg">Logo</p>
          <p className="text-secondary text-sm mt-1">{t('tagline')}</p>
        </div>
        <nav className="flex flex-wrap gap-6 text-sm text-secondary">
          <Link href="/catalog" className="hover:text-foreground transition">{t('catalog')}</Link>
          <Link href="/account" className="hover:text-foreground transition">{t('account')}</Link>
          <Link href="/legal/privacy" className="hover:text-foreground transition">{t('privacy')}</Link>
          <Link href="/legal/terms" className="hover:text-foreground transition">{t('terms')}</Link>
          <Link href="/legal/returns" className="hover:text-foreground transition">{t('returns')}</Link>
        </nav>
        <p className="text-secondary text-xs">© {year}</p>
      </div>
    </footer>
  );
}
```

**Wire into `[locale]/layout.tsx`:**
```tsx
// After <SiteHeader /> ... {children}, add:
<BrandFooter />
```

**Acceptance:** Footer renders on home, catalog, PDP, checkout, account.

---

## Task 2 — 404 Not Found Page

**File:** `apps/storefront/src/app/[locale]/not-found.tsx`

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <main className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-8xl font-black text-foreground/10 mb-6">404</p>
      <h1 className="text-2xl font-bold mb-3">{t('notFound')}</h1>
      <Link href="/" className="inline-block mt-6 bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition">
        {t('backHome')}
      </Link>
    </main>
  );
}
```

**Also create global error boundary** `apps/storefront/src/app/[locale]/error.tsx` (client component):
```tsx
'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-8xl font-black text-foreground/10 mb-6">500</p>
      <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
      <div className="flex gap-4 justify-center mt-6">
        <button onClick={reset} className="bg-foreground text-background px-5 py-3 rounded-md font-medium hover:opacity-90 transition">
          Try again
        </button>
        <Link href="/" className="border border-foreground/20 px-5 py-3 rounded-md font-medium hover:bg-muted transition">
          Back to home
        </Link>
      </div>
    </main>
  );
}
```

---

## Task 3 — Cart Page (S-20)

**File:** `apps/storefront/src/app/[locale]/(shop)/cart/page.tsx`

Server Component wrapper — reads cart from Zustand via client island.

```
apps/storefront/src/app/[locale]/(shop)/cart/page.tsx          — server shell
apps/storefront/src/features/cart/ui/cart-page-client.tsx      — client island
```

**`cart/page.tsx`** (server):
```tsx
import { getTranslations } from 'next-intl/server';
import { CartPageClient } from '@/features/cart/ui/cart-page-client';

export default async function CartPage() {
  const t = await getTranslations('cart');
  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">{t('pageTitle')}</h1>
      <CartPageClient />
    </main>
  );
}
```

**`cart-page-client.tsx`** (`'use client'`):
- Reads from `useCartStore()`
- Shows `LineItemRow` for each item: product name, price, qty stepper (+ / −), remove button
- Shows subtotal
- Two CTAs: `Continue shopping` → `/catalog`, `Proceed to checkout` → `/checkout`
- Empty state: message + link to catalog

```tsx
'use client';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export function CartPageClient() {
  const { items, removeItem, updateQty, getCartTotal } = useCartStore();
  const t = useTranslations('cart');
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary mb-6">{t('empty')}</p>
        <Link href="/catalog" className="underline font-medium">{t('continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-foreground/10">
        {items.map(item => (
          <div key={item.id} className="flex gap-4 py-5 items-center">
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-secondary text-sm">${(item.price.amount_minor / 100).toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, item.quantity - 1)}
                className="w-8 h-8 border border-foreground/20 rounded flex items-center justify-center hover:bg-muted transition">−</button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)}
                className="w-8 h-8 border border-foreground/20 rounded flex items-center justify-center hover:bg-muted transition">+</button>
            </div>
            <p className="w-20 text-end font-medium">${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}</p>
            <button onClick={() => removeItem(item.id)}
              className="text-secondary hover:text-foreground text-sm underline">{t('remove')}</button>
          </div>
        ))}
      </div>

      <div className="border-t border-foreground/10 pt-6 mt-4 flex justify-between text-lg font-bold">
        <span>{t('total')}</span>
        <span>${(getCartTotal() / 100).toFixed(2)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link href="/catalog"
          className="flex-1 text-center border border-foreground/20 py-3 rounded-md font-medium hover:bg-muted transition">
          {t('continueShopping')}
        </Link>
        <Link href="/checkout"
          className="flex-1 text-center bg-foreground text-background py-3 rounded-md font-bold hover:opacity-90 transition">
          {t('proceedToCheckout')}
        </Link>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}
```

**Also update `cart-button.tsx`** — the "Checkout" CTA inside the drawer should link to `/cart` (cart page) not directly to `/checkout`, so user can review before checkout.

**Acceptance:** `/cart` renders cart items. Empty state shows. Qty stepper updates total. Proceed → `/checkout`. Remove works.

---

## Task 4 — Category Page (S-11)

**File:** `apps/storefront/src/app/[locale]/(shop)/catalog/[categorySlug]/page.tsx`

```tsx
import { notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getTranslations } from 'next-intl/server';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import Link from 'next/link';

export async function generateStaticParams() {
  const engine = await getEngine();
  const categories = await engine.listCategories();
  return categories.map(c => ({ categorySlug: c.slug }));
}

export const revalidate = 60;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: string; categorySlug: string }>;
}) {
  const { categorySlug, locale } = await params;
  const engine = await getEngine();
  const t = await getTranslations('catalog');

  const [categories, result] = await Promise.all([
    engine.listCategories(locale),
    engine.listProducts({ limit: 100, categorySlug, locale }),
  ]);

  const category = categories.find(c => c.slug === categorySlug);
  if (!category) notFound();

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      {/* Category nav pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/catalog"
          className="px-4 py-2 rounded-full text-sm border border-foreground/20 hover:bg-muted transition"
        >
          {t('allProducts')}
        </Link>
        {categories.map(c => (
          <Link
            key={c.id}
            href={`/catalog/${c.slug}`}
            className={`px-4 py-2 rounded-full text-sm border transition ${
              c.slug === categorySlug
                ? 'bg-foreground text-background border-foreground'
                : 'border-foreground/20 hover:bg-muted'
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
      <p className="text-secondary text-sm mb-8">{t('showing', { count: result.items.length })}</p>

      {result.items.length === 0
        ? <p className="text-secondary py-20 text-center">{t('noResults')}</p>
        : <ProductGrid products={result.items} />
      }
    </main>
  );
}
```

**Also update `catalog/page.tsx`** — add the same category nav pills at the top of the catalog index so users can filter by category:

```tsx
// In catalog/page.tsx, before rendering ProductGrid:
const categories = await engine.listCategories(locale);
// Add category pills nav (same as above, with "/" href for "All products" active)
```

**Acceptance:** `/catalog/shirts` (or any real WC category slug) renders filtered products. Category pills highlight the active one. `/catalog` shows all + all category pills.

---

## Task 5 — Order Detail Page (S-37)

**File:** `apps/storefront/src/app/[locale]/(account)/account/orders/[orderId]/page.tsx`

```tsx
import { redirect, notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const t = await getTranslations('orders');
  const order = await engine.getOrder(orderId, customer.id).catch(() => null);
  if (!order) notFound();

  // Guard: customer can only see their own orders
  if (order.customer?.id && order.customer.id !== customer.id) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account/orders" className="text-secondary hover:text-foreground text-sm">{t('back')}</Link>
        <h1 className="text-2xl font-bold">{t('order')}{orderId}</h1>
      </div>

      {/* Status + total */}
      <div className="border border-foreground/10 rounded-md p-5 mb-6 flex justify-between items-center">
        <div>
          <p className="text-sm text-secondary uppercase tracking-wide">{t('status')}</p>
          <p className="font-semibold capitalize mt-1">{order.status}</p>
        </div>
        <div className="text-end">
          <p className="text-sm text-secondary uppercase tracking-wide">{t('total')}</p>
          <p className="font-bold text-lg mt-1">
            ${(order.total.amount_minor / 100).toFixed(2)} {order.total.currency}
          </p>
        </div>
      </div>

      {/* Line items */}
      {order.items.length > 0 && (
        <section className="mb-6">
          <h2 className="font-semibold mb-3">{t('items')}</h2>
          <div className="divide-y divide-foreground/10 border border-foreground/10 rounded-md">
            {order.items.map((line: any) => (
              <div key={line.id} className="flex justify-between items-center px-4 py-3">
                <div>
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-secondary">× {line.quantity}</p>
                </div>
                <p className="font-medium">${((line.price.amount_minor * line.quantity) / 100).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shipping */}
      {order.customer && (
        <section>
          <h2 className="font-semibold mb-2">{t('shippingTo')}</h2>
          <p className="text-secondary text-sm">
            {order.customer.firstName} {order.customer.lastName} · {order.customer.email}
          </p>
        </section>
      )}
    </main>
  );
}
```

**Also update `orders/page.tsx`** — make each order row a `<Link href={`/account/orders/${order.id}`}>` so the list is clickable.

**Acceptance:** Click any order in the list → renders order detail. Visiting another customer's order ID → 404. No auth → redirect to login.

---

## Task 6 — Profile Page (S-35 — basic)

**File:** `apps/storefront/src/app/[locale]/(account)/account/profile/page.tsx`

```
apps/storefront/src/app/[locale]/(account)/account/profile/page.tsx  — server shell
apps/storefront/src/features/account/ui/profile-form.tsx              — client island
apps/storefront/src/features/account/server/profile-actions.ts        — server actions
```

**`profile-actions.ts`:**
```typescript
'use server';
import { z } from 'zod';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from './auth-actions';
import { redirect } from 'next/navigation';

const ProfileSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export async function updateProfile(formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const parsed = ProfileSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });
  if (!parsed.success) return { error: 'Invalid input' };

  // ponytail: WC REST PUT /customers/{id} — requires getCustomer to get the ID first
  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  // Update via WC REST (updateCustomer not yet on EcomEngine interface — see note below)
  // For v1: log the intent, redirect with success param
  // TODO: add engine.updateCustomer(id, { firstName, lastName }) to interface in v1.1
  redirect('/account/profile?saved=1');
}
```

**Note on `updateProfile`:** `EcomEngine` interface doesn't have `updateCustomer` yet. For v1, the profile page renders the current data read-only with a note. Add `updateCustomer` to the interface in v1.1 when WC REST PUT /customers/{id} is needed. Don't add it to the interface now — YAGNI.

**`profile/page.tsx`:**
```tsx
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const t = await getTranslations('account');
  const { saved } = await searchParams;

  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-secondary hover:text-foreground text-sm">← {t('title')}</Link>
        <h1 className="text-2xl font-bold">{t('profile')}</h1>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-md mb-6 text-sm">
          {t('profileSaved')}
        </div>
      )}

      <div className="space-y-4 border border-foreground/10 rounded-md p-5">
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('firstName')}</p>
          <p className="font-medium">{customer.firstName}</p>
        </div>
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('lastName')}</p>
          <p className="font-medium">{customer.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-secondary uppercase tracking-wide mb-1">{t('email')}</p>
          <p className="font-medium">{customer.email}</p>
        </div>
      </div>

      <p className="text-xs text-secondary mt-4 text-center">
        To update your profile, please contact support or use your account portal.
      </p>
    </main>
  );
}
```

**Also update `account/page.tsx`** — add a Profile link alongside the Orders link:
```tsx
<Link href="/account/profile" className="...">
  <span className="font-medium">{t('profile')}</span>
  <span className="text-secondary">→</span>
</Link>
```

**Acceptance:** `/account/profile` shows name + email. Auth guard works. Link from account hub.

---

## Task 7 — Catalog with Category Pills (update existing page)

**Update `apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx`** to add category navigation at the top.

```tsx
import { getTranslations } from 'next-intl/server';
import { getEngine } from '@/lib/engine';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import Link from 'next/link';

export default async function CatalogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('catalog');
  const engine = await getEngine();

  const [result, categories] = await Promise.all([
    engine.listProducts({ limit: 100, locale }),
    engine.listCategories(locale),
  ]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-6">{t('title')}</h1>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="px-4 py-2 rounded-full text-sm bg-foreground text-background">{t('allProducts')}</span>
          {categories.map(c => (
            <Link
              key={c.id}
              href={`/catalog/${c.slug}`}
              className="px-4 py-2 rounded-full text-sm border border-foreground/20 hover:bg-muted transition"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <p className="text-secondary text-sm mb-8">{t('showing', { count: result.items.length })}</p>
      <ProductGrid products={result.items} />
    </main>
  );
}
```

---

## Task 8 — Legal Static Pages

Create four static pages with identical structure. Content is placeholder — merchants fill it in.

**Files:**
```
apps/storefront/src/app/[locale]/(legal)/legal/privacy/page.tsx
apps/storefront/src/app/[locale]/(legal)/legal/terms/page.tsx
apps/storefront/src/app/[locale]/(legal)/legal/returns/page.tsx
```

All three follow the same pattern:

```tsx
// privacy/page.tsx
export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 prose prose-neutral">
      <h1>Privacy Policy</h1>
      <p className="text-secondary">Last updated: {new Date().getFullYear()}</p>
      <p>This privacy policy will be updated before go-live. Please contact the store owner for details.</p>
    </main>
  );
}
```

These don't need i18n yet — they're placeholder text that gets replaced per client.

---

## Task 9 — Orders List Clickable Rows

**Update `apps/storefront/src/app/[locale]/(account)/account/orders/page.tsx`:**

Change the `<div>` wrapping each order to `<Link href={`/account/orders/${order.id}`}>`:

```tsx
<Link
  key={order.id}
  href={`/account/orders/${order.id}`}
  className="border border-foreground/10 rounded-md p-4 flex justify-between items-center hover:bg-muted transition"
>
  <div>
    <p className="font-medium">{t('order')}{order.id}</p>
    <p className="text-secondary text-sm capitalize">{order.status}</p>
  </div>
  <div className="flex items-center gap-4">
    <p className="font-medium">${(order.total.amount_minor / 100).toFixed(2)}</p>
    <span className="text-secondary text-sm">→</span>
  </div>
</Link>
```

---

## Pre-Completion Checklist

Run through every item before reporting done.

**Footer:**
- [ ] Footer renders on `http://localhost:3000/`
- [ ] Footer renders on `/catalog`, `/account`, `/checkout`
- [ ] All footer links are correct (no 404s except legal pages which are stubs)

**404:**
- [ ] Visit `http://localhost:3000/this-does-not-exist` → shows 404 page (not raw Next.js 404)
- [ ] 404 page has "Back to home" link

**Cart page:**
- [ ] `/cart` renders cart items from store
- [ ] Empty state shows with "Browse products" link
- [ ] `+` / `−` buttons update quantities
- [ ] Remove button removes item
- [ ] Total updates correctly
- [ ] "Proceed to checkout" goes to `/checkout`

**Category page:**
- [ ] `/catalog/[any-valid-slug]` renders filtered products
- [ ] Active category is highlighted in pills
- [ ] Invalid category slug → 404
- [ ] `/catalog` shows all categories as pills

**Order detail:**
- [ ] Click order in list → renders detail page
- [ ] Shows status, total, line items
- [ ] Direct URL with someone else's orderId → 404
- [ ] No auth → redirect to login

**Profile:**
- [ ] `/account/profile` shows customer name + email
- [ ] No auth → redirect to login
- [ ] Link from account hub works

**Legal pages:**
- [ ] `/legal/privacy` renders (placeholder text)
- [ ] `/legal/terms` renders
- [ ] `/legal/returns` renders

**Translation keys:**
- [ ] All new keys exist in `en.json`, `fr.json`, `ar.json`
- [ ] `pnpm test` (i18n key parity test) passes

**Build:**
- [ ] `pnpm --filter storefront build` succeeds

---

## Session Report Template

```
## AGENT-PLAN-08 Session Report
**Status:** COMPLETE / PARTIAL

### Tasks Completed
- [ ] Task 1 — Footer (BrandFooter)
- [ ] Task 2 — 404 + Error pages
- [ ] Task 3 — Cart page (S-20)
- [ ] Task 4 — Category page (S-11)
- [ ] Task 5 — Order detail (S-37)
- [ ] Task 6 — Profile page (S-35 basic)
- [ ] Task 7 — Catalog with category pills
- [ ] Task 8 — Legal static pages
- [ ] Task 9 — Orders list clickable rows

### Files Created
<list>

### Files Modified
<list>

### Build
pnpm --filter storefront build: [pass/fail]

### i18n key parity test
pnpm test: [pass/fail]

### Issues Encountered
<any deviations, workarounds, or missing engine methods>

### What's NOT Done (and why)
<list>
```
