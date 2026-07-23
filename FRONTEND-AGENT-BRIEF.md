# Ecom OS — Frontend Agent Brief

> Hand this file to any agent building client storefront UI. It is the complete contract:
> how to structure, how to connect, how to style, and which logic is untouchable.
> Verified against the codebase on 2026-07-07.

---

## 0. The One Decision That Governs Everything

**You never clone the app per client. You never create a new Next.js app per client.**

Ecom OS is ONE universal storefront (`apps/storefront`) developed in ONE monorepo.
A "client" is not a fork — it is the combination of:

| Client dimension | Where it lives | Selected by |
|---|---|---|
| Visual identity (colors, radius, fonts) | `packages/themes/src/clients/<client>/theme.ts` | `THEME_NAME` env var |
| Structural component variations | `templates` map inside the client's `EcomTheme` | theme config, resolved at render |
| Design documentation | `packages/themes/src/clients/<client>/DESIGN.md` + `ui-patterns.md` | you write these (mandatory) |
| Backend | WooCommerce (or later Vendure) | `ECOM_ENGINE` env var |
| Optional features | i18n, payments | `ADDONS` / `PAYMENT_PROVIDERS` env vars |
| Store content | The client's WordPress/WooCommerce | engine at runtime |

Cloning happens exactly once, **at deployment time**, via the `create-ecom-os` CLI
(`pnpm create` at repo root) — and that copy is a build artifact, not a development
workspace. All development, for every client, happens in this monorepo. Improvements
land once and every client benefits. Forking the storefront per client would kill the
entire business model of the product ("the 80% is done").

---

## 1. Mental Model

```
Next.js 16 storefront (apps/storefront)     ← one UI for all clients
        │  getEngine()                       ← the ONLY door to data
        ▼
EcomEngine interface (packages/ecom-engine)  ← typed contract, zero runtime deps
        │
        ├── WooCommerceEngine (packages/engine-woocommerce)
        │       reads:  WPGraphQL   (WC_GRAPHQL_URL)
        │       writes: WC REST API (WC_REST_URL + key/secret)
        └── FakeEngine (built-in)            ← dev/CI without a backend
```

Stack (pinned): Next.js 16 App Router · React 19 · TypeScript strict · Tailwind v4 ·
Zustand (cart only) · next-intl · GSAP (islands only) · pnpm workspace.

---

## 2. Non-Negotiable Laws (CI-enforced or reviewed)

1. **Never import `@ecom-os/engine-woocommerce`** (or any adapter) anywhere in
   `apps/storefront/src` except `src/lib/engine.ts`. All data via
   `const engine = await getEngine()` from `@/lib/engine`.
   `scripts/check-engine-imports` fails the build otherwise.
2. **Never fetch a backend URL directly.** No `fetch('/wp-json/...')`, no GraphQL
   from components. If the engine lacks a method you need, the method gets added to
   `packages/ecom-engine/src/interface.ts` + implemented in the adapter — never
   hardcoded in UI.
3. **All money is `Money { amount_minor, currency }`.** Never a raw number, never a
   float. Display: `(price.amount_minor / 100).toFixed(2)`.
4. **Server Components by default.** `'use client'` only for hooks, events, browser
   APIs, GSAP. Client components are leaf nodes receiving plain JSON props.
5. **Never trust client prices.** Checkout serializes item IDs/slugs only; the server
   action re-fetches authoritative prices from the engine before creating the order.
   Do not change this.
6. **No hardcoded colors, spacing, or fonts.** Token classes only (`bg-primary`,
   `text-foreground`, `bg-muted`, `rounded-md`, `font-sans`). New color → add to the
   theme, never inline.
7. **No hardcoded business strings in JSX.** Content comes from `features/*/data/`,
   the engine, or locale JSON (`packages/addons-i18n/locales/`).
8. **`next/image` for every raster, `next/link` for every internal route.**
9. **Every server action validates input with Zod before any side effect.**
10. **Capability-gate optional features.** Wrap loyalty/wishlist/etc. in
    `<IfCapable capability="...">` (backed by `engine.getCapabilities()`); the UI must
    degrade gracefully when a backend lacks the feature.
11. **Never branch on client identity in code.** No `if (client === 'angelina')`.
    Structural differences go through the theme's `templates` registry (§6).
12. **Feature-first organization** (§4). Kebab-case files, `*-client.tsx` suffix for
    client islands.

---

## 3. The Engine Contract (canonical, from `packages/ecom-engine/src/interface.ts`)

Trust this list over any doc that disagrees (some older docs say `getProductBySlug` /
`getProducts` — the real names are below):

```
Catalog:   listProducts(query) · getProduct(slug, locale?) · listCategories(locale?)
Cart:      getCart(cartId) · addToCart(cartId, input)
Checkout:  listPaymentGateways() · initCheckout(cartId, input, items?) ·
           placeOrder(session) · markOrderPaid(orderId, paymentRef)
Orders:    getOrder(orderId, customerId) · listCustomerOrders(customerId, query?)
Auth:      login(input) · registerCustomer(input) · getCustomer(token) ·
           requestPasswordReset(email) · resetPassword(token, newPassword)
Addresses: listAddresses · createAddress · updateAddress · deleteAddress
Coupons:   applyCoupon(cartId, code, cartTotal) · removeCoupon · validateCoupon?
Shipping:  listShippingMethods(countryCode?)
Meta:      getCapabilities()
Loyalty:   getLoyaltyBalance(customerId) · redeemLoyaltyPoints(customerId, points)
```

Data-fetching rules:
- Fetch in async `page.tsx` (RSC), pass down as props.
- Multiple independent fetches → `Promise.all`, never sequential awaits (no waterfalls).
- Caching: route-segment `export const revalidate = N`; on-demand purge exists via the
  `/api/revalidate` webhook. Don't invent your own cache.
- Non-critical sections (e.g. recommendations) fail soft: try/catch → return `null`.

---

## 4. App Structure — Where Things Go

```
apps/storefront/src/
├── app/[locale]/            ← ALL routes live under the locale segment
│   ├── (shop)/              Home · catalog · catalog/[categorySlug] · product/[slug]
│   │                        · cart · search · blog · stores
│   ├── (checkout)/          checkout · checkout/success · checkout/stripe
│   ├── (account)/account/   login · register · orders · orders/[orderId] ·
│   │                        addresses · profile · forgot-password · password-reset
│   └── (legal)/legal/       privacy · terms · returns
├── features/<feature>/      ← feature-first: model/ data/ ui/ hooks/ lib/ server/ validation/
│   │                          existing: landing catalog product cart checkout account
│   │                          auth i18n contact
│   └── ui/x.tsx + x-client.tsx   (server wrapper + client island pattern)
├── components/shared/       SiteHeader · BrandFooter · Pagination · IfCapable
├── stores/cart-store.ts     Zustand cart (the ONLY client store)
├── lib/                     engine.ts (gateway — do not bypass) · capabilities.ts ·
│                            crypto.ts · rate-limit.ts
├── i18n/routing.ts          toggleable locale routing
├── styles/                  AUTO-GENERATED css (never hand-edit)
└── proxy.ts                 middleware: CSP nonce, /account guard, i18n routing
```

New page = route file under `app/[locale]/(group)/` + components in
`features/<feature>/ui/` + server actions in `features/<feature>/server/actions.ts`.

---

## 5. The Flows — Respect Them Exactly

### Cart
100% client-side: Zustand persisted to `localStorage` (`cart-storage` key). Holds items
(with `slug` for server re-validation), coupon, shipping method. Totals in minor units.
It does NOT sync to the backend while browsing — it only reaches the engine at checkout.
Cart cookie name: `ecom_cart_id`.

### Checkout (COD — the reference flow)
1. `CheckoutForm` (client) serializes cart item IDs/slugs — **no prices** — into the form.
2. Server Action: Zod-parse → `engine.initCheckout(cartId, input, items)` →
   `engine.placeOrder(session)`. `placeOrder` re-fetches real prices from WooCommerce.
3. Redirect `/checkout/success?orderId=X`; `CartClearer` empties the Zustand store there.
Checkout goes through the server action in the page — there is deliberately **no**
`/api/checkout` REST route (one existed once and was deleted; don't recreate it).

### Auth
JWT in `httpOnly` cookie named **`ecom_auth`** (30-day TTL). Login via WPGraphQL
`generateAuthToken`; register via WC REST then login. Middleware (`proxy.ts`) guards
`/account/**` (except login/register/forgot/reset) and preserves `?from=` for
post-login redirect. Rate limits: login 10/60s, register 5/60s. Login page path:
`/account/login` (not `/login`).

### i18n
`ADDONS=i18n` toggles it. Locales `en` (default) / `fr` / `ar` via next-intl; the
locale layout sets `dir="rtl"` for Arabic. Pass `locale` to engine calls for localized
content. Never write `if (locale === ...)` data logic. Without the addon, the app runs
single-language with no URL prefix. Use logical Tailwind utilities (`ms-*`, `text-start`)
so RTL works for free.

### Payments
`PAYMENT_PROVIDERS=cod,stripe,cmi` registers gateways (addons-multi-payment).
- COD: fully working.
- Stripe: server creates PaymentIntent → `client_secret` → Stripe Elements; webhook
  `/api/webhooks/stripe` is signature-verified → `markOrderPaid`.
- CMI: HMAC + amount check + replay dedup; webhook `/api/webhooks/cmi`.
Never store card data. Never skip webhook signature verification.

### Capabilities & Loyalty
`engine.getCapabilities()` hits the custom WP plugin (`/wp-json/epioso/v1/capabilities`).
Gate optional UI with `<IfCapable>`. Loyalty balance/redeem go through the engine.

---

## 6. Theming — How a Client Gets Its Look

### The canonical pipeline (THEME_NAME → theme registry)
1. Scaffold: `theme` command in `packages/cli` creates
   `packages/themes/src/clients/<client>/{theme.ts, DESIGN.md}` and registers it in
   `packages/themes/src/index.ts`.
2. `theme.ts` exports an `EcomTheme`: `config` (shadcn-style color tokens as HSL
   channel strings, `radius`, fonts) + optional `templates` map.
3. On every `pnpm dev` / `build`, `apps/storefront/scripts/generate-theme.ts` reads
   `THEME_NAME` and writes `src/styles/theme-vars.css` (`--primary`, `--background`, …),
   imported by the root layout.
4. Component variations: never fork a component per client. Build
   `HeroDefault.tsx` / `HeroLuxury.tsx` side by side, register them, and let the base
   `<Hero />` pick via the active theme's `templates` map. Existing base aesthetics:
   `default`, `minimal`, `luxury`.

### ⚠️ Known conflict you must not make worse
A second, older pipeline coexists: `apps/storefront/brand.config.ts` →
`scripts/generate-tokens.ts` (root `predev`/`prebuild`) → `src/styles/brand.tokens.css`,
which defines the Tailwind `@theme` mapping (`--color-primary: var(--brand-primary)`)
that token classes like `bg-primary` actually resolve to. Meanwhile `theme-vars.css`
writes shadcn-style `--primary` HSL vars that nothing maps into Tailwind yet.
**Practical rule until this is unified:** treat `packages/themes` as the client-identity
source of truth (it's what the CLI, docs, and design-kit workflow assume), keep
`brand.config.ts` values in sync for the same client, and never hand-edit either
generated CSS file. If asked to unify: bridge `theme-vars.css` vars into the `@theme`
block so both use one set of tokens — do it as its own task, not as a drive-by.

### Mandatory design kit per client
Every new client theme MUST ship `DESIGN.md` (mood, palette with roles + hexes,
typography rules, component stylings in plain language, layout principles) and
`ui-patterns.md` (which template variations, animation philosophy, interaction states)
inside `packages/themes/src/clients/<client>/`. These are the source of truth for AI
design tools on the next iteration.

### Brand scope warning
The root `DESIGN.md` (Ember `#FA7400` / Noir / Cacao / Warm White) is the identity of
**Ecom OS the platform** — EPIOSO's marketing. Client storefronts NEVER use it unless
the client is Ecom OS itself. Do not let platform colors leak into client themes.

### Full brand-swap checklist (target ≤ 4h per client)
- [ ] `packages/themes/src/clients/<client>/theme.ts` (+ registry entry)
- [ ] `DESIGN.md` + `ui-patterns.md` design kit
- [ ] `brand.config.ts` kept in sync (name, colors, hero copy, contact, social)
- [ ] Logo files light + dark in `apps/storefront/public/`
- [ ] Fonts via `next/font` (no CDN links)
- [ ] Env: `THEME_NAME=<client>` (+ `ECOM_ENGINE`, `ADDONS`, `PAYMENT_PROVIDERS`, WC creds)
- [ ] `pnpm --filter storefront build` + visual pass: home, catalog, PDP, cart, checkout, account

---

## 7. Environment Variables (per deployment)

```
ECOM_ENGINE=woocommerce|fake      THEME_NAME=<client>       ADDONS=i18n
PAYMENT_PROVIDERS=cod,stripe,cmi
WC_GRAPHQL_URL=  WC_REST_URL=  WC_REST_KEY=  WC_REST_SECRET=
STRIPE_SECRET_KEY=  STRIPE_WEBHOOK_SECRET=  CMI_MERCHANT_ID=  CMI_STORE_KEY=
ECOM_OS_ENCRYPTION_KEY=  REVALIDATE_SECRET=  SESSION_COOKIE_SECRET=
```

Dev without a backend: `ECOM_ENGINE=fake` boots the app with stub data.

---

## 8. Known Gaps (per 2026-07-03 audit) — Don't Trip On These

Aware ≠ assigned. Fix only if it's your task:
- Stripe Elements form exists but isn't conditionally rendered in checkout;
  CMI never redirects to the bank's 3DS page after `placeOrder`.
- `markOrderPaid` is a no-op in the WC engine — paid orders stay PENDING.
- `requestPasswordReset` / `resetPassword` throw "Not implemented" in the WC engine
  (pages exist).
- Theming pipeline conflict (§6). Logo in `SiteHeader` is hardcoded text.
  GA ID is a hardcoded `G-XXXXXXXXXX` placeholder.
- Wishlist is localStorage-only (no engine method). Vendure engine: deliberately
  deferred — don't scaffold it.

---

## 9. Performance & Quality Bars

Lighthouse ≥ 90 · LCP ≤ 2.0s (mobile 3G) · hydrated JS ≤ 180 KB gzip on catalog ·
AVIF/WebP via `next/image` · WCAG AA contrast on all text tokens.

Verify before finishing any task:
```
pnpm verify        # engine-import guard + lint + typecheck + tests
pnpm e2e           # Playwright
```

## 10. Reading Order (when you need more depth)

1. `CODEBASE.md` — package-by-package deep dive
2. `packages/themes/docs/01..05` — data fetching · custom pages/routing ·
   cart/checkout · CMS/localization · theming/animation
3. `.agents/skills/ecom-os-frontend/SKILL.md` — UI rules (this brief supersedes on conflicts)
4. `.gemini/skills/ecom-*` — feature/theming/adapter/addon guides
5. `pre-dev/04-screen-inventory.md` — all 52 screens with states
6. `pre-dev/03-ADRs/` — before touching anything architectural
