# ECO-405 Completion Report: Canonical URLs, Sitemap, Robots, Structured Data, Facet Indexing Policy, and Locale/RTL

## Executive Summary

- **Task**: ECO-405 (Canonical URLs, sitemap, robots, product/category structured data, correct indexing policy for facets/search, language/RTL framework if enabled.)
- **Executor**: `runtime-cleanup`
- **Lane**: `experience`
- **Tool**: `codex`
- **Base Commit**: `4c06772461da75848c9a19dcd997bf866e5d2f7f`
- **Status**: Implemented, verified with unit tests and typechecks, ready for independent verification.

---

## Changed Files & Architecture

All changes reside strictly within claimed file paths (`apps/storefront`, `docs/ecomos/evidence/ECO-405`):

1. [`apps/storefront/src/lib/seo/config.ts`](../../../apps/storefront/src/lib/seo/config.ts):
   - **Canonical Site URL Resolution (`resolveSiteUrl`)**:
     - Resolves canonical base URL from `NEXT_PUBLIC_SITE_URL` / `SITE_URL` with safe fallback to `http://localhost:3000`.
     - Validates http/https protocol and throws on malformed or insecure URLs (`ftp://`, `javascript:`, etc.).
     - Strips trailing slashes to enforce consistent path joining.
   - **Canonical URL Builder (`buildCanonicalUrl`)**:
     - Builds clean, unparameterized URLs for resources (`/product/${slug}`, `/catalog/${categorySlug}`, etc.).
     - Strips tracking queries, facet filters, search terms, pagination, and hashes so canonical points strictly to the authoritative representation.
     - Handles multi-locale path prefixes when i18n routing is active.
   - **Facet & Search Filter Detection (`hasFacetOrFilterParams`)**:
     - Inspects search query parameters (`q`, `search`, `category`, `brand`, `min_price`, `max_price`, `sort`, `filter_*`, `page > 1`).
   - **Robots Indexing Policy (`resolveRobotsPolicy`)**:
     - Standard public pages: `{ index: true, follow: true }`.
     - Faceted / filtered / search query pages: `{ index: false, follow: true }` — allows search crawlers to discover product links without indexing combinatorial facet permutations.
     - Private / removed pages: `{ index: false, follow: false }`.

2. [`apps/storefront/src/lib/seo/product.ts`](../../../apps/storefront/src/lib/seo/product.ts):
   - **Product Metadata (`buildProductMetadata`)**:
     - Returns Next.js `Metadata` with page title, clean description, OpenGraph tags, canonical alternate, and alternate language links (`hreflang`).
     - Removed or unpurchasable out-of-stock products are marked with `noindex`.
   - **Schema.org Product JSON-LD (`buildProductJsonLd`)**:
     - Generates valid `@type: "Product"` schema.
     - Truthful pricing: derives decimal price from minor currency units (`amount_minor / 100`).
     - Real stock availability: maps engine inventory status (`IN_STOCK` -> `https://schema.org/InStock`, `OUT_OF_STOCK` -> `https://schema.org/OutOfStock`, `ON_BACKORDER` -> `https://schema.org/PreOrder`). Refuses to advertise false offers.
     - Includes SKU, image list, Brand, and Offer condition.
   - **Schema.org Category BreadcrumbList JSON-LD (`buildCategoryJsonLd`)**:
     - Generates valid `@type: "BreadcrumbList"` schema linking Home and Category.

3. [`apps/storefront/src/components/seo/json-ld.tsx`](../../../apps/storefront/src/components/seo/json-ld.tsx):
   - Server-rendered `<JsonLd>` script component rendering `type="application/ld+json"` safely.

4. [`apps/storefront/src/app/robots.ts`](../../../apps/storefront/src/app/robots.ts):
   - App Router `robots.ts` metadata route.
   - Disallows `/api/`, `/*/cart`, `/*/checkout`, `/*/order`, `/*/quote`, `/*/account`, and `/*/search`.
   - Declares canonical sitemap location `${siteUrl}/sitemap.xml`.

5. [`apps/storefront/src/app/sitemap.ts`](../../../apps/storefront/src/app/sitemap.ts):
   - App Router `sitemap.ts` metadata route.
   - Dynamically discovers published public categories and products from `getEngine()`.
   - Enumerates public static pages (`/`, `/catalog`, `/about-us`, `/contact-us`, `/stores`, `/legal/terms`, `/legal/privacy`).
   - Excludes private checkout, order tracking, and RFQ quote routes.
   - Emits multi-locale alternate language links for each entry when i18n is enabled.

6. [`apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx`](../../../apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx):
   - Uses `buildProductMetadata` in `generateMetadata` for truthful metadata and canonical URL.
   - Injects `<JsonLd data={jsonLd} />` in the page body.

7. [`apps/storefront/src/app/[locale]/(shop)/catalog/[categorySlug]/page.tsx`](../../../apps/storefront/src/app/[locale]/(shop)/catalog/[categorySlug]/page.tsx):
   - Exports `generateMetadata` computing canonical category URL and applying `noindex, follow` when facet/page filters are active.
   - Injects `<JsonLd data={jsonLd} />` for BreadcrumbList structured data.

8. [`apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx`](../../../apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx):
   - Exports `generateMetadata` computing canonical catalog URL and applying `noindex, follow` on filtered views.

9. [`apps/storefront/src/app/[locale]/(shop)/search/page.tsx`](../../../apps/storefront/src/app/[locale]/(shop)/search/page.tsx):
   - Exports `generateMetadata` setting `robots: { index: false, follow: true }` for all search queries.

10. [`apps/storefront/src/lib/seo/__tests__/seo.test.ts`](../../../apps/storefront/src/lib/seo/__tests__/seo.test.ts) (11 tests):
    - Tests URL resolution, protocol validation, trailing slash normalization.
    - Tests canonical URL derivation and filter stripping.
    - Tests facet and filter param detection.
    - Tests robots policy matrix (public vs faceted vs private).
    - Tests Product metadata and JSON-LD schema with genuine price and stock.
    - Tests Category BreadcrumbList schema.
    - Tests robots.txt and sitemap route outputs.

11. [`apps/storefront/e2e/seo.spec.ts`](../../../apps/storefront/e2e/seo.spec.ts):
    - Playwright test specification verifying canonical tag, robots.txt disallow rules, and sitemap completeness.

---

## Verification Commands & Observed Results

1. **Storefront Unit & SEO Tests**:
   ```bash
   node ./node_modules/vitest/vitest.mjs run apps/storefront/src/lib/seo apps/storefront/src/features/catalog apps/storefront/src/features/content
   ```
   - **Result**: `5 passed (5)` test files, `38 passed (38)` tests.

2. **Storefront TypeScript Typecheck**:
   ```bash
   node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit
   ```
   - **Result**: `0 errors`.

---

## Architectural Invariants Adherence

- **Search Engine Truthfulness**: Never advertises false prices, currency symbols, or stock status in Schema.org or OpenGraph metadata.
- **Faceted Indexing Hygiene**: Filters, sorting, search queries, and multi-faceted discovery URLs are marked `noindex, follow` to prevent search engine indexing bloat while allowing link crawl equity to reach canonical product pages.
- **No Scope Escape**: All edits are contained within `apps/storefront` and `docs/ecomos/evidence/ECO-405`.
