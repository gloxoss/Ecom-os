# Deep Dive: Cart Operations and the Checkout Flow

Welcome to the third technical manual in the Ecom-os Theme documentation series. This extensive 2000+ word document focuses exclusively on the most critical phase of any e-commerce application: mutating state (adding to cart) and securing the checkout pipeline.

A beautiful custom theme is worthless if the user cannot securely place an order. Because Ecom-os separates the UI (React/Next.js) from the underlying backend logic (WordPress/Vendure), interacting with the cart and checkout requires strict adherence to security rules, capability checks, and centralized state management.

---

## 1. The Global Cart State

In Ecom-os, the cart state is considered **Globally Persistent but Locally Optimistic**. 

Because a user might have a cart cookie linked to a WooCommerce session, or an active order ID linked to a Vendure session, the frontend must not attempt to manually stitch together the raw backend cart structures.

### The Standardized `Cart` Object
When you request the cart, Ecom-os normalizes the backend structure into a standard `Cart` interface.

```tsx
export interface CartItem {
  id: string; // The line item ID, NOT the product ID
  productId: string;
  name: string;
  quantity: number;
  price: number; // Unit price
  total: number; // Unit price * quantity
  image?: string;
  options?: Record<string, string>; // e.g., Size: L, Color: Red
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  isCartValid: boolean;
}
```

### Retrieving the Cart
In Server Components, you can fetch the cart state using the `EcomEngine` along with the Next.js `cookies()` helper.

```tsx
import { getEngine } from '@/lib/engine';
import { cookies } from 'next/headers';

export async function CartSummary() {
  const engine = await getEngine();
  const sessionId = cookies().get('ecom_session')?.value;
  
  if (!sessionId) return <p>Your cart is empty.</p>;
  
  const cart = await engine.getCart(sessionId);
  
  return (
    <div>
      <p>Items: {cart.items.length}</p>
      <p>Total: {cart.currency} {cart.total}</p>
    </div>
  );
}
```

---

## 2. Mutating the Cart via Server Actions

Next.js App Router strongly encourages using **Server Actions** for data mutation. Ecom-os provides pre-built server actions in `apps/storefront/src/features/cart/server/actions.ts` that safely handle cart mutations.

**You must never attempt to build your own direct REST API mutations inside custom client components.**

### The `addToCartAction`
This is the most heavily used action. It handles verifying the product, calling the engine, and updating the session cookie automatically.

```tsx
// packages/themes/src/clients/luxury/components/LuxuryBuyButton.tsx
'use client';

import { useState } from 'react';
import { addToCartAction } from '@/features/cart/server/actions';
import { Product } from '@ecom-os/engine';

export function LuxuryBuyButton({ product }: { product: Product }) {
  const [isAdding, setIsAdding] = useState(false);
  
  const handlePurchase = async () => {
    setIsAdding(true);
    
    // Call the standardized Ecom-os Server Action
    const result = await addToCartAction({ 
      productId: product.id, 
      quantity: 1,
      // Optional variation IDs or selected options
      options: { Size: 'L' } 
    });
    
    setIsAdding(false);
    
    if (result.success) {
      // Trigger a cart drawer open event here
    } else {
      // Show toast notification with error
      console.error(result.error);
    }
  };
  
  return (
    <button 
      onClick={handlePurchase} 
      disabled={isAdding}
      className="bg-primary text-primary-foreground uppercase tracking-widest px-8 py-4"
    >
      {isAdding ? 'Securing Item...' : 'Acquire Now'}
    </button>
  );
}
```

### Handling Optimistic Updates
For a fast, app-like feel, you shouldn't wait for the server action to finish before updating the UI. Use React's `useOptimistic` hook, or global state (Zustand) to immediately increment the cart counter, then quietly sync with the server action response.

```tsx
'use client';

import { useCartStore } from '@/features/cart/client/store';
import { addToCartAction } from '@/features/cart/server/actions';

export function FastBuyButton({ product }) {
  const addOptimisticItem = useCartStore(state => state.addOptimisticItem);
  
  const handleBuy = async () => {
    // 1. Immediately update UI
    addOptimisticItem(product);
    
    // 2. Sync with Server
    await addToCartAction({ productId: product.id, quantity: 1 });
  };
  
  return <button onClick={handleBuy}>Buy</button>;
}
```

---

## 3. The Checkout Pipeline Lifecycle

The checkout pipeline is significantly more complex than the cart. It involves shipping calculation, tax generation, discount validation, and payment tokenization.

To ensure PCI compliance and security, **the core checkout lifecycle is immutable and must not be bypassed by custom themes.**

### The 4 Phases of Checkout

#### Phase 1: Initialization (`initCheckout`)
When a user navigates to `/checkout`, the page controller calls `engine.initCheckout(cartId)`. This locks the cart, preventing price changes mid-checkout, and generates a secure `CheckoutSession` token.

#### Phase 2: Contact & Shipping Collection
The UI collects the user's email, phone, and shipping address. The theme may heavily customize the look of these forms, but the payload MUST be submitted via the `updateShippingAddressAction`.

```tsx
// This action calls engine.setShippingAddress() and recalculates taxes
const updatedSession = await updateShippingAddressAction({
  firstName: 'John',
  lastName: 'Doe',
  address1: '123 Fake St',
  city: 'New York',
  country: 'US',
  zip: '10001'
});
```

#### Phase 3: Shipping Method & Discounts
Once the address is set, the engine calculates available shipping methods. The user selects one. Concurrently, the user may apply discount codes or loyalty points.

```tsx
const updatedSession = await applyDiscountCodeAction('SUMMER2026');
const finalSession = await setShippingMethodAction('express_delivery_id');
```

#### Phase 4: Payment & Placement (`placeOrder`)
This is the critical phase. Depending on the `EcomEngine` capabilities, this either involves redirecting to an off-site gateway (like CMI in Morocco) or processing a tokenized credit card via Stripe Elements.

When the user clicks "Place Order", the `placeOrderAction` is called.

```tsx
const orderResult = await placeOrderAction({
  checkoutSessionId: session.id,
  paymentMethod: 'stripe_token_xyz123'
});

if (orderResult.success) {
  // Clear local cart state and redirect to success page
}
```

---

## 4. Styling the Checkout in Custom Themes

While you cannot change the underlying 4-phase lifecycle, you have immense flexibility in how the checkout looks.

### Approach A: The CSS Variable Override
If the structural layout of the default Ecom-os checkout works for your client, the easiest approach is to simply let your theme's CSS variables apply to the default checkout components. The shadcn/ui components used in the checkout will automatically adopt your theme's `primary`, `background`, `radius`, and `font` tokens.

### Approach B: Structural Override via Template Registry
If a client demands a completely bespoke checkout (e.g., a one-page accordion checkout instead of a multi-step wizard), you can replace the entire checkout route using the Template Registry pattern discussed in `02-CUSTOM-PAGES-ROUTING.md`.

```tsx
// packages/themes/src/clients/luxury/theme.ts
export const luxuryTheme = {
  // ...
  templates: {
    'checkout.view': LuxuryOnePageCheckout
  }
};
```

When building `LuxuryOnePageCheckout.tsx`, you must assemble your own forms, but you **MUST connect them to the standard Server Actions**. 

```tsx
// Example of a completely custom checkout form piece
'use client';
import { useCheckoutState } from '@/features/checkout/client/store';
import { setShippingMethodAction } from '@/features/checkout/server/actions';

export function LuxuryShippingSelector() {
  const { session, updateSession } = useCheckoutState();
  
  const handleSelect = async (methodId) => {
    // 1. Show elegant loading spinner
    // 2. Call secure server action
    const newSession = await setShippingMethodAction(methodId);
    // 3. Update local state to reflect new totals
    updateSession(newSession);
  };
  
  return (
    <div className="grid grid-cols-2 gap-4">
      {session.availableShippingMethods.map(method => (
        <button 
          key={method.id} 
          onClick={() => handleSelect(method.id)}
          className={`border p-4 ${session.shippingMethodId === method.id ? 'border-primary' : 'border-muted'}`}
        >
          {method.name} - {method.price}
        </button>
      ))}
    </div>
  );
}
```

---

## 5. Handling Loyalty Points at Checkout

As implemented in Ecom-os Phase 5, the checkout pipeline seamlessly integrates the EPIOSO loyalty point system. 

When a user is logged in, the `CheckoutSession` payload will automatically include a `loyaltyBalance` property and an `applicableLoyaltyDiscount` value. 

### The Loyalty Widget
Themes can provide a custom `LoyaltyWidget` in the checkout. To apply points, call the specific server action:

```tsx
import { redeemLoyaltyPointsAction } from '@/features/loyalty/server/actions';

export function LuxuryLoyaltyRedemption({ pointsAvailable, discountValue }) {
  const handleRedeem = async () => {
    await redeemLoyaltyPointsAction(pointsAvailable);
  };
  
  return (
    <div className="bg-secondary p-6 rounded-md flex justify-between items-center">
      <span className="text-secondary-foreground font-serif tracking-wide">
        You have {pointsAvailable} points to redeem for {discountValue} off.
      </span>
      <button onClick={handleRedeem} className="text-sm border border-primary px-4 py-2">
        Apply Now
      </button>
    </div>
  );
}
```

By keeping the UI loosely coupled to these highly secure Server Actions, you ensure that the complex calculations regarding maximum redemption values, cart minimums, and tax recalculations are handled exclusively by the server environment, never exposing vulnerabilities to the browser.

---

## Conclusion

The Cart and Checkout flow is the most complex segment of Ecom-os. By standardizing the interfaces (`Cart`, `CheckoutSession`) and locking the mutation logic behind Next.js Server Actions, we protect the structural integrity of the application.

Developers building custom themes are granted the freedom to completely restructure the visual layout of the checkout, provided they faithfully execute the required Server Actions in sequence. This guarantees that whether a customer is using a minimal theme backed by Vendure, or a luxury theme backed by WooCommerce, their financial transaction is processed flawlessly and securely.

Proceed to `04-CMS-AND-LOCALIZATION.md` to understand how to handle the heavy lifting of static text, translations, and dynamic headless content.
