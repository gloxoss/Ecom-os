<?php
/**
 * PHP compatibility suite for the EcomOS backend and HPOS.
 *
 * Runs only against the real WordPress + WooCommerce environment booted by
 * bootstrap.php. It checks the plugins' actual HPOS compatibility registration
 * through the supported WooCommerce API, verifies HPOS is really enabled, does a
 * synthetic order round-trip through the HPOS order tables, and confirms the
 * Store API answers. Synthetic orders are registered for cleanup before the
 * first assertion so a failing check cannot leak them.
 *
 * Deliberately NOT used here, and why:
 *  - WP_VERSION: that constant exists only inside WordPress's own unit-test
 *    suite; a real boot exposes the version as the $wp_version global /
 *    get_bloginfo('version'). Asserting on WP_VERSION was asserting on nothing.
 *  - FeaturesUtil::has_compatibility(): this method does not exist in
 *    WooCommerce. The supported API is get_compatible_plugins_for_feature() /
 *    get_compatible_features_for_plugin(), available after woocommerce_init.
 *
 * Exit codes: 0 = suite passed, 1 = assertion failed, 2 = BLOCKED
 * (infrastructure missing or unsupported; compatibility is not certified).
 */

require_once __DIR__ . '/bootstrap.php';

use Automattic\WooCommerce\Utilities\FeaturesUtil;

$GLOBALS['ecomos_failures'] = array();

function ecomos_check($condition, $message) {
    if ($condition) {
        echo "PASS: {$message}\n";
        return;
    }
    $GLOBALS['ecomos_failures'][] = $message;
    fwrite(STDERR, "FAIL: {$message}\n");
}

function ecomos_blocked($reason) {
    fwrite(STDERR, "[SUITE-BLOCKED] {$reason}\n");
    fwrite(STDERR, "  Compatibility is NOT certified by this run.\n");
    exit(2);
}

// 0. Infrastructure re-validated after boot: the suite must never certify an
//    environment that silently booted without WooCommerce or the plugins.
if (!defined('WC_VERSION') || !class_exists('WooCommerce')) {
    ecomos_blocked('WooCommerce did not boot; cannot certify compatibility.');
}
foreach (array('wp-ecomos-addons/wp-ecomos-addons.php', 'wp-ecomos-operations/wp-ecomos-operations.php', 'wp-ecomos-rfq/wp-ecomos-rfq.php') as $ecomos_plugin) {
    if (!is_dir(rtrim(ABSPATH, '/') . '/wp-content/plugins/' . dirname($ecomos_plugin))) {
        ecomos_blocked("Required plugin {$ecomos_plugin} is not installed in the test environment.");
    }
}

$ecomos_required_basenames = array(
    'wp-ecomos-addons/wp-ecomos-addons.php',
    'wp-ecomos-operations/wp-ecomos-operations.php',
    'wp-ecomos-rfq/wp-ecomos-rfq.php',
);

// 1. Declared runtime versions are actually satisfied by what is running.
ecomos_check(
    version_compare(PHP_VERSION, '8.1.0', '>='),
    'PHP ' . PHP_VERSION . ' satisfies the declared minimum 8.1.0'
);

$ecomos_wp_version = get_bloginfo('version');
ecomos_check(
    $ecomos_wp_version && version_compare($ecomos_wp_version, '6.4.0', '>='),
    'WordPress ' . ($ecomos_wp_version ?: 'unknown') . ' (wp_version global, the real source) satisfies the declared minimum 6.4.0'
);

ecomos_check(
    version_compare(WC_VERSION, '8.5.0', '>='),
    'WooCommerce ' . WC_VERSION . ' satisfies the declared minimum 8.5.0'
);

// 2. HPOS compatibility is registered with WooCommerce through the supported API.
//    has_compatibility() does not exist; the feature-scoped query is the API.
if (!class_exists(FeaturesUtil::class) || !method_exists(FeaturesUtil::class, 'get_compatible_plugins_for_feature')) {
    ecomos_blocked('FeaturesUtil::get_compatible_plugins_for_feature() is unavailable; this WooCommerce is outside the supported compatibility API.');
}

$ecomos_hpos_plugins = FeaturesUtil::get_compatible_plugins_for_feature('custom_order_tables');
ecomos_check(
    is_array($ecomos_hpos_plugins) && isset($ecomos_hpos_plugins['compatible']),
    'WooCommerce returns a compatibility map for custom_order_tables'
);

$ecomos_hpos_compatible = isset($ecomos_hpos_plugins['compatible']) ? $ecomos_hpos_plugins['compatible'] : array();
$ecomos_hpos_incompatible = isset($ecomos_hpos_plugins['incompatible']) ? $ecomos_hpos_plugins['incompatible'] : array();
foreach ($ecomos_required_basenames as $ecomos_plugin) {
    ecomos_check(
        in_array($ecomos_plugin, $ecomos_hpos_compatible, true),
        "{$ecomos_plugin} is registered HPOS-compatible via get_compatible_plugins_for_feature('custom_order_tables')"
    );
    ecomos_check(
        !in_array($ecomos_plugin, $ecomos_hpos_incompatible, true),
        "{$ecomos_plugin} is not registered HPOS-incompatible"
    );
}

// 3. HPOS is actually enabled (feature flag AND authoritative data store), not
//    merely declared.
if (!class_exists('Automattic\WooCommerce\Utilities\OrderUtil')) {
    ecomos_blocked('OrderUtil is unavailable; HPOS verification cannot run.');
}
ecomos_check(
    \Automattic\WooCommerce\Utilities\OrderUtil::custom_orders_table_usage_is_enabled() === true,
    'HPOS custom order tables are enabled for data storage (woocommerce_custom_orders_table_enabled=yes effective)'
);

// 4. Synthetic order round-trip through the HPOS order tables.
$ecomos_order = wc_create_order(array('status' => 'pending'));
if (!$ecomos_order || is_wp_error($ecomos_order)) {
    ecomos_blocked('wc_create_order() failed before any assertion ran: ' . (is_wp_error($ecomos_order) ? $ecomos_order->get_error_message() : 'unknown error'));
}
$ecomos_order_id = $ecomos_order->get_id();
ecomos_tests_register_order_for_cleanup($ecomos_order_id);

try {
    ecomos_check($ecomos_order_id > 0, "wc_create_order() persists a new order (id {$ecomos_order_id})");

    $ecomos_reloaded = wc_get_order($ecomos_order_id);
    ecomos_check(
        $ecomos_reloaded && (int) $ecomos_reloaded->get_id() === (int) $ecomos_order_id,
        "wc_get_order({$ecomos_order_id}) returns the persisted order"
    );
    ecomos_check(
        $ecomos_reloaded && (int) $ecomos_reloaded->get_customer_id() === 0,
        'guest order keeps customer_id = 0 (guest purchase needs no account)'
    );

    global $wpdb;
    $ecomos_orders_table = $wpdb->prefix . 'wc_orders';
    $ecomos_has_hpos_table = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $ecomos_orders_table));
    ecomos_check(
        $ecomos_has_hpos_table === $ecomos_orders_table,
        "HPOS orders table {$ecomos_orders_table} exists"
    );
    if ($ecomos_has_hpos_table === $ecomos_orders_table) {
        $ecomos_in_hpos = (int) $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM `{$ecomos_orders_table}` WHERE id = %d", $ecomos_order_id)
        );
        ecomos_check(
            $ecomos_in_hpos === 1,
            "order {$ecomos_order_id} is stored in the HPOS orders table (not legacy post storage)"
        );
    }

    $ecomos_in_posts = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$wpdb->posts} WHERE ID = %d AND post_type = 'shop_order'",
        $ecomos_order_id
    ));
    ecomos_check(
        $ecomos_in_posts === 0,
        "order {$ecomos_order_id} has no legacy shop_order post (HPOS is the authoritative store)"
    );
} finally {
    // Cleanup runs even when an assertion above fails: registered in the
    // shutdown handler too, as a safety net for fatal errors.
    $ecomos_order->delete(true);
    ecomos_check(
        wc_get_order($ecomos_order_id) === false,
        "synthetic order {$ecomos_order_id} is deleted cleanly after the round-trip"
    );
}

// 5. The Store API is really registered and answering.
$ecomos_routes = rest_get_server()->get_routes();
ecomos_check(
    isset($ecomos_routes['/wc/store/v1/products']),
    'Store API route /wc/store/v1/products is registered'
);
if (isset($ecomos_routes['/wc/store/v1/products'])) {
    $ecomos_response = rest_do_request(new WP_REST_Request('GET', '/wc/store/v1/products'));
    ecomos_check(
        $ecomos_response->get_status() === 200,
        'GET /wc/store/v1/products returns 200 from the real Store API'
    );
}

if (!empty($GLOBALS['ecomos_failures'])) {
    fwrite(STDERR, sprintf("Backend compatibility suite FAILED with %d failure(s).\n", count($GLOBALS['ecomos_failures'])));
    exit(1);
}

echo "[SUITE-PASS] Backend compatibility suite passed against real WordPress "
    . $ecomos_wp_version . " / WooCommerce " . WC_VERSION . " / PHP " . PHP_VERSION . ".\n";
exit(0);
