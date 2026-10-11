<?php
/**
 * PHP compatibility suite for the EcomOS backend and HPOS.
 *
 * Runs only against a real WordPress + WooCommerce environment loaded by bootstrap.php.
 * It exercises real HPOS order storage, the real Store API route registry, and the
 * plugins' actual compatibility declarations.
 *
 * It does NOT declare compatibility itself and then assert on that declaration: the
 * previous revision called FeaturesUtil::declare_compatibility() and immediately
 * asserted has_compatibility(), which passed on the bootstrap's own stub and proved
 * nothing about the plugins.
 */

require_once __DIR__ . '/bootstrap.php';

use Automattic\WooCommerce\Utilities\FeaturesUtil;

$GLOBALS['ecomos_failures'] = array();

function ecomos_check($condition, $message)
{
    if ($condition) {
        echo "PASS: {$message}\n";
        return;
    }
    $GLOBALS['ecomos_failures'][] = $message;
    fwrite(STDERR, "FAIL: {$message}\n");
}

function ecomos_plugins_dir()
{
    $dir = getenv('ECOM_OS_PLUGINS_DIR');
    if (!$dir) {
        $dir = dirname(__DIR__);
    }
    return rtrim($dir, "/\\");
}

function ecomos_required_plugins()
{
    return array(
        'wp-ecomos-addons/wp-ecomos-addons.php',
        'wp-ecomos-operations/wp-ecomos-operations.php',
        'wp-ecomos-rfq/wp-ecomos-rfq.php',
    );
}

// 1. Declared runtime versions are actually supported by what is running.
ecomos_check(
    version_compare(PHP_VERSION, '8.1.0', '>='),
    'PHP ' . PHP_VERSION . ' satisfies the declared minimum 8.1.0'
);
ecomos_check(
    defined('WP_VERSION') && version_compare(WP_VERSION, '6.4.0', '>='),
    'WordPress ' . (defined('WP_VERSION') ? WP_VERSION : 'unknown') . ' satisfies the declared minimum 6.4.0'
);
ecomos_check(
    defined('WC_VERSION') && version_compare(WC_VERSION, '8.5.0', '>='),
    'WooCommerce ' . (defined('WC_VERSION') ? WC_VERSION : 'unknown') . ' satisfies the declared minimum 8.5.0'
);

// 2. The EcomOS plugins really declare HPOS compatibility, rather than mentioning it.
$ecomos_plugins_dir = ecomos_plugins_dir();
foreach (ecomos_required_plugins() as $ecomos_plugin) {
    $ecomos_plugin_path = $ecomos_plugins_dir . '/' . $ecomos_plugin;
    ecomos_check(
        file_exists($ecomos_plugin_path),
        "{$ecomos_plugin} is present"
    );
    ecomos_check(
        FeaturesUtil::has_compatibility('custom_order_tables', $ecomos_plugin_path) === true,
        "{$ecomos_plugin} declares HPOS compatibility (custom_order_tables)"
    );
}

// 3. Real HPOS order round-trip through WooCommerce order storage.
$ecomos_order = wc_create_order(array('status' => 'pending'));
ecomos_check(
    $ecomos_order && $ecomos_order->get_id() > 0,
    'wc_create_order() persists a new order'
);

if ($ecomos_order && $ecomos_order->get_id() > 0) {
    $ecomos_order_id = $ecomos_order->get_id();
    $ecomos_reloaded = wc_get_order($ecomos_order_id);
    ecomos_check(
        $ecomos_reloaded && $ecomos_reloaded->get_id() === $ecomos_order_id,
        "wc_get_order({$ecomos_order_id}) returns the persisted order"
    );
    ecomos_check(
        $ecomos_reloaded && $ecomos_reloaded->get_customer_id() === 0,
        'guest order keeps customer_id = 0 (guest purchase needs no account)'
    );

    global $wpdb;
    $ecomos_orders_table = $wpdb->prefix . 'wc_orders';
    $ecomos_has_hpos_table = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $ecomos_orders_table));
    ecomos_check(
        $ecomos_has_hpos_table === $ecomos_orders_table,
        "HPOS orders table {$ecomos_orders_table} exists (enable woocommerce_custom_orders_table_enabled=yes)"
    );
    if ($ecomos_has_hpos_table === $ecomos_orders_table) {
        $ecomos_in_hpos = $wpdb->get_var(
            $wpdb->prepare("SELECT COUNT(*) FROM `{$ecomos_orders_table}` WHERE id = %d", $ecomos_order_id)
        );
        ecomos_check(
            (int) $ecomos_in_hpos === 1,
            "order {$ecomos_order_id} is stored in the HPOS orders table"
        );
    }

    $ecomos_order->delete(true);
    ecomos_check(
        wc_get_order($ecomos_order_id) === false,
        "order {$ecomos_order_id} is deleted cleanly after the round-trip"
    );
}

// 4. The Store API is really registered and answering.
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
    fwrite(STDERR, sprintf(
        "Backend compatibility suite FAILED with %d failure(s).\n",
        count($GLOBALS['ecomos_failures'])
    ));
    exit(1);
}

echo "Backend compatibility suite passed against real WordPress/WooCommerce.\n";
