---
name: ecom-storefront-features
description: Guide for building storefront feature modules. Use when creating catalog, PDP, cart, checkout, or account features following the feature-first architecture.
---

# Ecom OS Storefront Features Skill

## When to Use
- Building a new feature module (home, catalog, pdp, cart, checkout, account)
- Organizing files within a feature
- Connecting features to the EcomEngine
- Ensuring RSC-first, feature-first compliance

## Feature Module Structure

```
features/<feature-name>/
├── model/           # TypeScript types specific to this feature
├── data/            # Static content, constants, mock data
├── ui/              # React components (server by default)
│   ├── feature-section.tsx        # Server component
│   └── feature-section-client.tsx # Client island (only if needed)
├── hooks/           # Client-side hooks (useCart, useWishlist)
├── lib/             # Feature-specific utilities
├── server/          # Server actions, data fetching
│   └── actions.ts   # Server actions with Zod validation
└── validation/      # Zod schemas for this feature
```

## Server Component Rules

```tsx
// ✅ Default: Server Component
export default async function CatalogPage() {
  const products = await getEngine().getProducts();
  return <ProductGrid products={products} />;
}

// ✅ Client island for interactivity
// file: add-to-cart-client.tsx
'use client';
export function AddToCartButton({ productId }: Props) {
  // hooks, events, state here
}

// ❌ NEVER: mixing server and client concerns
```

## Data Fetching Pattern

```tsx
// features/catalog/server/actions.ts
'use server';
import { getEngine } from '@ecom-os/engine';
import { z } from 'zod';

const schema = z.object({
  category: z.string().optional(),
  limit: z.number().max(50).default(20),
});

export async function getProductsAction(input: unknown) {
  const { category, limit } = schema.parse(input); // Zod FIRST
  return getEngine().getProducts(limit);
}
```

## Screen Inventory Reference

| Screen | Route | Feature |
|--------|-------|---------|
| S-01 Home | `/(marketing)/` | `features/home` |
| S-10 Catalog | `/(shop)/catalog` | `features/catalog` |
| S-11 Category | `/(shop)/catalog/[category]` | `features/catalog` |
| S-12 PDP | `/(shop)/products/[slug]` | `features/pdp` |
| S-20 Cart | `/(shop)/cart` | `features/cart` |
| S-22 Checkout Address | `/(shop)/checkout/address` | `features/checkout` |
| S-23 Checkout Payment | `/(shop)/checkout/payment` | `features/checkout` |
| S-24 Confirmation | `/(shop)/checkout/confirmation` | `features/checkout` |
| S-30 Login | `/(account)/login` | `features/account` |
| S-31 Register | `/(account)/register` | `features/account` |
| S-35 Orders | `/(account)/orders` | `features/account` |

Full inventory: `pre-dev/04-screen-inventory.md`

## Performance Targets
- Lighthouse Performance ≥ 90
- LCP ≤ 2.0s on emulated mobile 3G
- Hydrated JS bundle ≤ 180 KB gzipped on catalog page
- Images: AVIF or WebP via `next/image`

## Rules
1. All data from `EcomEngine` — no direct engine imports
2. Server Components by default — `"use client"` only where required
3. Feature-first: all related code lives in the feature folder
4. Zod validation on every server action before any side effect
5. No hardcoded business strings — content from `data/` or engine
