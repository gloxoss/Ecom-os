# EcomOS Backend Compatibility Matrix: WordPress, WooCommerce & HPOS

- **Document**: `BACKEND_MATRIX.md`
- **Application**: EcomOS Backend Architecture
- **Version**: 2.0.0
- **Status**: PARTIAL — declared requirements and executed evidence are separated. No row is "certified". The previous revision claimed PHP/WordPress/WooCommerce certification and HPOS declarations that the shipped plugins do not contain. See the withdrawal record `release/CORRECTION_2026-10-11.md`.

---

## 1. Declared requirements vs. executed evidence

| Layer | Declared | Executed | Where it comes from |
| :--- | :--- | :--- | :--- |
| **PHP** | `>= 8.1` | PHP CLI `8.2.29` | `plugins/wp-ecomos-*/` headers (`Requires PHP: 8.1`); staging baseline |
| **WordPress** | `>= 6.2` | one local site version | plugin headers (`Requires at least: 6.2`); `STAGING_SETUP.md` |
| **WooCommerce** | HPOS required by design | `11.2.1` | `STAGING_SETUP.md` |
| **WPGraphQL** | required for the GraphQL channel | `2.23.1` | `STAGING_SETUP.md` |
| **WPGraphQL for WooCommerce** | required bridge | `1.0.3` | `STAGING_SETUP.md` (upstream ZIP SHA-256 recorded there) |
| **MySQL / MariaDB** | MySQL `8.0+` / MariaDB `10.6+` | MySQL `8.4.0` | `STAGING_SETUP.md` |
| **Store API** | WooCommerce Store API `v1` | reachable on the baseline (`products`/`cart` returned 200) | `packages/engine-woocommerce/src/cart.ts` (URL built from `/wp-json/wc/store/v1`); `STAGING_SETUP.md` |

The earlier claim that versions `8.5.x` through `9.3.x+` are "certified" is unsupported. Only WooCommerce `11.2.1` has execution evidence. CoCart is **not** used anywhere in the codebase; the adapter talks to WooCommerce's own Store API and to GraphQL.

---

## 2. High-Performance Order Storage (HPOS)

HPOS is a design requirement: legacy postmeta order storage is unsupported.

**Correction, then repair (2026-10-11).** The previous revision claimed "all custom EcomOS plugins declare explicit compatibility with WooCommerce HPOS" and showed a `declare_compatibility` snippet as if it were present. It was not: the only calls lived in PHP **test fixtures** (`plugins/tests/bootstrap.php`, `plugins/tests/compatibility.test.php`), so the claim was withdrawn.

That gap has since been closed. Each shipped plugin now declares compatibility on `before_woocommerce_init`:

- `plugins/wp-ecomos-addons/wp-ecomos-addons.php`
- `plugins/wp-ecomos-operations/wp-ecomos-operations.php`
- `plugins/wp-ecomos-rfq/wp-ecomos-rfq.php`

giving `FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true)`, and each header carries `Requires at least: 6.2`, `Requires PHP: 8.1` and `WC requires at least: 8.5`.

**What that does and does not prove.** The declaration is metadata that stops WooCommerce warning about an untested plugin on HPOS sites. It is not an executed compatibility test. `scripts/verify-backend-compatibility.ts` now checks these declarations and fails closed when any is absent (it returns `overallStatus: "PASS"` only with all three present); `node node_modules/tsx/dist/cli.mjs scripts/verify-backend-compatibility.ts` and `php -l` on each plugin file are the recorded checks. Real HPOS/Store API behaviour still requires the WordPress test suite, which has no environment on this machine — see section 3.

---

## 3. Store API and guest authorization

1. **Guest cart & checkout**: the adapter drives the WooCommerce Store API at `/wp-json/wc/store/v1` (`packages/engine-woocommerce/src/cart.ts`), including the `Nonce` / `X-WC-Store-API-Nonce` header. Store API requests must be HTTPS in production.
2. **Guest orders**: created with `customer_id = 0`. The recorded baseline created synthetic order #15 this way.
3. **No account rows for guests**: guest checkout does not mint a `wp_users` row (design invariant; `customerAccounts = false` in the active profile).
4. **Guest order access**: status links are gated by HMAC grant tokens derived from `ORDER_ACCESS_SECRET` (falling back to `ECOM_OS_ENCRYPTION_KEY`), which fails closed in production when both are missing (`apps/storefront/src/lib/commerce/order-access.ts`).
5. **Payment**: only `cod` is enabled in the active profile. Stripe and CMI are fail-closed pending certification.

---

## 4. Limits of the recorded backend evidence

The baseline in `STAGING_SETUP.md` proves the *back-end* Store API strategy on one isolated local site. It does not prove storefront checkout, concurrency safety, merchant shipping/tax policy, CSP/hydration, or browser order confirmation. Those gates remain open (see the "Remaining acceptance gates" section of that document).
