# Section 11: V1 Addons & Dynamic Checkout

## Overview
This section implements the final WooCommerce Dynamic Checkout integration alongside 10 high-leverage storefront addons (Search, Reviews, Wishlist, SEO, Analytics, etc.). Following ponytail guidelines, these are implemented using native Next.js features, local storage, and standard WooCommerce REST API endpoints to avoid over-engineering.

## Risk: [yellow] - Multiple touchpoints across the frontend

## Dependencies
- Depends on: section-06 (Checkout Base)
- Blocks: None
- Parallel batch: 3

## TDD Test Stubs
- Test: Dynamic payment methods load from WC API
- Test: Wishlist items persist in LocalStorage
- Test: JSON-LD metadata renders in product `<head>`

## Tasks

<task type="auto" id="11-01">
  <name>Dynamic Checkout Integration</name>
  <files>packages/ecom-engine/src/interface.ts, packages/engine-woocommerce/src/client.ts, apps/storefront/src/features/checkout/ui/checkout-form.tsx</files>
  <action>
    Add `getPaymentMethods` and `getShippingMethods` to EcomEngine. Implement them in WooCommerce client using standard endpoints `/wp-json/wc/v3/payment_gateways` and `/wp-json/wc/v3/shipping/zones`. Update `checkout-form.tsx` to map these dynamically instead of hardcoding COD. ponytail: skipped complex caching, add when checkout latency is an issue.
  </action>
  <verify>Ensure `CheckoutForm` renders payment/shipping methods fetched from the local WooCommerce instance.</verify>
  <done>Checkout dynamically relies on WC REST API for configuration.</done>
</task>

<task type="auto" id="11-02">
  <name>Faceted Search</name>
  <files>apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx</files>
  <action>
    Read Next.js `searchParams` for `min_price`, `max_price`, and `sort`. Pass these to the WooCommerce products fetcher. ponytail: skipped state-management libraries, rely purely on URL search params for state.
  </action>
  <verify>Changing URL params updates the product grid.</verify>
  <done>URL-driven filtering works seamlessly with RSC.</done>
</task>

<task type="auto" id="11-03">
  <name>Related Products & Reviews</name>
  <files>apps/storefront/src/features/product/ui/product-details.tsx</files>
  <action>
    Extract `related_ids` from the WooCommerce product response and render a basic "Related Products" grid. Fetch and render basic text reviews from WC API. ponytail: skipped custom review submission forms, read-only reviews for now.
  </action>
  <verify>PDP displays a grid of related products.</verify>
  <done>Related products and reviews are visible on PDP.</done>
</task>

<task type="auto" id="11-04">
  <name>Wishlist</name>
  <files>apps/storefront/src/hooks/use-wishlist.ts, apps/storefront/src/features/product/ui/product-card.tsx</files>
  <action>
    Create a `useWishlist` hook backed by `localStorage`. Add a heart icon to `product-card.tsx` to toggle wishlist state. ponytail: skipped backend DB sync, add when cross-device persistence is demanded.
  </action>
  <verify>Clicking heart saves item to local storage and persists on reload.</verify>
  <done>Wishlist functions entirely client-side.</done>
</task>

<task type="auto" id="11-05">
  <name>Headless Blog</name>
  <files>apps/storefront/src/app/[locale]/(blog)/blog/page.tsx</files>
  <action>
    Create a simple RSC page that fetches from `/wp-json/wp/v2/posts` and renders a list of articles. ponytail: skipped advanced category filtering, just a flat list of recent posts.
  </action>
  <verify>Navigating to /blog shows posts from WordPress.</verify>
  <done>Blog page successfully reads standard WP posts.</done>
</task>

<task type="auto" id="11-06">
  <name>SEO JSON-LD & Analytics</name>
  <files>apps/storefront/src/app/[locale]/layout.tsx, apps/storefront/src/features/product/ui/product-details.tsx</files>
  <action>
    Inject `<script type="application/ld+json">` for Organization schema in Layout, and Product schema in PDP. Add a placeholder `dataLayer.push` function for tracking. ponytail: skipped bloated SEO libraries, native Next.js scripts are sufficient.
  </action>
  <verify>View Source shows valid application/ld+json scripts.</verify>
  <done>Structured data is present for Google crawlers.</done>
</task>

<task type="auto" id="11-07">
  <name>Store Locator</name>
  <files>apps/storefront/src/app/[locale]/stores/page.tsx</files>
  <action>
    Create a static page listing physical store locations with standard `mailto:` and `tel:` links. ponytail: skipped Google Maps API and interactive locators, add when >5 locations exist.
  </action>
  <verify>Stores page renders text addresses correctly.</verify>
  <done>Locations are clearly listed to the user.</done>
</task>
