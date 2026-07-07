# Section 03: Storefront Home & Catalog

## Overview
Implement the landing page and the product catalog page. The home page features a GSAP-animated hero section and featured products. The catalog page implements the product grid with server-side filtering via the WPGraphQL API. The UI must follow the minimal, premium aesthetic using Radix primitives.

## Risk: yellow - Animations and external API reads
Creating smooth 60fps GSAP animations within Next.js App Router (RSC) requires careful component boundary management. Connecting to WPGraphQL requires precise query definitions.

## Dependencies
- **Depends on:** none (can use mocked engine interface initially)
- **Blocks:** section-04, section-06
- **Parallel batch:** 3

## TDD Test Stubs
- Test: Hero section GSAP animation fires only on the client side without throwing SSR hydration errors.
- Test: The catalog page requests product data from the engine via `ecomEngine.getProducts()`.
- Test: Filtering products modifies the URL search parameters and triggers a server-side re-render.
- Test: Empty states ("No products found") display elegantly.

## Tasks

<task type="auto" id="03-01">
  <name>Define engine product interfaces</name>
  <files>packages/ecom-engine/src/interface.ts</files>
  <action>
    Add `Product`, `Category`, and `FilterOptions` types to the core interface. Add `getProducts(filters)` and `getCategories()` methods to the `EcomEngine` interface.
  </action>
  <verify>The engine interface correctly types product queries.</verify>
  <done>The engine boundary for product fetching is defined.</done>
</task>

<task type="auto" id="03-02">
  <name>Implement WooCommerce product adapter</name>
  <files>packages/engine-woocommerce/src/index.ts</files>
  <action>
    Implement `getProducts` and `getCategories` using `graphql-request` against a WooCommerce WPGraphQL endpoint. Map the WPGraphQL response types to the standard `Product` interface.
  </action>
  <verify>Mock an API call and verify it returns a valid `Product[]` array.</verify>
  <done>The WooCommerce adapter can fetch products.</done>
</task>

<task type="auto" id="03-03">
  <name>Build GSAP Hero component</name>
  <files>apps/storefront/src/components/Hero.tsx</files>
  <action>
    Create a "use client" component that uses `@gsap/react` `useGSAP` hook. Build a premium hero section that fades in and scales elements on initial load. Ensure it works beautifully in light and dark modes.
  </action>
  <verify>Load the component in the browser; animation should be smooth with no hydration errors.</verify>
  <done>A premium animated hero section is ready.</done>
</task>

<task type="auto" id="03-04">
  <name>Build Product Card & Grid</name>
  <files>apps/storefront/src/components/ProductCard.tsx, apps/storefront/src/components/ProductGrid.tsx</files>
  <action>
    Build a reusable `ProductCard` component displaying image, title, price. Use `next/image` for optimization. Build a `ProductGrid` to display them responsively (1 column mobile, 3/4 columns desktop).
  </action>
  <verify>Render mock products and verify responsiveness across breakpoints.</verify>
  <done>Products are displayed correctly.</done>
</task>

<task type="auto" id="03-05">
  <name>Assemble Home and Catalog Pages</name>
  <files>apps/storefront/src/app/(shop)/page.tsx, apps/storefront/src/app/(shop)/catalog/page.tsx</files>
  <action>
    Create the RSC page routes. Fetch data directly inside the Server Component using `ecomEngine`. Pass the data to the UI components. Implement search params handling in `/catalog` for filtering.
  </action>
  <verify>Navigate between Home and Catalog pages. Filtering should update URL and results.</verify>
  <done>The core browsing flows are complete.</done>
</task>
