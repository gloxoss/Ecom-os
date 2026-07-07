# Deep Dive: Data Fetching and the EcomEngine

Welcome to the comprehensive guide on data fetching within the Ecom-os ecosystem. This document is a critical reference for developers and AI agents alike, establishing the foundational rules and architectural principles for retrieving e-commerce data (products, categories, users, orders) from underlying platforms like WooCommerce or Vendure.

By the end of this 2000+ word document, you will deeply understand the `EcomEngine`, how to leverage Next.js caching, how to avoid common performance pitfalls like network waterfalls, and why we strictly forbid direct REST calls.

---

## 1. Introduction to the EcomEngine Abstraction

The `EcomEngine` is the beating heart of the Ecom-os frontend architecture. At its core, it is an interface (`packages/ecom-engine/src/interface.ts`) that defines every conceivable e-commerce operation. 

### Why Abstraction Matters
In traditional e-commerce builds, a Next.js frontend is often tightly coupled to its backend. Developers might write `fetch('https://my-wordpress.com/wp-json/wc/v3/products')` directly inside their React Server Components. While this works initially, it creates a brittle, unmaintainable codebase when the company decides to migrate from WooCommerce to Vendure, Shopify, or MedusaJS. 

Ecom-os eliminates this technical debt through the Engine pattern:
- **Unified Interface:** All data structures are normalized. A `Product` object looks exactly the same to the frontend whether it came from Vendure's GraphQL API or WooCommerce's REST API.
- **Dependency Injection:** The active engine is injected into the application based on the configuration. You simply call `const engine = await getEngine()`.
- **Security & Secret Management:** The frontend never knows the backend API keys. The engine implementation handles authenticating requests, ensuring consumer secrets and tokens never leak to the client bundle.

### The Strict Rule: No Direct Fetching
**Under no circumstances should any custom theme component, page, or hook attempt to fetch data directly from a backend URL.** 

Doing so breaks the engine contract and invalidates the entire purpose of Ecom-os. If the `EcomEngine` is missing a method you need (e.g., retrieving a custom post type from WordPress), you must extend the `EcomEngine` interface and implement the method in the respective engine package (`packages/engine-woocommerce`), rather than hardcoding the fetch in the UI.

---

## 2. Instantiating the Engine

In Next.js App Router (version 13+), you can invoke the engine directly inside your React Server Components (RSC) and Server Actions.

```tsx
import { getEngine } from '@/lib/engine';

export default async function HomePage() {
  const engine = await getEngine();
  // Use the engine...
}
```

### The Singleton Pattern
The `getEngine()` function relies on the singleton pattern. It checks environment variables (`process.env.ECOM_ENGINE`) to determine which package to load. It then instantiates the class (e.g., `WooCommerceEngine`) and caches the instance in memory. This means calling `getEngine()` 50 times across different server components during a single request has almost zero performance overhead.

---

## 3. Product Retrieval Strategies

Products are the most frequently fetched entities in any e-commerce application. The engine provides multiple methods for retrieving products, each tailored for specific use cases.

### Fetching a Single Product
When a user navigates to `/products/[slug]`, you use `engine.getProductBySlug`.

```tsx
// app/[locale]/products/[slug]/page.tsx
import { getEngine } from '@/lib/engine';
import { notFound } from 'next/navigation';

interface ProductPageProps {
  params: { slug: string; locale: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const engine = await getEngine();
  const product = await engine.getProductBySlug(params.slug);
  
  if (!product) {
    notFound();
  }

  return (
    <article className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold">{product.name}</h1>
      <p className="text-lg text-muted-foreground">{product.description}</p>
      {/* Render Price, Variants, Images */}
    </article>
  );
}
```

### Fetching Lists of Products
For catalogs, categories, or search pages, use `engine.listProducts(query)`. The `query` object is heavily typed and allows for complex filtering, sorting, and pagination.

```tsx
const { items, total, hasNextPage } = await engine.listProducts({
  category: 'shoes',
  featured: true,
  limit: 12,
  offset: 0,
  sort: 'price_asc'
});
```

#### Pagination Mechanisms
The engine standardizes on cursor-based or offset-based pagination internally but exposes a unified `limit` and `offset` (or `page`) API to the frontend. 
Always rely on the `total` and `hasNextPage` properties returned by `listProducts` to build your UI pagination components, rather than trying to calculate offsets manually.

---

## 4. Next.js Caching and Revalidation

One of the most powerful features of the Next.js App Router is its granular caching system. However, integrating this with an abstract engine requires careful consideration.

### Default Caching Behavior
By default, Next.js caches the results of `fetch()` calls indefinitely. Because the `WooCommerceEngine` uses standard Node.js `fetch` under the hood to hit the WordPress REST API, these requests are automatically cached by Next.js.

This means if you load the homepage, Next.js will cache the products. If a merchant changes a product price in WooCommerce, the Next.js frontend will still show the old price until the cache is invalidated.

### Implementing Time-Based Revalidation (ISR)
To ensure the frontend remains fresh without overwhelming the backend, we use Incremental Static Regeneration (ISR). You configure this at the route segment level or the fetch level.

Because the engine encapsulates the `fetch` calls, we rely on route segment config in our page files:

```tsx
// app/[locale]/page.tsx
export const revalidate = 3600; // Revalidate the homepage every hour

import { getEngine } from '@/lib/engine';
// ... rest of the page
```

### On-Demand Revalidation
For mission-critical data (like stock levels), waiting an hour is unacceptable. Ecom-os supports on-demand revalidation via Webhooks.

When a product is updated in Vendure or WooCommerce, the backend fires a webhook to `/api/revalidate`. This endpoint uses the Next.js `revalidateTag` or `revalidatePath` functions to immediately purge the cached data.

To support this, the `EcomEngine` attaches specific caching tags to its fetch requests:
- Tag: `products` (All products)
- Tag: `product-[id]` (Specific product)
- Tag: `categories` (All categories)

---

## 5. Preventing Network Waterfalls

A network waterfall occurs when requests are made sequentially instead of in parallel. In React Server Components, this is a common anti-pattern.

### The Anti-Pattern (Waterfall)
```tsx
export default async function CatalogPage() {
  const engine = await getEngine();
  
  // 🛑 WATERFALL: The second request waits for the first to finish
  const categories = await engine.listCategories();
  const products = await engine.listProducts({ limit: 20 });
  const capabilities = await engine.getCapabilities();
  
  return <Catalog categories={categories} products={products} />;
}
```

### The Correct Pattern (Parallel Execution)
Always use `Promise.all` when fetching multiple independent resources at the top of a page.

```tsx
export default async function CatalogPage() {
  const engine = await getEngine();
  
  // ✅ PARALLEL: All requests fire simultaneously, cutting load time drastically
  const [categories, productResult, capabilities] = await Promise.all([
    engine.listCategories(),
    engine.listProducts({ limit: 20 }),
    engine.getCapabilities()
  ]);
  
  return <Catalog categories={categories} products={productResult.items} />;
}
```

---

## 6. Real-Time Data vs. Statically Cached Data

In e-commerce, some data can be heavily cached (product descriptions, images, SEO metadata), while other data must be perfectly real-time (stock availability, pricing for logged-in B2B users, cart contents).

### The "Capability-Gated" UI Pattern
To solve the conflict between static HTML caching and dynamic pricing, Ecom-os relies on "Islands of Interactivity" or dynamic client components.

You can statically generate the shell of the product page, and then use a client component to fetch real-time stock levels.

```tsx
// 1. Statically Generated Server Component
export default async function ProductPage({ params }) {
  const engine = await getEngine();
  const product = await engine.getProductBySlug(params.slug); // Cached for 1 hour
  
  return (
    <div>
      <h1>{product.name}</h1>
      {/* 2. Dynamic Client Component for Real-Time Price/Stock */}
      <RealTimePrice displayPrice={product.price} productId={product.id} />
    </div>
  );
}
```

The `RealTimePrice` component would execute a Server Action on mount, bypassing the cache:

```tsx
'use client';
import { useEffect, useState } from 'react';
import { getRealTimeStockAction } from '@/features/products/actions';

export function RealTimePrice({ displayPrice, productId }) {
  const [price, setPrice] = useState(displayPrice);
  
  useEffect(() => {
    // Fetches live price directly from the engine without cache
    getRealTimeStockAction(productId).then(data => setPrice(data.price));
  }, [productId]);

  return <span className="font-bold">${price.toFixed(2)}</span>;
}
```

---

## 7. Error Handling and Resilience

Backend platforms go down. Rate limits are exceeded. API keys expire. The Ecom-os frontend must never crash completely when the backend fails.

### Standardized Engine Errors
The `EcomEngine` normalizes errors into a predictable structure. Every engine method will throw an `EngineError` class when it fails, which contains:
- `code`: e.g., 'NOT_FOUND', 'UNAUTHORIZED', 'RATE_LIMITED', 'BACKEND_DOWN'
- `message`: A human-readable description
- `originalError`: The raw error object for logging

### Using Error Boundaries
Next.js provides `error.tsx` files to catch errors in Server Components. We use these extensively.

```tsx
// app/[locale]/products/error.tsx
'use client';

export default function ProductsError({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <h2 className="text-2xl font-bold text-destructive">Failed to load catalog</h2>
      <p className="text-muted-foreground mt-2">
        We are experiencing difficulties connecting to the database.
      </p>
      <button 
        onClick={() => reset()}
        className="mt-6 bg-primary text-primary-foreground px-4 py-2 rounded-md"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Soft Fallbacks for Critical Paths
If a non-critical engine call fails (e.g., loading recommended products on the checkout page), you should catch the error and render a fallback, rather than crashing the whole route.

```tsx
export async function RecommendedProducts({ productId }) {
  const engine = await getEngine();
  
  try {
    const recommended = await engine.getRecommendedProducts(productId);
    return <ProductSlider products={recommended} />;
  } catch (error) {
    // Soft fallback: Log the error to Sentry, but don't crash the UI.
    console.error('Failed to load recommended products', error);
    return null; // Return empty, user won't even know it failed
  }
}
```

---

## 8. Capability Checks and the Strategy Pattern

Some backends support features that others do not. For example, WooCommerce natively supports complex tax calculations, whereas a simple headless CMS might not. Ecom-os handles this through the `engine.getCapabilities()` method.

When building a custom theme component, you must query the capabilities before attempting to render UI that relies on them.

```tsx
export async function WishlistButton({ product }) {
  const engine = await getEngine();
  const capabilities = await engine.getCapabilities();
  
  if (!capabilities.features.includes('WISHLIST')) {
    // The current active backend does not support wishlists. Do not render the button.
    return null; 
  }
  
  return <ClientWishlistToggle productId={product.id} />;
}
```

By adhering to this capability-check pattern, your custom themes become fully portable. A client can install your "Luxury Theme" on a WooCommerce backend or a Vendure backend, and the theme will gracefully downgrade its UI if certain features are missing.

---

## 9. Localized Data Fetching

Ecom-os is inherently multi-lingual. The Next.js App Router structure uses `[locale]` as the root segment. This locale string MUST be passed down to the engine for any request that involves localized content (like product names or category descriptions).

```tsx
// Correct localized fetching
export default async function LocalizedPage({ params: { locale } }) {
  const engine = await getEngine();
  
  // Pass the locale so the backend knows which language to return
  const product = await engine.getProductBySlug('red-shoes', { locale });
  
  return <h1>{product.name}</h1>;
}
```

If the underlying backend does not support multi-language natively (e.g., a standard WooCommerce install without WPML), the engine implementation (`WooCommerceEngine`) is responsible for silently ignoring the `locale` parameter and returning the default language. The frontend developer should never need to write `if (locale === 'en')` logic for data fetching.

---

## Conclusion

Mastering the `EcomEngine` is the single most important skill for an Ecom-os developer. By strictly avoiding direct REST calls, utilizing `Promise.all` for parallel fetching, leveraging Next.js caching and ISR, and gracefully handling backend failures, you ensure that the storefront remains blazing fast, highly resilient, and entirely decoupled from the underlying e-commerce infrastructure.

Your next step should be reviewing `02-CUSTOM-PAGES-ROUTING.md` to understand how this fetched data is passed down through dynamic template registries into your custom client components.
