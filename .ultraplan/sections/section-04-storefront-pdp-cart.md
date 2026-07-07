# Section 04: Storefront PDP & Cart

## Overview
Build the Product Details Page (PDP) and the shopping cart system. The PDP needs to handle variant selection (sizes, colors) and image galleries. The shopping cart state will be managed entirely on the client using `Zustand` with local storage persistence to avoid unnecessary server round-trips and bloat.

## Risk: yellow - Client state management
Zustand is lightweight, but hydrating persisted state in Next.js App Router requires careful handling to avoid React hydration mismatches between the server-rendered HTML and the client state.

## Dependencies
- **Depends on:** section-03
- **Blocks:** section-05
- **Parallel batch:** 4

## TDD Test Stubs
- Test: PDP renders correctly with all product variants and main images.
- Test: Selecting a different variant updates the price and SKU.
- Test: "Add to cart" updates the global Zustand cart state immediately.
- Test: Cart drawer slides open correctly.
- Test: Cart state persists across page reloads without hydration errors.

## Tasks

<task type="auto" id="04-01">
  <name>Build Zustand Cart Store</name>
  <files>apps/storefront/src/stores/cart-store.ts</files>
  <action>
    Implement a Zustand store with `persist` middleware for the shopping cart. Include actions like `addItem`, `removeItem`, `updateQuantity`, and `clearCart`. Ensure proper TypeScript types for `CartItem`.
  </action>
  <verify>Write a simple test or log to verify the store updates state correctly.</verify>
  <done>Global cart state management is ready.</done>
</task>

<task type="auto" id="04-02">
  <name>Create Hydration-Safe Wrapper</name>
  <files>apps/storefront/src/components/ClientOnly.tsx</files>
  <action>
    Create a `ClientOnly` wrapper component to render cart items safely on the client side, preventing hydration mismatches caused by `localStorage`.
  </action>
  <verify>Use the component and check browser console for hydration warnings.</verify>
  <done>Hydration mismatch risks are mitigated.</done>
</task>

<task type="auto" id="04-03">
  <name>Build PDP Page</name>
  <files>apps/storefront/src/app/(shop)/product/[slug]/page.tsx</files>
  <action>
    Implement the dynamic PDP route. Fetch single product data via `ecomEngine.getProduct(slug)`. Display the image gallery, title, description, and price. Add variant selection state.
  </action>
  <verify>Navigate to a product page and verify data loads correctly.</verify>
  <done>Shoppers can view detailed product information.</done>
</task>

<task type="auto" id="04-04">
  <name>Build Add to Cart & Cart Drawer</name>
  <files>apps/storefront/src/components/AddToCart.tsx, apps/storefront/src/components/CartDrawer.tsx</files>
  <action>
    Build the `AddToCart` button client component that interacts with the Zustand store. Build a slide-out `CartDrawer` using Radix UI Dialog primitives to display current cart contents and total price.
  </action>
  <verify>Click Add to Cart; drawer should open and display the new item.</verify>
  <done>Shoppers can add items and view their cart.</done>
</task>

<task type="auto" id="04-05">
  <name>Implement WC Single Product Adapter</name>
  <files>packages/engine-woocommerce/src/index.ts, packages/ecom-engine/src/interface.ts</files>
  <action>
    Add `getProduct(slug)` to `EcomEngine`. Implement it in the WooCommerce adapter using WPGraphQL to fetch the specific product details including variations.
  </action>
  <verify>Ensure PDP renders real WooCommerce data.</verify>
  <done>PDP is wired to the backend engine.</done>
</task>
