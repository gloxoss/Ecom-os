# EcomOS Compatibility & Support Matrix

- **Document**: `COMPATIBILITY.md`
- **Application**: EcomOS Cross-Platform Matrix
- **Version**: 1.1.0
- **Status**: PARTIAL — the rows below distinguish what is *required by source*, what was *actually executed*, and what is *unverified*. No rows are marked "certified".

---

## 1. Runtime environment compatibility

| Component | Declared / pinned | Actually executed | Evidence |
| :--- | :--- | :--- | :--- |
| **Node.js** | `>= 22` (`package.json` `engines.node`) | Node `22` | CI workflow `.github/workflows/ci.yml` (`node-version: 22`) |
| **pnpm** | `11.7.0` (`packageManager`; `engines.pnpm` allows `>= 9`) | `11.7.0` | CI `pnpm/action-setup` pins `11.7.0` |
| **TypeScript** | `5.9.3` | `5.9.3` | `package.json` devDependencies |
| **Vitest** | `4.1.11` | `4.1.11` | `package.json` devDependencies; CI runs `pnpm test:coverage` |
| **PHP** | `>= 8.1` (plugin headers: `Requires PHP: 8.1`) | PHP CLI `8.2.29` | `plugins/wp-ecomos-*/` headers; `docs/ecomos/STAGING_SETUP.md` |
| **WordPress** | `>= 6.2` (plugin headers: `Requires at least: 6.2`) | one local baseline version | plugin headers; `STAGING_SETUP.md` (syntax + REST index only) |
| **WooCommerce** | HPOS-enabled (design requirement) | `11.2.1` | `STAGING_SETUP.md` |
| **WPGraphQL** | required for the GraphQL channel | `2.23.1` | `STAGING_SETUP.md` |
| **WPGraphQL for WooCommerce** | required bridge | `1.0.3` | `STAGING_SETUP.md` (upstream ZIP SHA-256 recorded there) |
| **MySQL / MariaDB** | `8.0+` / `10.6+` (design requirement) | MySQL `8.4.0` | `STAGING_SETUP.md` |

Node `24` and PHP `8.3` were previously listed here as "supported". Neither has been executed, and CI tests a single Node version. Do not read a row as a support guarantee.

The executors and adapters are selected at runtime by `ECOM_ENGINE`: `woocommerce`, `vendure` or `fake` (`.env.example`). Production is gated to `woocommerce` by `apps/storefront/src/lib/runtime-config.ts`. The `vendure` path exists in configuration but has no executed evidence in this repository.

---

## 2. Browser and client surfaces

No browser, hydration or CSP pass has been executed and recorded. The targets below are design intent, not verification results.

| Surface | Target |
| :--- | :--- |
| Desktop Chrome / Edge | current and previous 2 releases |
| Desktop Safari | 16.0+ |
| Desktop Firefox | current ESR and latest stable |
| Mobile Safari | iOS 16.0+ |
| Mobile Chrome | Android 12+ |

Accessibility: WCAG 2.1 AA is the stated target; no audit result is retained. The recorded staging session had no browser surface at all (`STAGING_SETUP.md`).

---

## 3. Disabled or unsupported capabilities (design invariants)

These are enforced constraints, not measured compatibility results:

- **Customer user accounts**: disabled (`customerAccounts = false` in `clients/paraloca/profile.ts`). No login or registration flow is supported; guest checkout is authoritative.
- **Uncertified payment gateways**: Stripe and CMI are fail-closed pending merchant certification. Only `cod` is enabled in the active profile (`commerce.allowedPaymentMethods: ['cod']`).
- **Legacy WooCommerce postmeta orders**: unsupported. HPOS is mandatory by design. Note that the shipped PHP plugins do **not** currently declare HPOS compatibility in code — see `EXTENDING.md` section 4 and `release/BACKEND_MATRIX.md`.
- **Search providers**: Meilisearch and Typesense have implementations in `packages/ecom-engine/src/search/` but are not wired into the storefront and have no environment switch. See `INSTALL.md` section 7.
