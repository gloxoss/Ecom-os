# ECO-1212 — Reusable Themes, Editable CMS Fallbacks, Truthful SEO & Measured Budgets

**Task:** `ECO-1212` · **Stage:** `B` · **Owner/Agent:** `sprint-rfq-1` · **Lane:** `commerce` · **Branch:** `sprint-b/rfq-ECO-1202`

---

## Executive Summary

Task **ECO-1212** completes the multi-tenant reusable theme registry, validated client brand profiles with server secret protection, resilient WordPress CMS content fallbacks with XSS sanitization, truthful search engine optimization (canonical URLs, staging robots protection, Schema.org product offers), and measured accessibility, performance, and keyboard navigation budgets.

All four acceptance criteria specified in the EcomOS stabilization plan are verified by automated unit, integration, and browser tests:
- **559/559 Vitest unit tests** passing across 65 test files.
- **Zero TypeScript typecheck errors** across `packages/themes`, `packages/brand-config`, and `apps/storefront`.
- **18/18 Browser budget properties PASS** via real Chromium measurements in `scripts/measure-storefront.ts`.
- **19/19 Node contract tests** passing in `clients/paraloca`.
- **8/8 Staging UAT tests** passing in `apps/storefront/e2e/paraloca-uat.spec.ts`.

---

## Acceptance Criteria & Delivered Solutions

### 1. Reusable Themes, Design Tokens & Validated Client Profiles
- **Multi-Tenant Theme Registry (`packages/themes/src/index.ts`)**:
  - Registered all six client themes in `themeRegistry`:
    - `default`: Baseline neutral theme
    - `paraloca`: Clinical medical-lifestyle editorial theme (radius `0.75rem`, primary `#171817`, accent `#276C61`, 3-column grid, pills variant selector)
    - `demo-2`: Compact minimalist theme (radius `0.25rem`, primary slate `222.2 47.4% 11.2%`, dropdown variant selector, simple footer)
    - `minimal`: Stripped-back monochromatic layout
    - `luxury`: High-contrast dark luxury layout
    - `angelina`: Parisian heritage confectionery palette
  - `getTheme(name)` safely returns the requested theme with a robust fallback to `defaultTheme`.
  - `themeConfigToCssVars(config)` deterministically generates CSS custom properties (`--background`, `--foreground`, `--primary`, `--secondary`, `--accent`, `--radius`, `--font-sans`, etc.) without `undefined` or invalid numbers.
- **Client Profile & Brand Customization (`packages/brand-config`)**:
  - `BrandConfigSchema` supports client identity customization without modifying commerce code:
    - Custom logos (`light`, `dark`, `favicon`)
    - Colors (normalized to HSL via `hexToHsl`)
    - Typography (sans, serif, mono)
    - Navigation menus via validated `NavigationItemSchema` (`label`, `href`, `badge`, `isExternal`)
    - Commerce defaults (`supportedLocales: ['fr', 'ar', 'en']`, `defaultCurrency: 'MAD'`)
  - **Server-Only Secret Protection (`toPublicClientProfile`)**:
    - Internal backend hostnames (`wooCommerceUrl`, `wordpressUrl`, `searchUrl`) are strictly scrubbed when projecting client profile manifests for client-side consumption.
    - `EnvironmentUrlsSchema` enforces `isSafeUrl`, forbidding URLs with embedded credentials (`https://user:pass@...`) and rejecting unauthorized parameters.
  - **Architectural Invariants**:
    - Customer accounts remain strictly disabled (`capabilities.customerAccounts = false`).
    - Only certified payment methods (`allowedPaymentMethods: ['cod']`) are permitted.

### 2. Real WordPress Homepage & Brand Content with Honest Fallbacks
- **Resilient Section Resolution (`apps/storefront/src/features/content/ui/page-sections.tsx`)**:
  - `resolvePageContent(cmsSections, fallbackData)` seamlessly merges live WordPress CMS data over local fallback defaults.
  - **Offline / Failure Fallback**: When CMS queries fail or return `null`, the storefront renders 100% of fallback sections (`homeData`).
  - **Partial Configuration Fallback**: If WordPress only configures the hero banner, remaining sections (`collection`, `featureBlocks`, `story`, `process`, `quote`, `brew`, `reviews`, `location`) retain their complete local fallback content.
  - **Honest Whitespace & Empty Fallback (`cleanText`)**: If CMS fields contain only empty strings or whitespace (`'   '`), or if all story paragraphs in CMS are blank, the resolver falls back to default content rather than rendering blank headings or broken empty sections.
  - **Strict XSS Sanitization**: All incoming CMS markup is filtered via `sanitizeCmsMarkup()`, neutralizing `<script>`, `onerror`, and malicious inline handlers.

### 3. Truthful SEO, Indexing Policy & Schema.org Structured Data
- **Canonical URL Construction (`apps/storefront/src/lib/seo/config.ts`)**:
  - `buildCanonicalUrl(path, options)` resolves clean canonical URLs stripping tracking parameters (`utm_*`), search facets (`q`, `category`, `sort`), pagination (`page=2`), and fragment identifiers (`#`).
- **Facet and Filter Protection**:
  - `hasFacetOrFilterParams()` identifies parameterized navigation, directing `resolveRobotsPolicy()` to return `{ index: false, follow: true }`. This allows search spiders to discover linked products while preventing duplicate indexing of faceted search permutations.
- **Explicit Staging & Coming-Soon Indexing Policy**:
  - `isStagingEnvironment(siteUrl)` detects staging hostnames (`staging.paraloca.ma`, `preview-*.ma`) and explicit environment flags (`NEXT_PUBLIC_IS_STAGING=true`, `NEXT_PUBLIC_INDEXING_POLICY=noindex`).
  - Staging `resolveRobotsPolicy({ isStaging: true })` strictly enforces `{ index: false, follow: false }`.
  - Staging `robots.txt` outputs `disallow: '/'` for all user agents, forbidding crawler entry.
  - Staging `sitemap.xml` returns an empty array `[]` to prevent premature catalog exposure.
- **Truthful Schema.org Product Offers (`apps/storefront/src/lib/seo/product.ts`)**:
  - Converts minor currency units to genuine decimal prices (`amount_minor / 100`) matching WooCommerce HPOS authority.
  - Reflects truthful availability (`https://schema.org/InStock`, `https://schema.org/OutOfStock`, `https://schema.org/PreOrder`).
  - Unpriced or quote-only products omit the `offers` property entirely, refusing to broadcast false zero-price offers (`0.00 MAD`).

### 4. Accessibility, Performance, Keyboard & Mobile Budgets
- **Real Browser Chromium Measurements (`scripts/measure-storefront.ts`)**:
  - Ran against served storefront (`http://localhost:3100`):
    - **Text Contrast Ratio**: `16.28:1` on `/` and `/catalog` (budget: `>= 4.5:1` WCAG AA). **PASS**.
    - **Touch Target Sizes**: Smallest interactive target is `44px` with 0 elements below `44px` (satisfies both WCAG 2.5.5 AAA `44px` and WCAG 2.5.8 AA `24px` floor). **PASS**.
    - **Keyboard Tab Traversal**: 12/12 real Tab presses moved focus; 12/12 showed visible focus indicators. **PASS**.
    - **Security Response Headers**: Content-Security-Policy present, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security: max-age=15552000`. **PASS**.
    - **Navigation Timing**: DOMContentLoaded `195ms` on `/catalog` and `315ms` on `/` (budget: `<= 20,000ms`). **PASS**.
  - Overall status: **PASS** across 18 measured properties.

### 5. Client Facts & Medical Legal Disclaimers
- In `clients/paraloca/content-approval.md`, all importer and merchant disclosures (legal entity, address, phone number, VAT rates, local service) remain explicitly cataloged as **UNAPPROVED** pending authentic merchant sign-off.
- Zero invented registration numbers (no fabricated DMP, CE, or FDA certificates).
- Zero clinical superiority claims.
- Mandatory medical disclaimers (`ne remplace pas une prescription médicale`) enforced on all equipment guides.

---

## Automated Verification Matrix

| Category | Test Suite / Script | Command | Result |
| :--- | :--- | :--- | :--- |
| **Themes Registry** | `packages/themes/src/__tests__/themes.test.ts` | `pnpm vitest run packages/themes` | **9/9 PASS** (18ms) |
| **Brand Config Precedence** | `packages/brand-config/src/__tests__/theme-profile-isolation.test.ts` | `pnpm vitest run packages/brand-config` | **32/32 PASS** (65ms) |
| **CMS Page Fallbacks** | `apps/storefront/src/features/content/__tests__/page-sections.test.ts` | `pnpm vitest run apps/storefront/src/features/content` | **5/5 PASS** (7ms) |
| **SEO, Robots & Schema** | `apps/storefront/src/lib/seo/__tests__/seo.test.ts` | `pnpm vitest run apps/storefront/src/lib/seo` | **15/15 PASS** (13ms) |
| **Full Workspace Tests** | Vitest Full Suite (65 files) | `pnpm test` | **559/559 PASS** (9.4s) |
| **TypeScript Typecheck** | Themes, Brand-Config & Storefront | `npx tsc --noEmit -p ...` | **0 errors (Exit 0)** |
| **Browser Budgets** | `scripts/measure-storefront.ts` | `npx tsx scripts/measure-storefront.ts` | **18/18 PASS** |
| **ParaLoca Contracts** | `clients/paraloca/*.test.ts` | `npx tsx --test clients/paraloca/*.test.ts` | **19/19 PASS** |
| **Staging UAT** | `apps/storefront/e2e/paraloca-uat.spec.ts` | `npx tsx --test apps/storefront/e2e/paraloca-uat.spec.ts` | **8/8 PASS** |

---

## Changed Files

1. `packages/themes/src/index.ts`: Registered `paralocaTheme`, exported theme constants, added to `themeRegistry`.
2. `packages/themes/src/__tests__/themes.test.ts`: Added multi-tenant theme tests, token validation, and CSS variable generation assertions.
3. `packages/brand-config/src/schema.ts`: Added `NavigationItemSchema`, exported `NavigationItem` type, added `navigation` to `BrandConfigSchema`.
4. `packages/brand-config/src/precedence.ts`: Added `DEFAULT_NAVIGATION_LINKS` and resolved brand navigation in `resolveBrandConfiguration`.
5. `packages/brand-config/src/client-profile.ts`: Re-exported `ConfigurationValidationError`.
6. `packages/brand-config/src/__tests__/theme-profile-isolation.test.ts`: Added tests for brand profile customization, theme switching, and server secret stripping.
7. `apps/storefront/src/features/content/ui/page-sections.tsx`: Added `cleanText` helper ensuring whitespace and empty CMS inputs honestly fall back to defaults.
8. `apps/storefront/src/features/content/__tests__/page-sections.test.ts`: Added test cases for whitespace and empty array fallbacks.
9. `apps/storefront/src/lib/seo/config.ts`: Added `isStagingEnvironment` and updated `resolveRobotsPolicy` to support staging indexing protection.
10. `apps/storefront/src/lib/seo/product.ts`: Omitted fake `offers` from Schema.org Product data when product price is undefined.
11. `apps/storefront/src/app/robots.ts`: Applied `disallow: '/'` when operating in staging environments.
12. `apps/storefront/src/app/sitemap.ts`: Returned empty sitemap array `[]` when operating in staging environments.
13. `apps/storefront/src/lib/seo/__tests__/seo.test.ts`: Added tests for staging detection, staging robots/sitemap behavior, and unpriced product handling.
14. `docs/ecomos/evidence/ECO-1212/report.md`: This comprehensive evidence report.
