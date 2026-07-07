# Section 08 — i18n Addon + RTL

> **Batch 6 · Risk: yellow · Deps: 03, 05 · Tasks: 5 · Blueprint: Steps 12, 14 · Locale flow restored to v1 scope**

## Why this section exists
FR-060..065: the i18n addon is **core v1** (pre-dev PRD F-10 RICE 54, F-11 RTL RICE 100.8), not "soon after launch" as the original UltraPlan PRD demoted it. It's a real `packages/addons-i18n` package registered through the §03 loader, with JSON dictionaries, locale routing, and full RTL for Arabic.

## Requirements covered
- **FR-060** JSON file per locale at `addons/i18n/locales/{locale}.json`
- **FR-061** per-locale URL prefixes (`/fr`, `/ar`, `/en`)
- **FR-062** locale detection: URL prefix → cookie → `Accept-Language` → default
- **FR-063** `dir="rtl"` for Arabic; CSS logical properties so layouts mirror
- **FR-064** missing key → default locale value + dev console warning
- **FR-065** merchant edits strings without redeploy (WC: companion WP plugin — *deferred to a follow-up; admin editor is optional for first deploy*)
- **NFR-050/051** all UI strings sourced from dictionaries; `Intl` for date/currency/number

## Tasks
1. **i18n addon package** — `packages/addons-i18n/{register.ts,disable.ts,context.ts,locales/{fr,ar,en}.json}`. `register(ctx)` mounts locale routing + provides a `t()` helper. Satisfies the §03 addon contract (register + disable). All three default locales ship per SC-008.
2. **Locale routing + middleware** — per-locale URL prefixes. Choose `next-intl` (RESEARCH.md recommends it; mature, App-Router-native) over hand-rolled middleware. Detection order: URL → cookie → `Accept-Language` → `DEFAULT_LOCALE`. Validate locale against configured list; unknown → 404 (SR-VAL-003), not silent fallback.
3. **RTL + logical properties** — `dir="rtl"` on `<html>` for Arabic. Audit + replace every directional CSS (`margin-left`, `text-left`, `left:`, etc.) with logical properties (`margin-inline-start`, `text-start`, `inset-inline-start`) across `features/*` + `components/*`. Tailwind v4 supports logical utilities natively.
4. **Dictionary plumbing** — replace hardcoded strings (introduced in §05/§06/§07) with `t()` calls. Missing key → default locale (en or fr) value + dev warning (FR-064). `Intl.NumberFormat`/`DateTimeFormat` for currency/date/number per locale (NFR-051).
5. **RTL visual verification** — Playwright screenshot tests for S-01, S-12, S-22 in `ar` locale confirming no broken alignment (no left-anchored UI in AR). Manual review pass.

## Inputs
- Section 03 (addon loader — i18n registers through it), Section 05 (storefront strings to localize)
- ADR-007, FR-060..065, screen inventory

## Outputs
- `packages/addons-i18n/{register.ts,disable.ts,middleware.ts,context.ts,locales/*}`
- Updated `apps/storefront/src/app/[locale]/...` (locale segment) or `next-intl` routing config
- Logical-property CSS refactor across `features/*`, `components/*`, `packages/ui/`
- Playwright RTL screenshot tests

## Acceptance Criteria
- [ ] Switching locale in UI re-renders in the chosen language (fr/ar/en)
- [ ] `/ar` sets `dir="rtl"`; layouts visually mirror (no broken alignment)
- [ ] Missing translation key falls back to default locale + dev warning
- [ ] Date/currency/numbers formatted via `Intl` per locale
- [ ] Disabling i18n (`ADDONS=` without `i18n`) removes all i18n code from prod bundle (bundle analyzer)
- [ ] Unknown locale segment → 404 (not silent default fallback)
- [ ] Playwright RTL screenshots for S-01/S-12/S-22 in `ar` pass

## Skills to load
`nextjs-app-structure` (locale route groups), `next-best-practices` (middleware), `tailwind-patterns` (logical properties, RTL), `webapp-testing` (screenshot tests)

## Risks / notes
- **Routing migration cost:** adding a `[locale]` segment to existing routes (§05/§06/§07) is non-trivial — build screens with translation keys from the start (noted in §05/§06/§07) to minimize rework. Consider building the `[locale]` segment structure in §05 proactively.
- **FR-065 admin editor** (merchant edits strings without redeploy) requires the WP companion plugin (blueprint Step 13). That's a follow-up after this section; the addon itself works from committed JSON files meanwhile. Flag this as a known v1-gap if the first deploy needs it.
- `next-intl` vs Next.js built-in i18n: confirm `next-intl` App Router support for Next.js 16 before committing (RESEARCH.md).
