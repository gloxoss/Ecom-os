# Section 05 — Storefront Home · Catalog · PDP

> **Batch 4 · Risk: yellow · Deps: 01, 02 · Tasks: 5 · Blueprint: Step 8 · Screens: S-01, S-10, S-11, S-12, S-13**

## Why this section exists
FR-001..005 + the "premium feel" UX bar (Discovery Q). This is where the universal storefront proves itself against real WC data and hits the Lighthouse ≥ 90 / LCP < 2.0s bar (NFR-001..004). The current storefront is a "Hello Ecom OS" placeholder — this section replaces it.

## Requirements covered
- **FR-001** home/catalog/PDP/cart rendered as RSC by default
- **FR-002** `next/image` for rasters, `next/link` for routes
- **FR-003** Lighthouse Performance ≥ 90 (emulated mobile 3G)
- **FR-004** LCP ≤ 2.0s on mid-tier mobile / 3G
- **FR-005** no hardcoded business strings in JSX (content from `features/*/data/` or engine)
- **NFR-002/003** catalog LCP ≤ 2.0s, hydrated JS ≤ 180KB gzipped

## Tasks
1. **Feature modules** — scaffold `features/{home,catalog,pdp}` each with the `nextjs-app-structure` layout: `{model,data,ui,hooks,lib}`. Home (S-01): `Hero`, `FeaturedProductsRail`, `CategoryGrid`, `NewsletterBlock`, `BrandFooter`. Catalog index (S-10) + Category (S-11): `BreadcrumbBar`, `FilterSidebar` (desktop sidebar / mobile bottom sheet per Discovery Q), `SortBar`, `ProductGrid`, `Pagination`.
2. **PDP (S-12)** — `BreadcrumbBar`, `ProductGallery`, `VariantSelector`, `PriceBlock`, `StockBadge`, `AddToCartButton` (client island), `ProductTabs`, `RelatedProductsRail`. Wire to `engine.getProduct(slug, locale)` via RSC. Handle all PDP states: success, loading, error, 404, out-of-stock, backorder, variant-required, variant-unavailable (screen inventory §2).
3. **GSAP animation islands** — hero entrance, scroll-triggered product rail fade-in. **Server wrapper + client island** pattern (Cahier §8.4): the animated section is a `"use client"` `*-client.tsx` using `@gsap/react` `useGSAP`; the rest stays RSC. Localize heavy animation to keep RSC intact + bundle small.
4. **Engine data wiring** — connect each page to the (hardened) `EcomEngine` via `lib/engine.ts`. Implement the WC `products.ts`/`mappers.ts` reads for real (WPGraphQL query → `Product[]`), replacing the current mock. Add ISR caching: `revalidate: 60` on catalog reads, `generateStaticParams` for PDPs where feasible.
5. **State coverage** — implement empty / loading / error skeletons for every interactive screen (S-11, S-12, S-13). Lighthouse pass: run on `/` emulated mobile 3G, iterate until ≥ 90 perf + LCP < 2.0s. Verify hydrated JS ≤ 180KB gzip via bundle analyzer.

## Inputs
- Section 01 (hardened interface), Section 02 (brand tokens), WC sandbox with sample data
- Screen inventory §1–2, Data-flow Flow 1 (catalog read path)

## Outputs
- `apps/storefront/src/app/(marketing)/{page,catalog/{page,[slug]}/page,products/[slug]/page,search/page}.tsx`
- `apps/storefront/src/features/{home,catalog,pdp}/...`
- `packages/engine-woocommerce/src/{products.ts,mappers.ts,categories.ts}` (real WPGraphQL reads)
- `packages/ui/` (shared primitives: `ProductGrid`, `BreadcrumbBar`, `Pagination`, etc.)

## Acceptance Criteria
- [ ] Home, catalog index, category, PDP, search all render real WC sandbox data
- [ ] Lighthouse Performance ≥ 90 on `/` (emulated mobile 3G)
- [ ] LCP < 2.0s on catalog + PDP
- [ ] Hydrated JS on catalog ≤ 180KB gzipped
- [ ] All PDP edge states (out-of-stock, variant-unavailable, 404) render correctly
- [ ] No raw `<img>`/`<a>` in committed code; no hardcoded business strings

## Skills to load
`nextjs-app-structure`, `next-best-practices` (RSC, ISR, `generateStaticParams`), `nextjs-shadcn`, `gsap-react`, `gsap-scrolltrigger`, `gsap-performance`, `nextjs-seo` (JSON-LD Product), `tailwind-patterns`, `frontend-design`, `woocommerce` (WPGraphQL queries)

## Risks / notes
- **Risk:** GSAP animations vs Lighthouse ≥ 90. Mitigation: animation in isolated client islands, `useGSAP` cleanup, no layout-thrashing properties, defer non-critical animation. This is the core tension of the whole project (PRD Risks #1).
- **Risk:** ISR + on-demand revalidation wiring. The webhook receiver itself is Section 10, but the `revalidateTag`/`revalidatePath` calls on the read path belong here.
- RTL is **not** this section's concern (deferred to §08) but use CSS logical properties proactively to save rework.
