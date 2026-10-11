# ECO-1013 — Make the storefront production build pass

**Commits:** `b8f87cc` (builder pin, ignore rule), `cda9acc` (route exports), `c983a08` (consumer import) · **Surfaced by:** ECO-1004/ECO-1012

## Two further failures, both real, neither previously observed

### 1. Turbopack rejects the Tailwind v4 CSS output

With the engine imports fixed, `next build` failed in the CSS pipeline:

```
CssSyntaxError: tailwindcss: src/app/globals.css:1:1: ...:2:49500: Missed semicolon
```

Ruled out, in order: `globals.css` (623 bytes, well-formed) and the generated
`apps/storefront/src/styles/brand.tokens.css` (932 bytes, well-formed) were both
read; running the same `postcss` + `@tailwindcss/postcss` pair over the same
`globals.css` **outside** Turbopack succeeds (exit 0, 98k–107k characters of output).
A stray `.next.eco1009-bak` bundle directory inside `apps/storefront` was also being
scanned as a CSS source, because it was not gitignored — fixed, but not the cause; the
error reproduced identically after adding `/.next*/` to `apps/storefront/.gitignore`.

The webpack builder compiles the identical input cleanly. `apps/storefront`'s `build`
script therefore uses `next build --webpack`, and `build:turbopack` is kept so the
issue can be retested when upstream resolves it. CI runs
`pnpm --filter storefront build`, so it inherits the working builder.

### 2. Next route type check rejected test-only exports

`next build` then failed its generated route validation:

```
.next/types/app/api/rfq/offers/route.ts: Property 'setOfferQuoteForTesting' is incompatible with index signature.
.next/types/app/api/rfq/route.ts:       Property 'clearRfqStoresForTesting' is incompatible with index signature.
```

A Next.js route module may only export its HTTP handlers and its route config. The
test helpers moved to `features/rfq/model/server-quote-store.ts` as thin wrappers over
the shared store; both consumers import them from there. This is stricter than
`tsc --noEmit`, which is why the type check had passed while the build failed.

## Verification

| Check | Result |
| --- | --- |
| `node apps/storefront/node_modules/next/dist/bin/next build --webpack` (from `apps/storefront`) | **exit 0** |
| Routes present in the build output | `/[locale]/checkout`, `/[locale]/devis`, `/[locale]/devis/review`, `/[locale]/devis/offer`, `/api/rfq`, `/api/rfq/offers` — the previously unmounted routes are compiled into the build |
| `next build` (Turbopack, default) | exit 1 — `CssSyntaxError ... Missed semicolon`; documented, not fixed |
| `tsc -p apps/storefront/tsconfig.json --noEmit --incremental false` | exit 0 |
| `node node_modules/tsx/dist/cli.mjs --test apps/storefront/e2e/quote-offer.spec.ts` | exit 0 |
| `vitest run` | exit 0 — 521 passed |

## What this does not prove

A successful build is not a working store. Nothing here places an order, and the
browser evidence for the purchase journey is ECO-1009. The Turbopack failure is
**worked around, not root-caused**; the underlying PostCSS interaction is still
unexplained.
