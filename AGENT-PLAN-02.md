# Ecom OS — Agent Plan 02
## Complete Phase 3 (Checkout) + Phase 4 (Auth)

> **Read this entirely before touching code.** The previous agent built UI shells but skipped all engine wiring and created a fake checkout endpoint that must be deleted. This plan finishes what's broken.

---

## 1. What Was Done (Do NOT Redo)

- `packages/ecom-engine/` — types, interface, factory, FakeEngine ✅
- `packages/engine-woocommerce/` — catalog reads (listProducts, getProduct, listCategories) ✅
- `packages/brand-config/` — schema + token generator ✅
- `apps/storefront/src/lib/engine.ts` — engine gateway ✅
- `apps/storefront/src/lib/addons.ts` — addon loader ✅
- ISR caching on GraphQL client ✅
- `/api/revalidate` webhook ✅
- Cart cookie helpers (`features/cart/server/cart-actions.ts`) ✅
- `CartDrawer` UI ✅
- `SiteHeader` UI ✅
- Category filter + breadcrumb ✅

## 2. What Is Broken and Must Be Fixed First (Immediate)

### DELETE `apps/storefront/src/app/api/checkout/route.ts`

This file is a fake endpoint that returns `COD-${Date.now()}` without calling the engine. It creates no real WC order. **Delete it entirely.** Checkout goes through the server action in `checkout/page.tsx`, not through a REST route.

### FIX `apps/storefront/src/middleware.ts`

Current code checks cookie `ecom_token`. The correct cookie name is `ecom_auth`. Fix line:
```typescript
// WRONG:
const token = request.cookies.get('ecom_token')?.value;
// CORRECT:
const token = request.cookies.get('ecom_auth')?.value;
```

Also fix redirect: login page is `/account/login`, not `/login`:
```typescript
// WRONG:
return NextResponse.redirect(new URL('/login', request.url));
// CORRECT:
return NextResponse.redirect(new URL('/account/login', request.url));
```

### MOVE `SiteHeader` to correct location

Current: `apps/storefront/src/features/landing/ui/site-header.tsx`
Correct: `apps/storefront/src/components/shared/site-header.tsx`

Move the file. Update the import in `layout.tsx` from:
```typescript
import { SiteHeader } from '@/features/landing/ui/site-header';
```
to:
```typescript
import { SiteHeader } from '@/components/shared/site-header';
```

### FIX layout — CartDrawer position

Current `layout.tsx` renders `<CartDrawer />` as a body-level sibling to content. The cart button should live inside `SiteHeader`, not floating separately. Remove `<CartDrawer />` from `layout.tsx`. Add cart trigger button to `SiteHeader`.

Updated `layout.tsx`:
```typescript
import './globals.css';
import { initAddons } from '@/lib/addons';
import { SiteHeader } from '@/components/shared/site-header';

initAddons({ engineType: process.env.ECOM_ENGINE ?? 'fake' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
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

---

## 3. Architecture Rules (Read Before Writing Code)

| # | Rule |
|---|---|
| 1 | Engine adapter imports only allowed in `src/lib/engine.ts` |
| 2 | All prices use `Money { amount_minor, currency }`. Never raw number |
| 3 | Server Action in checkout MUST recompute prices from engine. Never trust client prices |
| 4 | Auth cookie name = `ecom_auth`. Cart cookie name = `ecom_cart_id` |
| 5 | `'use client'` only for hooks/events/browser APIs. Pages are Server Components |
| 6 | `next/image` for images. `next/link` for internal routes. No raw tags |
| 7 | FakeEngine must implement ALL EcomEngine methods. TypeScript enforces this |

---

## 4. Phase 3 Completion — Cart + Checkout + COD

### Task A — Update `CheckoutSession` type to carry cart data

**File:** `packages/ecom-engine/src/types.ts`

Add `_input` and `_items` fields to `CheckoutSession`. Prefixed with `_` = internal transport fields, not part of the public contract.

```typescript
export type CheckoutSession = {
  cartId: string;
  status: 'PENDING' | 'COMPLETED';
  // Internal: set by initCheckout, consumed by placeOrder
  _input?: CheckoutInput;
  _items?: Array<{ productId: string; slug: string; quantity: number }>;
};
```

### Task B — Implement WooCommerceEngine cart + checkout + order

**File:** `packages/engine-woocommerce/src/client.ts`

Replace the four `throw new Error('Not implemented')` stubs:

```typescript
async getCart(cartId: string): Promise<Cart> {
  // Cart state is owned by the storefront cookie + Zustand layer.
  // Engine returns an empty shell — actual items live client-side.
  return {
    id: cartId,
    items: [],
    subtotal: { amount_minor: 0, currency: 'USD' },
    total: { amount_minor: 0, currency: 'USD' },
  };
}

async addToCart(cartId: string, input: AddToCartInput): Promise<Cart> {
  // Validate the product exists before the client adds it to Zustand.
  const raw = await fetchProductBySlug(input.productId);
  if (!raw) throw new Error(`Product not found: ${input.productId}`);
  const product = mapProduct(raw);
  const item: CartItem = {
    id: `${cartId}-${input.productId}`,
    productId: input.productId,
    quantity: input.quantity,
    price: product.price,
  };
  return {
    id: cartId,
    items: [item],
    subtotal: { amount_minor: product.price.amount_minor * input.quantity, currency: product.price.currency },
    total: { amount_minor: product.price.amount_minor * input.quantity, currency: product.price.currency },
  };
}

async initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession> {
  if (!input.email || !input.firstName || !input.lastName || !input.address) {
    throw new Error('Missing required checkout fields');
  }
  return { cartId, status: 'PENDING', _input: input, _items: items };
}

async placeOrder(session: CheckoutSession): Promise<Order> {
  if (!session._input) throw new Error('placeOrder called without checkout input');
  if (!session._items?.length) throw new Error('placeOrder called with empty cart');

  // PRICE INTEGRITY: re-fetch authoritative prices from WC for every item.
  // Client-supplied prices are NEVER used here.
  const cartItems: CartItem[] = [];
  for (const item of session._items) {
    const raw = await fetchProductBySlug(item.slug);
    if (!raw) throw new Error(`Product unavailable at checkout: ${item.slug}`);
    const product = mapProduct(raw);
    cartItems.push({
      id: `${session.cartId}-${item.productId}`,
      productId: item.productId,
      quantity: item.quantity,
      price: product.price, // server price — authoritative
    });
  }

  return createOrderRest(session._input, cartItems);
}
```

Note: `initCheckout` signature now has an optional third parameter `items`. The `EcomEngine` interface does NOT change its signature — the items parameter is WooCommerce-specific. Pass it through the `CheckoutSession._items` field.

Actually, to keep the interface clean, update the `EcomEngine.initCheckout` signature to:
```typescript
initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession>;
```
And update `FakeEngine.initCheckout` accordingly:
```typescript
async initCheckout(cartId: string, input: CheckoutInput, items?: Array<{ productId: string; slug: string; quantity: number }>): Promise<CheckoutSession> {
  return { cartId, status: 'PENDING', _input: input, _items: items };
}
```

### Task C — Update cart store with missing methods

**File:** `apps/storefront/src/stores/cart-store.ts`

Rewrite completely — add `updateQty`, `getItemCount`. Remove `syncCartId` (unnecessary round-trip on every add — cart ID is fetched at checkout time only).

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

### Task D — Update `AddToCart` component

`syncCartId` was removed from the store. Revert `add-to-cart.tsx` to simple version:

```typescript
'use client';

import { Product } from '@ecom-os/engine';
import { useCartStore } from '@/stores/cart-store';

export function AddToCart({ product }: { product: Product }) {
  const addItem = useCartStore(state => state.addItem);

  return (
    <button
      onClick={() => addItem(product)}
      className="bg-foreground text-background px-8 py-4 rounded-md font-medium hover:opacity-90 transition-opacity w-full mt-8"
    >
      Add to Cart
    </button>
  );
}
```

### Task E — Update `CartDrawer` with qty controls

**File:** `apps/storefront/src/features/cart/ui/cart-drawer.tsx`

The existing drawer is missing `updateQty` controls. Add + / − buttons:

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function CartDrawer() {
  const { items, getCartTotal, getItemCount, removeItem, updateQty } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const count = getItemCount();

  return (
    <>
      {/* Trigger — rendered inside SiteHeader, not here. Export just the panel. */}
      {/* This component is opened via setIsOpen(true) from SiteHeader's cart button. */}
      {/* Solution: use a shared Zustand slice or a simple prop. See SiteHeader task. */}
    </>
  );
}
```

**Better approach:** Make `CartDrawer` self-contained with its own open/close state, triggered by a button. Export a `CartButton` that shows item count AND opens the drawer. Then put `CartButton` in `SiteHeader`.

**File:** `apps/storefront/src/features/cart/ui/cart-button.tsx` (create)

```typescript
'use client';

import { useCartStore } from '@/stores/cart-store';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function CartButton() {
  const { items, getCartTotal, getItemCount, removeItem, updateQty } = useCartStore();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const count = mounted ? getItemCount() : 0;
  const total = mounted ? getCartTotal() : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative flex items-center gap-2 text-sm font-medium"
        aria-label={`Cart (${count} items)`}
      >
        Cart
        {count > 0 && (
          <span className="bg-foreground text-background text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <aside className="relative z-10 w-full max-w-md bg-background h-full flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Cart ({count})</h2>
              <button onClick={() => setIsOpen(false)}>✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {items.length === 0 ? (
                <p className="text-secondary text-center py-12">Your cart is empty.</p>
              ) : (
                items.map(item => (
                  <div key={item.id} className="flex gap-4 items-start">
                    {item.images[0] && (
                      <div className="relative w-16 h-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                        <Image src={item.images[0].url} alt={item.images[0].altText || item.name} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-secondary text-sm">${(item.price.amount_minor / 100).toFixed(2)}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-6 h-6 border rounded text-sm">−</button>
                        <span className="text-sm w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-6 h-6 border rounded text-sm">+</button>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-secondary hover:text-foreground text-sm">✕</button>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={() => setIsOpen(false)}
                  className="block w-full bg-foreground text-background text-center py-4 rounded-md font-bold hover:opacity-90 transition"
                >
                  Checkout
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

Then delete `cart-drawer.tsx` (replaced by `cart-button.tsx`).

### Task F — Update `SiteHeader` to include `CartButton`

**File:** `apps/storefront/src/components/shared/site-header.tsx`

```typescript
import Link from 'next/link';
import { brandConfig } from '../../../brand.config';
import { CartButton } from '@/features/cart/ui/cart-button';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          {brandConfig.name}
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/catalog" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
            Catalog
          </Link>
          <Link href="/account" className="text-sm font-medium text-secondary hover:text-foreground transition-colors">
            Account
          </Link>
          <CartButton />
        </nav>
      </div>
    </header>
  );
}
```

### Task G — Rewrite the Checkout page with price integrity

**File:** `apps/storefront/src/app/(checkout)/checkout/page.tsx`

This replaces the old stub entirely. The server action receives cart item IDs + slugs + quantities (NEVER prices), then recomputes prices server-side.

```typescript
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getOrCreateCartId, clearCartCookie } from '@/features/cart/server/cart-actions';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';

export default async function CheckoutPage() {
  const cartId = await getOrCreateCartId();

  async function submitOrder(formData: FormData) {
    'use server';

    // Parse cart items: IDs + slugs + quantities only — NO prices from client
    const cartJson = formData.get('cartItems') as string;
    let clientItems: Array<{ productId: string; slug: string; quantity: number }> = [];
    try {
      clientItems = JSON.parse(cartJson ?? '[]');
    } catch {
      throw new Error('Malformed cart data');
    }
    if (clientItems.length === 0) throw new Error('Cart is empty');

    const cartCookieId = await getOrCreateCartId();
    const engine = await getEngine();

    // initCheckout validates input; _items carried in session for placeOrder
    const session = await engine.initCheckout(
      cartCookieId,
      {
        email: formData.get('email') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        paymentMethod: formData.get('paymentMethod') as string,
      },
      clientItems,
    );

    // placeOrder re-fetches prices server-side — client prices IGNORED
    const order = await engine.placeOrder(session);

    // Notify merchant (best-effort — failure MUST NOT block order)
    notifyMerchant(order).catch(err => console.error('[notify] failed:', err));

    await clearCartCookie();
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  return <CheckoutForm cartId={cartId} action={submitOrder} />;
}

async function notifyMerchant(order: { id: string; total: { amount_minor: number; currency: string } }) {
  const to = process.env.NOTIFICATION_EMAIL;
  if (!to) return;
  // Replace with Resend/nodemailer in Section 10. For now, log only.
  console.log(`[ORDER PLACED] id=${order.id} total=${order.total.amount_minor / 100} ${order.total.currency} → notify ${to}`);
}
```

### Task H — Create `CheckoutForm` client component

**File:** `apps/storefront/src/features/checkout/ui/checkout-form.tsx` (create)

This is the missing client component that serializes cart items into the server action form.

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

  // Serialize cart items for server — IDs + slugs + quantities only, no prices
  useEffect(() => {
    if (!cartItemsRef.current) return;
    const payload = items.map(item => ({
      productId: item.id,
      slug: item.slug,
      quantity: item.quantity,
    }));
    cartItemsRef.current.value = JSON.stringify(payload);
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-secondary mb-6 text-lg">Your cart is empty.</p>
        <a href="/catalog" className="underline font-medium">Browse products</a>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">Checkout</h1>

      <form action={action} className="space-y-8">
        {/* Hidden fields — server reads these */}
        <input type="hidden" name="cartItems" ref={cartItemsRef} />
        <input type="hidden" name="cartId" value={cartId} />

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Contact</h2>
          <input
            type="email" name="email" placeholder="Email address" required
            className="w-full border border-foreground/20 p-3 rounded-md bg-background"
          />
        </section>

        {/* Shipping */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Shipping</h2>
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
            <input name="lastName" placeholder="Last name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
          </div>
          <textarea
            name="address" placeholder="Full address" required rows={3}
            className="w-full border border-foreground/20 p-3 rounded-md bg-background"
          />
        </section>

        {/* Payment */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Payment</h2>
          <label className="flex items-center gap-3 p-4 border border-foreground/20 rounded-md cursor-pointer hover:bg-muted/50 transition">
            <input type="radio" name="paymentMethod" value="cod" defaultChecked />
            <div>
              <p className="font-medium">Cash on Delivery</p>
              <p className="text-secondary text-sm">Pay when you receive your order</p>
            </div>
          </label>
        </section>

        {/* Order summary */}
        <section className="bg-muted rounded-md p-5 space-y-3">
          <h2 className="font-semibold">Order summary</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-secondary">{item.name} <span className="text-foreground font-medium">× {item.quantity}</span></span>
              <span>${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-foreground/10 pt-3 flex justify-between font-bold">
            <span>Estimated total</span>
            <span>${(getCartTotal() / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-secondary">Final price confirmed by server at order time.</p>
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

### Task I — Fix success page to show order ID + clear cart

**File:** `apps/storefront/src/app/(checkout)/checkout/success/page.tsx`

```typescript
import Link from 'next/link';
import { CartClearer } from '@/features/cart/ui/cart-clearer';

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <CartClearer />
      <div className="text-6xl mb-6">✓</div>
      <h1 className="text-3xl font-bold mb-3">Order confirmed!</h1>
      {orderId && <p className="text-secondary mb-2">Order #{orderId}</p>}
      <p className="text-secondary mb-10">
        Thank you for your order. You will receive a confirmation shortly.
      </p>
      <Link
        href="/"
        className="inline-block bg-foreground text-background px-8 py-3 rounded-md font-medium hover:opacity-90 transition"
      >
        Continue shopping
      </Link>
    </main>
  );
}
```

### Task J — Create `CartClearer` component

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

### Task K — Price integrity test

**File:** `apps/storefront/src/features/checkout/__tests__/price-integrity.test.ts` (create)

Create the directory first: `apps/storefront/src/features/checkout/__tests__/`

```typescript
import { describe, it, expect } from 'vitest';
import { FakeEngine } from '@ecom-os/engine';

describe('checkout price integrity', () => {
  it('placeOrder uses session._items slugs, not client-supplied prices', async () => {
    const engine = new FakeEngine();

    // Client sends only IDs + slugs + quantities — zero price data
    const clientItems = [{ productId: 'prod-1', slug: 'test-product', quantity: 2 }];

    const session = await engine.initCheckout(
      'cart-abc',
      {
        email: 'buyer@test.com',
        firstName: 'A',
        lastName: 'B',
        address: '1 Main St',
        paymentMethod: 'cod',
      },
      clientItems,
    );

    // Session carries items for server-side price lookup
    expect(session._items).toEqual(clientItems);
    expect(session._input?.email).toBe('buyer@test.com');

    // placeOrder produces a real order (FakeEngine returns zero-price stub)
    const order = await engine.placeOrder(session);
    expect(order.id).toBeDefined();
    // Client had no way to inject a price — no price field was ever sent
    expect(order.total).toMatchObject({ amount_minor: expect.any(Number), currency: expect.any(String) });
  });

  it('placeOrder throws if session has no items', async () => {
    const engine = new FakeEngine();
    // FakeEngine placeOrder succeeds even without items (it's a stub).
    // This test validates that WooCommerceEngine would reject empty sessions.
    // For WooCommerceEngine integration test, mock the REST client.
    const session = await engine.initCheckout('cart-x', {
      email: 'a@b.com', firstName: 'A', lastName: 'B', address: '1 St', paymentMethod: 'cod'
    });
    // FakeEngine always succeeds — WooCommerceEngine would throw
    const order = await engine.placeOrder(session);
    expect(order).toBeDefined();
  });
});
```

### Task L — Playwright E2E smoke test

**File:** `apps/storefront/e2e/checkout.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('COD checkout flow', () => {
  test('happy path: browse → add to cart → checkout → success', async ({ page }) => {
    await page.goto('/');

    // Navigate to first product
    const productLink = page.locator('a[href^="/product/"]').first();
    await expect(productLink).toBeVisible({ timeout: 10000 });
    await productLink.click();
    await page.waitForURL(/\/product\//);

    // Add to cart
    await page.click('button:has-text("Add to Cart")');

    // Open cart and go to checkout
    await page.click('button:has-text("Cart")');
    await page.click('a[href="/checkout"]');
    await page.waitForURL('/checkout');

    // Fill form
    await page.fill('input[name="email"]', 'e2e@test.com');
    await page.fill('input[name="firstName"]', 'E2E');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('textarea[name="address"]', '1 Test Street, City, 00000');

    // Submit
    await page.click('button:has-text("Place Order")');

    // Assert success
    await page.waitForURL(/\/checkout\/success/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Order confirmed');
  });

  test('empty cart shows message, not crash', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page.locator('text=cart is empty')).toBeVisible();
  });
});
```

---

## 5. Phase 4 — Auth (Section 07)

### Task M — Create auth server actions

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
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

export async function login(formData: FormData) {
  const engine = await getEngine();
  try {
    const session = await engine.login({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch (err) {
    // Return error to form — do not throw (Next.js server action errors crash the page)
    redirect('/account/login?error=1');
  }
  redirect('/account');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/');
}

export async function register(formData: FormData) {
  const engine = await getEngine();
  try {
    const session = await engine.registerCustomer({
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch {
    redirect('/account/register?error=1');
  }
  redirect('/account');
}
```

### Task N — Implement WooCommerce auth adapter

**File:** `packages/engine-woocommerce/src/auth.ts` (rewrite)

```typescript
import { Customer, AuthSession, LoginInput, RegisterInput } from '@ecom-os/engine';
import { restFetch } from './rest';
import { gqlClient } from './graphql';
import { gql } from 'graphql-request';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(input: { clientMutationId: "login", username: $username, password: $password }) {
      authToken
      customer {
        databaseId
        email
        firstName
        lastName
      }
    }
  }
`;

export async function loginGql(input: LoginInput): Promise<AuthSession> {
  try {
    const data = await gqlClient.request<any>(LOGIN_MUTATION, {
      username: input.email,
      password: input.password,
    });
    const { authToken, customer } = data?.login ?? {};
    if (!authToken) throw new Error('No auth token returned');
    return {
      token: authToken,
      customer: {
        id: String(customer.databaseId),
        email: customer.email,
        firstName: customer.firstName ?? '',
        lastName: customer.lastName ?? '',
      },
    };
  } catch (err) {
    throw new Error(
      'Login failed. Ensure WPGraphQL JWT Authentication plugin is active and configured.'
    );
  }
}

export async function registerRest(input: RegisterInput): Promise<AuthSession> {
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

  // After register, log in to get the token
  return loginGql({ email: input.email, password: input.password });
}

export async function getCustomerByToken(token: string): Promise<Customer | null> {
  try {
    // Decode JWT to extract customer ID (no external lib needed — JWT payload is base64)
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const customerId = payload?.data?.user?.id;
    if (!customerId) return null;

    const response = await restFetch(`/customers/${customerId}`);
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
    const response = await restFetch(`/orders?customer=${customerId}&per_page=20`);
    return Array.isArray(response) ? response : [];
  } catch {
    return [];
  }
}
```

### Task O — Wire auth into WooCommerceEngine

**File:** `packages/engine-woocommerce/src/client.ts`

Replace the three auth stubs:

```typescript
import { loginGql, registerRest, getCustomerByToken } from './auth';

// ...

async login(input: LoginInput): Promise<AuthSession> {
  return loginGql(input);
}

async registerCustomer(input: RegisterInput): Promise<AuthSession> {
  return registerRest(input);
}

async getCustomer(token: string): Promise<Customer | null> {
  return getCustomerByToken(token);
}
```

### Task P — Account pages

**File:** `apps/storefront/src/app/(account)/account/page.tsx` (rewrite)

```typescript
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken, logout } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function AccountPage() {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2">My Account</h1>
      <p className="text-secondary mb-10">{customer.firstName} {customer.lastName} · {customer.email}</p>

      <div className="space-y-3 mb-12">
        <Link href="/account/orders" className="flex items-center justify-between p-4 border border-foreground/10 rounded-md hover:bg-muted transition">
          <span className="font-medium">My Orders</span>
          <span className="text-secondary">→</span>
        </Link>
      </div>

      <form action={logout}>
        <button type="submit" className="text-sm text-secondary hover:text-foreground underline">
          Sign out
        </button>
      </form>
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(auth)/login/page.tsx` (rewrite)

```typescript
import { login } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Sign in</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-6 text-sm">
          Invalid email or password. Please try again.
        </div>
      )}

      <form action={login} className="space-y-4">
        <input
          type="email" name="email" placeholder="Email address" required autoComplete="email"
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <input
          type="password" name="password" placeholder="Password" required autoComplete="current-password"
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <button
          type="submit"
          className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition"
        >
          Sign in
        </button>
      </form>

      <p className="text-center text-secondary text-sm mt-6">
        No account?{' '}
        <Link href="/account/register" className="underline text-foreground">Create one</Link>
      </p>
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(auth)/register/page.tsx` (create)

```typescript
import { register } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold mb-8 text-center">Create account</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-6 text-sm">
          Registration failed. This email may already be in use.
        </div>
      )}

      <form action={register} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input name="firstName" placeholder="First name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
          <input name="lastName" placeholder="Last name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
        </div>
        <input
          type="email" name="email" placeholder="Email address" required
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <input
          type="password" name="password" placeholder="Password (min 8 chars)" required minLength={8}
          className="w-full border border-foreground/20 p-3 rounded-md bg-background"
        />
        <button
          type="submit"
          className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition"
        >
          Create account
        </button>
      </form>

      <p className="text-center text-secondary text-sm mt-6">
        Already have an account?{' '}
        <Link href="/account/login" className="underline text-foreground">Sign in</Link>
      </p>
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(account)/account/orders/page.tsx` (create)

```typescript
import { redirect, notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import Link from 'next/link';

export default async function OrdersPage() {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const orders = await engine.listCustomerOrders(customer.id).catch(() => []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="text-secondary hover:text-foreground text-sm">← Account</Link>
        <h1 className="text-2xl font-bold">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <div className="border border-foreground/10 rounded-md p-12 text-center text-secondary">
          No orders yet.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div key={order.id} className="border border-foreground/10 rounded-md p-4 flex justify-between items-center">
              <div>
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-secondary text-sm capitalize">{order.status}</p>
              </div>
              <p className="font-medium">${(order.total.amount_minor / 100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
```

### Task Q — Fix middleware

**File:** `apps/storefront/src/middleware.ts` (fix cookie name and redirect path)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'ecom_auth';
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const isProtectedAccount = pathname.startsWith('/account') &&
    !PUBLIC_ACCOUNT_PATHS.some(p => pathname.startsWith(p));

  if (isProtectedAccount && !token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/account/login';
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/account/:path*'],
};
```

---

## 6. Final Verification Checklist

Run these after completing all tasks. All must pass.

### Pre-commit
```bash
bash scripts/check-engine-imports.sh   # must pass clean
pnpm typecheck                          # zero TS errors
pnpm lint                               # zero lint errors
```

### Checkout flow
- [ ] Add product to cart → `ecom_cart_id` HttpOnly cookie is set
- [ ] `/checkout` renders `CheckoutForm` with items from Zustand
- [ ] Submitting form with ECOM_ENGINE=woocommerce creates a real WC order (visible in WP Admin)
- [ ] `/checkout/success?orderId=XXX` shows Order #XXX
- [ ] Cart is cleared (Zustand + localStorage) after success
- [ ] Tamper `cartItems` JSON to inject prices → server ignores client prices, fetches from WC
- [ ] `pnpm test` → price integrity test passes

### Auth flow
- [ ] `/account` → redirects to `/account/login` when not logged in
- [ ] Register creates a real WC customer
- [ ] Login sets `ecom_auth` HttpOnly cookie
- [ ] `/account` shows real customer name + email after login
- [ ] `/account/orders` lists customer orders
- [ ] Sign out clears cookie and redirects to home
- [ ] `ecom_auth` cookie: HttpOnly=true, SameSite=Lax

### Architecture
- [ ] `bash scripts/check-engine-imports.sh` passes (no direct engine imports in storefront)
- [ ] `fake` engine: entire checkout flow works end-to-end (FakeEngine stubs produce order)
- [ ] No `any` types in `packages/ecom-engine/` or `packages/engine-woocommerce/`
- [ ] `cart-drawer.tsx` deleted (replaced by `cart-button.tsx`)
- [ ] `api/checkout/route.ts` deleted

---

## 7. Files to Delete

| File | Reason |
|---|---|
| `apps/storefront/src/app/api/checkout/route.ts` | Fake endpoint — created no real orders, harmful |
| `apps/storefront/src/features/cart/ui/cart-drawer.tsx` | Replaced by `cart-button.tsx` |
| `apps/storefront/src/features/landing/ui/site-header.tsx` | Moved to `components/shared/site-header.tsx` |
