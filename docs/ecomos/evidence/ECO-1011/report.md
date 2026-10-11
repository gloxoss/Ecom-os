# ECO-1011 — Declare HPOS compatibility and version headers on required plugins

**Commit:** `654a661` · **Surfaced by:** the corrected backend auditor (ECO-1007)

## The gap

Once `scripts/verify-backend-compatibility.ts` stopped hardcoding a pass, it reported
that none of the three shipped plugins declared WooCommerce HPOS support and none
carried a `WC requires at least:` header:

```
plugins/wp-ecomos-addons:     no real declare_compatibility('custom_order_tables', ...) call; no "WC requires at least:" header
plugins/wp-ecomos-operations: (same)
plugins/wp-ecomos-rfq:        (same, plus no "Requires PHP:" header)
-> overallStatus: FAIL, exit 1
```

## Repairs

`plugins/wp-ecomos-addons/wp-ecomos-addons.php`,
`plugins/wp-ecomos-operations/wp-ecomos-operations.php` and
`plugins/wp-ecomos-rfq/wp-ecomos-rfq.php` now declare compatibility on
`before_woocommerce_init`:

```php
\Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
```

Each header carries `Requires at least: 6.2`, `Requires PHP: 8.1` and
`WC requires at least: 8.5`.

## Verification

| Check | Result |
| --- | --- |
| `php -l` on each of the three plugins (PHP 8.2.29) | exit 0 each |
| `tsx scripts/verify-backend-compatibility.ts` | `overallStatus: "PASS"`, exit 0, all three `hasHposDeclaration: true`, `minWcVersion: "8.5"` |
| `php -l` on every PHP file under `plugins/` (excluding the wordpress-mcp submodule) | no syntax errors |

## What this proves, and what it does not

The declaration is metadata that stops WooCommerce warning about an untested plugin
on an HPOS site. **It is not a compatibility test.** Real HPOS behaviour (creating and
reading orders in the `wc_orders` tables) still requires the WordPress test suite,
which has no environment on this machine. `WC requires at least: 8.5` is a declared
minimum, not an observed result; `release/COMPATIBILITY.md` keeps declared and
executed versions separate.
