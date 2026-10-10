<?php
/**
 * PHP Compatibility Test Suite for EcomOS Backend & HPOS.
 */

require_once __DIR__ . '/bootstrap.php';

use Automattic\WooCommerce\Utilities\FeaturesUtil;

function test_hpos_compatibility_declaration() {
    FeaturesUtil::declare_compatibility('custom_order_tables', 'wp-ecomos-addons.php', true);
    FeaturesUtil::declare_compatibility('custom_order_tables', 'wp-ecomos-operations.php', true);
    FeaturesUtil::declare_compatibility('custom_order_tables', 'wp-ecomos-rfq.php', true);

    assert(FeaturesUtil::has_compatibility('custom_order_tables', 'wp-ecomos-addons.php') === true);
    assert(FeaturesUtil::has_compatibility('custom_order_tables', 'wp-ecomos-operations.php') === true);
    assert(FeaturesUtil::has_compatibility('custom_order_tables', 'wp-ecomos-rfq.php') === true);
}

function test_version_constraints() {
    assert(version_compare(PHP_VERSION, '8.1.0', '>='));
    assert(version_compare(WC_VERSION, '8.5.0', '>='));
    assert(version_compare(WP_VERSION, '6.4.0', '>='));
}

test_hpos_compatibility_declaration();
test_version_constraints();

echo "Backend compatibility suite passed successfully.\n";
