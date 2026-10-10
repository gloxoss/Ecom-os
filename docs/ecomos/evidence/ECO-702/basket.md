# ECO-702: QuoteBasket & /devis Builder Implementation Analysis

## 1. Architecture & Isolation
The RFQ quotation basket (`QuoteBasket`) is engineered to be strictly decoupled from the WooCommerce purchasing cart:
- **Dedicated Storage Domain**: State is encapsulated in `useQuoteStore` (storage key: `quote-storage`), entirely isolated from `useCartStore` (`cart-storage`).
- **Exact Variation Keying**: Line items are keyed via `createItemKey(productId, variationId)`, formatting as `${productId}:${variationId}`. Distinct variations of the same product create separate lines with distinct quantities and custom notes.
- **Off-State Route Barrier**: When the `quotes` addon is disabled, navigating to `/devis` is caught by `isAddonActive('quotes')` in `apps/storefront/src/app/[locale]/(shop)/devis/page.tsx`, returning HTTP 404 (`notFound()`).

## 2. Accessible UI Experience
The `/devis` page and `QuoteBuilder` component provide:
- Responsive desktop and mobile layout with a sticky bottom summary sheet.
- Itemized quantity controls (+ / -) and inline notes editing for custom bespoke specifications.
- Full keyboard accessibility and semantic ARIA labeling.
