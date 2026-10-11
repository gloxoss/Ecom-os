# EcomOS Platform Installation Guide

- **Document**: `INSTALL.md`
- **Application**: EcomOS Dual-Engine E-Commerce Platform
- **Version**: 1.1.0
- **Status**: DRAFT — steps below were aligned to the repository source and the recorded local staging baseline (`docs/ecomos/STAGING_SETUP.md`). No clean-checkout install from this guide is retained as evidence.

---

## 1. Prerequisites

| Requirement | Value | Source |
| :--- | :--- | :--- |
| Node.js | `>= 22` | `package.json` `engines.node`; CI uses `node-version: 22` |
| pnpm | `11.7.0` | `package.json` `packageManager` (`engines.pnpm` allows `>= 9`) |
| PHP | `8.1+` | plugin headers declare `Requires PHP: 8.1`; baseline ran PHP `8.2.29` |
| WordPress | `6.2+` | plugin headers declare `Requires at least: 6.2` |
| WooCommerce | HPOS-enabled, with the GraphQL connector | see section 3 |
| Database | MySQL `8.0+` or MariaDB `10.6+` | baseline ran MySQL `8.4.0` |

The recorded baseline (`STAGING_SETUP.md`, 2026-10-09) ran WordPress + WooCommerce `11.2.1`, WPGraphQL `2.23.1` and WPGraphQL for WooCommerce `1.0.3`. Those are the only versions with executed evidence in this repository; treat other combinations as untested rather than unsupported.

If `pnpm -v` fails or misbehaves, substitute `npx -y pnpm@11.7.0` for every `pnpm` command below. (The `pnpm` on PATH is currently a broken shim on the owner's machine.)

---

## 2. Storefront installation

### 2.1 Clone and install

```bash
git clone https://github.com/gloxoss/Ecom-os.git
cd Ecom-os
pnpm install --frozen-lockfile
```

### 2.2 Create the environment file

Next.js reads `apps/storefront/.env.local` — that is the file the runtime actually loads, not the root `.env.example`. The root `.env.example` is a monorepo-level template; copy it as a starting point and then edit the values:

```bash
cp .env.example apps/storefront/.env.local
```

Required keys. `apps/storefront/src/lib/runtime-config.ts` (`validateRuntimeConfig`) fails fast in production if any of these is missing or malformed:

```env
ECOM_ENGINE=woocommerce
WC_REST_URL=https://your-site.com/wp-json/wc/v3
WC_GRAPHQL_URL=https://your-site.com/graphql
WC_REST_KEY=ck_...
WC_REST_SECRET=cs_...
REVALIDATE_SECRET=<at least 32 characters>
SESSION_COOKIE_SECRET=<at least 32 characters>
ECOM_OS_ENCRYPTION_KEY=<base64-encoded 32-byte key>
```

Production rules enforced by `validateRuntimeConfig`:

- `ECOM_ENGINE` must be exactly `woocommerce`.
- `WC_REST_URL` and `WC_GRAPHQL_URL` must be `https://` URLs with no embedded credentials.
- `REVALIDATE_SECRET` and `SESSION_COOKIE_SECRET` must each be >= 32 characters.
- `ECOM_OS_ENCRYPTION_KEY` must match `/^[A-Za-z0-9+/]{43}=$/` and decode to exactly 32 bytes.

Generate the secrets:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # ECOM_OS_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # REVALIDATE_SECRET / SESSION_COOKIE_SECRET
```

Other keys the storefront reads (optional but real):

- `ECOM_CLIENT_PROFILE` — active client profile, default `paraloca` (`apps/storefront/src/lib/client-profile.ts`)
- `THEME_NAME` — theme selection, default `angelina` (`apps/storefront/scripts/generate-theme.ts`)
- `ADDONS` — comma-separated addon names, matched against each package's declared flag (section 5)
- `ORDER_ACCESS_SECRET` — guest order-status grant tokens (`.env.example`)

> `ADDONS=i18n,multi-payment` (the value shipped in the root `.env.example`) resolves and generates cleanly as of 2026-10-11. Add `quotes` to enable the RFQ addon, whose package directory is `packages/addons-rfq` but whose addon name is `quotes`. See `EXTENDING.md` section 3.1.

### 2.3 Validate architectural boundaries

```bash
pnpm guard
```

This runs `scripts/check-engine-imports.ts` plus its test.

### 2.4 First build and dev server

```bash
pnpm build          # root: prebuild runs generate-tokens.ts + generate-addons.ts, then builds all packages
pnpm dev            # root: predev regenerates tokens/addons, then runs the storefront dev server
```

To run only the storefront: `pnpm --filter storefront dev`. To run the full check suite: `pnpm verify` (guard, lint, typecheck, unit tests, hub tests).

---

## 3. WooCommerce and GraphQL backend setup

The storefront talks to WooCommerce through two channels, and both must be configured:

1. **WooCommerce REST** (`WC_REST_URL`, default path `/wp-json/wc/v3`) authenticated with `WC_REST_KEY` / `WC_REST_SECRET`.
2. **GraphQL** (`WC_GRAPHQL_URL`, path `/graphql`) served by the WPGraphQL plugins.

On the WordPress side:

1. Install and activate WooCommerce, then enable High-Performance Order Storage (HPOS).
2. Install the WPGraphQL plugin **and** the WPGraphQL for WooCommerce bridge (`wp-graphql/wp-graphql-woocommerce`). The `<your-site>/graphql` endpoint responds 404 until the bridge is active.
3. Generate REST API keys with read scope. The recorded baseline used a dedicated connector user with only `read` + `manage_woocommerce` and a **read-only** key; settings writes are expected to be denied.

WooCommerce owns prices, stock, totals and orders. Never treat browser-supplied amounts as authoritative.

Check the backend is reachable before starting the app:

```bash
node node_modules/tsx/dist/cli.mjs scripts/probe-woocommerce.ts https://your-site.com
```

The probe prints public capability/status summaries and token presence only (never token values) and exits non-zero when prerequisites are missing. A successful probe does not prove cart updates or checkout.

### Local HTTPS and certificates

A local site served over HTTPS requires trusting its certificate before Node starts:

```powershell
$env:NODE_EXTRA_CA_CERTS = "C:\path\to\site.crt"
```

Set this **before** launching Node; setting it after `.env.local` loads has no effect. `scripts/dev-local.ps1` wraps this for the recorded Local site.

---

## 4. Revalidation

On-demand cache revalidation is served by `apps/storefront/src/app/api/revalidate/route.ts`:

- `POST /api/revalidate?secret=<REVALIDATE_SECRET>&tag=<cache-tag>` (default tag `wc-products`)
- Returns 503 when `REVALIDATE_SECRET` is unset or shorter than 32 characters, 401 on a wrong secret, 429 when rate-limited, and `{ revalidated: true, tag }` on success.
- Comparisons are constant-time; requests are rate-limited per secret.

Configure the WordPress/WooCommerce side to call this endpoint with the same `REVALIDATE_SECRET` value after catalog changes.

---

## 5. Addons

Which addons compile into the storefront is driven by the `ADDONS` environment variable (comma-separated addon names). Full authoring and lifecycle details are in `EXTENDING.md`.

Quick check:

```bash
ADDONS="i18n,multi-payment,quotes" node node_modules/tsx/dist/cli.mjs scripts/generate-addons.ts
```

This writes `apps/storefront/src/addons.generated.ts`. All four shipped addons (`i18n`, `multi-payment`, `quotes`/RFQ, and the `dummy-addon` exemplar) carry a `manifest.json` and generate cleanly. An unknown name fails the generator with a non-zero exit, which fails `predev`/`prebuild`.

Clear `ADDONS` and regenerate before committing, since `addons.generated.ts` is a checked-in build artifact.

---

## 6. WordPress companion plugins

The project ships three PHP plugins under `plugins/`. There is no install script; copy or symlink them into `wp-content/plugins/`:

1. `wp-ecomos-addons` — addon lifecycle, reversible migrations, feature flags.
2. `wp-ecomos-operations` — operational health probes and admin bridge.
3. `wp-ecomos-rfq` — quotation request tables (`wp_ecomos_rfq_quotes`, `wp_ecomos_rfq_revisions`).

```bash
wp plugin activate wp-ecomos-addons wp-ecomos-operations wp-ecomos-rfq
```

These plugins are not activated by any repository script, and HPOS compatibility is not declared in their headers today (see `EXTENDING.md` section 4). Verify activation and declarations on the target site rather than assuming them.

---

## 7. Search

`packages/ecom-engine/src/search/` contains a typed `SearchProvider` abstraction with native WooCommerce, Meilisearch and Typesense implementations, plus `FallbackSearchProvider` (explicit fallback, never a silent empty result).

**There is no `SEARCH_PROVIDER` environment switch.** Provider selection is done in code by constructing the providers and wrapping the external one in `FallbackSearchProvider`. The module is not yet wired into the storefront request path. An earlier revision of this guide advertised a `SEARCH_PROVIDER=typesense` variable; that variable does not exist in the source and has been removed.

---

## 8. What this guide does not certify

No production deployment, browser pass or completed storefront checkout is evidenced by these instructions. The recorded backend proof is the synthetic local baseline in `STAGING_SETUP.md`; the remaining acceptance gates are listed there too.
