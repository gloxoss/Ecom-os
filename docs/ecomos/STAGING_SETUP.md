# Local staging baseline, 2026-10-09

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

Proposed free plugins, approval pending:

1. WooCommerce 11.2.1 from WordPress.org. Registry declares WordPress >=7.0, PHP >=7.4, tested through 7.1.3.
2. WPGraphQL 2.23.1 from WordPress.org. Registry declares WordPress >=6.0, PHP >=7.4, tested through 7.0.7. Compatibility with this WordPress version must be tested.
3. WPGraphQL for eCommerce 1.0.3, upstream `wp-graphql/wp-graphql-woocommerce` release ZIP. It bridges the current product queries to WooCommerce. Upstream asset SHA-256: `202099867ce7b7bc9e1d5ed133096a534f11259f6a465732ec6e24b8e9d0d5b2`.

These are existing GPL open-source integrations with no paid addon or subscription proposed. Upstream compatibility and maintenance must be checked on this exact staging stack before release. Optional project plugins stay disabled until their acceptance checks pass.

Rollback: deactivate added plugins, then restore the database and wp-config/wp-content snapshot if activation changes must be removed. Restore is a separate consequential operation and must target this same isolated site. Removing plugins alone does not undo WooCommerce database changes.

## Repeatable public preflight

Run `pnpm exec tsx scripts/probe-woocommerce.ts http://paraloca.local`. The script prints only public capability/status summaries and token presence, never token values. A nonzero exit means prerequisites are missing. A successful preflight does not prove cart updates or checkout.

After approved installation: verify schemas/versions, configure local-only adapter URLs and appropriate API credentials, create clearly marked synthetic fixtures, and test a backend guest cart plus COD order with authoritative shipping/tax totals. No real payments or production actions.

Sources: [WooCommerce installation](https://woocommerce.com/document/installing-uninstalling-woocommerce/), [WPGraphQL installation](https://github.com/wp-graphql/wp-graphql), [commerce bridge release](https://github.com/wp-graphql/wp-graphql-woocommerce/releases/tag/v1.0.3). Versions and declared requirements were also checked through WordPress.org's plugin-information API.
