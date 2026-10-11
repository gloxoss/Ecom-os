# Local staging baseline, 2026-10-09

- **Status**: HISTORICAL RECORD — a dated local, isolated baseline. It is not a production certification and not a statement about the current working tree. Version numbers below are what was observed on this exact site on 2026-10-09; other documents that cite them (`COMPATIBILITY.md`, `release/BACKEND_MATRIX.md`) treat them as the only executed evidence, not as a supported floor.
- **Scope**: one Local site, one backend connector, no browser. Nothing here proves storefront checkout, concurrency safety or production behavior.

Owner supplied `http://paraloca.local/wp-admin` for isolated staging. Its login credentials are not saved in repository files, reports, or environment variables. Local's bundled WP-CLI provides local administrative inspection without using the login password.

## Verified baseline

- WordPress 7.1.3, PHP CLI 8.2.29, MySQL 8.4.0 from Local configuration.
- WordPress REST index responds 200. WP-CLI reports zero installed plugins.
- WooCommerce Store API products/cart and GraphQL respond 404. The site cannot serve the existing commerce adapter yet.
- All six project-owned PHP files pass syntax checks with PHP 8.2.29. This is syntax evidence, not deployed plugin or permission testing. The preexisting dirty WordPress MCP submodule was excluded.
- No browser surface is available in this session. No admin UI or storefront browser pass is claimed.
- Local's PHP CLI startup reports a missing Imagick DLL with its generated php.ini. Syntax checks use `-n`; this warning needs a separate environment check before image processing is relied on.

## Backup and installation proposal

Backup is outside the repository at `C:/Users/OMEN/Local Sites/paraloca/ecomos-backups/pre-commerce-2026-10-09/`:

- `database.sql`: 936,941 bytes, successful WP-CLI export using the site's MySQL port 10005.
- `site-config-content.zip`: 13,385,713 bytes, wp-config and wp-content snapshot.
- These backups contain private configuration/data and must not be committed or shared. Restore has not been rehearsed.

Owner approved installation of these three free plugins. All are now installed and active:

1. WooCommerce 11.2.1 from WordPress.org. Registry declares WordPress >=7.0, PHP >=7.4, tested through 7.1.3.
2. WPGraphQL 2.23.1 from WordPress.org. Registry declares WordPress >=6.0, PHP >=7.4, tested through 7.0.7. Compatibility with this WordPress version must be tested.
3. WPGraphQL for eCommerce 1.0.3, upstream `wp-graphql/wp-graphql-woocommerce` release ZIP. It bridges the current product queries to WooCommerce. Upstream asset SHA-256: `202099867ce7b7bc9e1d5ed133096a534f11259f6a465732ec6e24b8e9d0d5b2`.

These are existing GPL open-source integrations with no paid addon or subscription proposed. Upstream compatibility and maintenance must be checked on this exact staging stack before release. Optional project plugins stay disabled until their acceptance checks pass.

Rollback: deactivate added plugins, then restore the database and wp-config/wp-content snapshot if activation changes must be removed. Restore is a separate consequential operation and must target this same isolated site. Removing plugins alone does not undo WooCommerce database changes.

If rolling back this fixture/connector setup, also remove its added local `ECOM_ENGINE`, `WC_*`, `REVALIDATE_SECRET` and `SESSION_COOKIE_SECRET` entries from the ignored storefront environment file. Preserve the original theme/encryption entries. The pre-plugin database backup predates the connector and fixture data, so restored WordPress will no longer recognize that connector key.

## Repeatable public preflight

Run `pnpm exec tsx scripts/probe-woocommerce.ts http://paraloca.local` (on a machine where the `pnpm` shim works, this is `node node_modules/tsx/dist/cli.mjs scripts/probe-woocommerce.ts http://paraloca.local`). The script prints only public capability/status summaries and token presence, never token values. A nonzero exit means prerequisites are missing. A successful preflight does not prove cart updates or checkout.

## Verified backend commerce checkpoint

Store API products/cart and commerce GraphQL now respond successfully. The existing adapter fetches a real WooCommerce fixture at 39.95 MAD and reads the fixture category. Two published synthetic products, including one exact variation, were created through WooCommerce CRUD:

- Simple product 12, SKU `ECOMOS-TEST-SIMPLE`, 39.95 MAD.
- Variable parent 13 and variation 14, SKU `ECOMOS-TEST-VARIATION-STANDARD`, 79.50 MAD.
- Morocco fixture shipping zone 1, flat rate `flat_rate:1`, 25.00 MAD. Fixture tax class uses a deliberately synthetic 10% rate on fixture items/shipping. This is not merchant tax or delivery policy.

`scripts/seed-local-woocommerce.php` only runs through WP-CLI on this exact Local environment/domain. It refuses initial seeding on a non-empty store. A repeat invocation returned the same manifest without resetting stock or creating more products. It configures this isolated fixture store as MAD/Morocco with guest checkout.

A dedicated connector user has only `read` and `manage_woocommerce`, without administrator capabilities. Its API key is read-only. Catalog currency reads pass; customer-order reads return 403 and settings writes are denied. Secrets are saved only in the ignored storefront `.env.local`; the supplied WordPress login password is not saved. Optional customer accounts and Stripe/CMI remain disabled.

REST Basic authentication over HTTP returned 401. Using HTTPS with Local's exact site certificate trusted through `NODE_EXTRA_CA_CERTS` returned 200. Certificate checks remain enabled. Set the variable before starting Node, not after loading `.env.local`. To launch development from PowerShell, use `./scripts/dev-local.ps1` with Local running.

`scripts/smoke-local-woocommerce.ts 12 14 maagd` passed on HTTPS:

- Two independent guest carts do not share lines. Missing/forged cart tokens are rejected.
- Quantity 999 exceeds stock and is rejected. Browser-supplied `price: 0.01` is ignored; WooCommerce prices remain authoritative.
- Cart contains 2 simple items plus exact variation 14. Backend totals: 159.40 MAD items + 25.00 shipping + 18.44 synthetic tax = 202.84 MAD.
- COD checkout creates order **15**, status `processing`, guest customer ID **0**. Sequential retry returns **409**; independent WooCommerce CRUD confirms exactly one order for this run and the correct parent/variation IDs, quantities and totals.
- Local's SMTP targets `localhost:10001`. Mailpit captured one notification referencing order #15. No live payment or external customer email was used.

The first smoke attempt stopped at a cart POST because this WooCommerce version returned 201 rather than 200. The script now accepts both success statuses; the completed run is recorded in `store-api-smoke.json`. Independent order verification initially compared unpadded decimal strings; it now normalizes them to two decimal places. These were harness corrections, not altered commerce totals.

For repeat checks, set `$env:NODE_EXTRA_CA_CERTS` to Local's `paraloca.local.crt`, then run the public preflight or smoke through `pnpm exec tsx`. The smoke creates another clearly marked local test order on each successful run. Verify it through WP-CLI `eval-file scripts/verify-local-order.php <order-id>`. Do not run these fixture scripts against another environment.

## Remaining acceptance gates

This proves the backend Store API strategy, not storefront checkout. The engine's cart/checkout methods and checkout UI stay unavailable until secure HTTP-only session integration, destination validation, concurrent duplicate protection, ownership-safe confirmation and failure/recovery tests pass. Sequential retry proof does not cover concurrent submissions or every gateway.

Browser/CSP/hydration and image processing are unverified; Local's Imagick warning remains. The previous dependency audit still has one unresolved high development advisory. No optional project PHP plugin was activated. No production action occurred.

The optional WP-CLI registry checksum check for WooCommerce/WPGraphQL ran without completing and was stopped; no checksum pass is claimed for those two plugins. Their downloads came from WordPress.org. The bridge ZIP checksum matched the upstream release digest. One public GraphQL preflight exceeded its 15-second timeout while other checks were running; the repeat completed successfully. Local performance under load remains unverified.

After this slice, `pnpm run verify` passed: engine/addon guard, lint (18 warnings, zero errors), workspace type checks and 74 unit tests in 14 files. The counts are this snapshot only: a later 2026-10-10 audit recorded 16 files / 125 tests on a moved working tree. The smoke script passed standalone TypeScript checking, both PHP helpers passed syntax checks, and the PowerShell launcher parsed successfully. The launcher was not started; no new browser/build claim is made.

## Corrections applied after later review

Two claims that circulated from this period have been corrected in their own documents, and are recorded here so the baseline is not read as endorsing them:

- Client provisioning has no runnable command. `docs/ecomos/operations/PROVISION.md` now states plainly that `pnpm --filter @ecom-os/cli provision` does not work and that only a validator + tests exist.
- `ADDONS=i18n,multi-payment` (the root `.env.example` default) and `ADDONS=rfq` both fail `predev`/`prebuild`, because only `plugins/dummy-addon` ships a `manifest.json`. See `EXTENDING.md` section 3.5 and `INSTALL.md` section 5.

Sources: [WooCommerce installation](https://woocommerce.com/document/installing-uninstalling-woocommerce/), [WPGraphQL installation](https://github.com/wp-graphql/wp-graphql), [commerce bridge release](https://github.com/wp-graphql/wp-graphql-woocommerce/releases/tag/v1.0.3). Versions and declared requirements were also checked through WordPress.org's plugin-information API.
