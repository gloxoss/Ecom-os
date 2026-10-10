# ECO-405 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `runtime-cleanup`, experience lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `f8ac00cc47558be45c85c593ec1ff9678f9fc614`.
- Base: `4c06772461da75848c9a19dcd997bf866e5d2f7f`.
- Executor evidence: `docs/ecomos/evidence/ECO-405/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-405/verification.md`).

## Verdict

PASS for canonical URL resolution, sitemap generation, robots.txt crawl directives, Schema.org Product and BreadcrumbList structured data, facet/search indexing policies (`noindex, follow`), and locale alternate links at commit `f8ac00cc47558be45c85c593ec1ff9678f9fc614`.

## Executed verification commands

1. Storefront test suite:
   - `node ./node_modules/vitest/vitest.mjs run apps/storefront/src/lib/seo apps/storefront/src/features/catalog apps/storefront/src/features/content`
   - Exit: 0.
   - Result: 38 passed across 5 test files.
   - Verified:
     - `resolveSiteUrl`: Enforces http/https protocol, normalizes trailing slashes, and fails safely on invalid URLs.
     - `buildCanonicalUrl`: Strips query parameters, facet filter params, search keywords, and hashes so canonical points strictly to the authoritative URL.
     - `hasFacetOrFilterParams`: Detects search terms (`q`, `search`), categories, brands, price filters, attributes, and secondary pages (`page > 1`).
     - `resolveRobotsPolicy`: Enforces `{ index: false, follow: true }` on faceted search and filter permutations, `{ index: false, follow: false }` on private/removed paths, and `{ index: true, follow: true }` on standard public content.
     - `buildProductMetadata` & `buildProductJsonLd`: Generates genuine prices from minor currency units (`amount_minor / 100`), maps true stock availability (`IN_STOCK` vs `OUT_OF_STOCK`), avoids advertising false offers, and produces valid Schema.org Product markup.
     - `buildCategoryJsonLd`: Generates valid Schema.org BreadcrumbList markup.
     - `robots`: Disallows `/api/`, `/*/cart`, `/*/checkout`, `/*/order`, `/*/quote`, `/*/account`, `/*/search`, and publishes `${siteUrl}/sitemap.xml`.
     - `sitemap`: Enumerates public static pages, published categories, and active products while completely omitting private transactions, checkout, order tracking, and RFQ quotes.

2. TypeScript typecheck:
   - `node ./node_modules/typescript/bin/tsc -p apps/storefront/tsconfig.json --noEmit`
   - Exit: 0.
   - Result: 0 errors across storefront workspace.

3. Git scope containment:
   - `git diff --stat 4c06772461da75848c9a19dcd997bf866e5d2f7f..f8ac00cc47558be45c85c593ec1ff9678f9fc614`
   - Result: Exactly 12 files modified/added in commit `f8ac00cc47558be45c85c593ec1ff9678f9fc614`:
     - `apps/storefront/e2e/seo.spec.ts`
     - `apps/storefront/src/app/[locale]/(shop)/catalog/[categorySlug]/page.tsx`
     - `apps/storefront/src/app/[locale]/(shop)/catalog/page.tsx`
     - `apps/storefront/src/app/[locale]/(shop)/product/[slug]/page.tsx`
     - `apps/storefront/src/app/[locale]/(shop)/search/page.tsx`
     - `apps/storefront/src/app/robots.ts`
     - `apps/storefront/src/app/sitemap.ts`
     - `apps/storefront/src/components/seo/json-ld.tsx`
     - `apps/storefront/src/lib/seo/__tests__/seo.test.ts`
     - `apps/storefront/src/lib/seo/config.ts`
     - `apps/storefront/src/lib/seo/product.ts`
     - `docs/ecomos/evidence/ECO-405/report.md`
   - Zero scope escape.

4. Invariant & Separation Assessment:
   - **Search Engine Truthfulness**: Real price and availability derived directly from WooCommerce product data.
   - **Faceted Search Crawl Hygiene**: Search queries and filtered catalog permutations do not trigger indexing bloat.
   - **No Leakage of Private Capabilities**: Cart, checkout, order lookup, and RFQ endpoints are excluded from sitemaps and blocked in robots.txt.
