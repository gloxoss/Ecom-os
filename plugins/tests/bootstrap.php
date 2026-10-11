<?php
/**
 * PHP test bootstrap for EcomOS backend compatibility.
 *
 * Loads the real WordPress + WooCommerce test environment so compatibility checks run
 * against actual code. An earlier revision hardcoded WC_VERSION/WP_VERSION and defined
 * a local FeaturesUtil stub here, which made the "compatibility" suite assert on its
 * own mock and pass with no WooCommerce installed. There is deliberately no mock
 * fallback now: if the real environment is absent this bootstrap stops with a non-zero
 * exit instead of silently certifying nothing.
 *
 * Configuration (environment variables):
 *   ECOM_OS_WP_TESTS_DIR  WordPress core test suite directory (must contain
 *                         includes/bootstrap.php). Falls back to WP_TESTS_DIR, then to
 *                         the conventional sys_get_temp_dir()/wordpress-tests-lib.
 *   ECOM_OS_WC_PLUGIN_DIR WooCommerce plugin directory (must contain woocommerce.php).
 *   ECOM_OS_PLUGINS_DIR   Directory holding the EcomOS plugins to load. Defaults to the
 *                         repo's plugins/ directory.
 */

$ecomos_wp_tests_dir = getenv('ECOM_OS_WP_TESTS_DIR');
if (!$ecomos_wp_tests_dir) {
    $ecomos_wp_tests_dir = getenv('WP_TESTS_DIR');
}
if (!$ecomos_wp_tests_dir) {
    $ecomos_wp_tests_dir = rtrim(sys_get_temp_dir(), "/\\") . '/wordpress-tests-lib';
}
$ecomos_wp_tests_dir = rtrim($ecomos_wp_tests_dir, "/\\");

$ecomos_functions = $ecomos_wp_tests_dir . '/includes/functions.php';
$ecomos_bootstrap = $ecomos_wp_tests_dir . '/includes/bootstrap.php';

if (!file_exists($ecomos_functions) || !file_exists($ecomos_bootstrap)) {
    fwrite(STDERR, "[BOOTSTRAP-BLOCKED] Real WordPress/WooCommerce test environment not configured.\n");
    fwrite(STDERR, "  Looked for: {$ecomos_bootstrap}\n");
    fwrite(STDERR, "  Set ECOM_OS_WP_TESTS_DIR to the WordPress test suite directory so HPOS\n");
    fwrite(STDERR, "  declarations and Store API calls are exercised against real code.\n");
    fwrite(STDERR, "  No stub is substituted; compatibility is NOT certified by this run.\n");
    exit(2);
}

$ecomos_wc_plugin_dir = getenv('ECOM_OS_WC_PLUGIN_DIR');
$ecomos_plugins_dir = getenv('ECOM_OS_PLUGINS_DIR');
if (!$ecomos_plugins_dir) {
    $ecomos_plugins_dir = dirname(__DIR__);
}
$ecomos_plugins_dir = rtrim($ecomos_plugins_dir, "/\\");

if (!$ecomos_wc_plugin_dir) {
    fwrite(STDERR, "[BOOTSTRAP-WARN] ECOM_OS_WC_PLUGIN_DIR is unset; WooCommerce will not be loaded.\n");
    fwrite(STDERR, "[BOOTSTRAP-WARN] HPOS and Store API checks will fail until it points at the plugin.\n");
} else {
    $ecomos_wc_plugin_dir = rtrim($ecomos_wc_plugin_dir, "/\\");
}

require_once $ecomos_functions;

/**
 * Load WooCommerce and the EcomOS plugins as must-use plugins before WordPress boots,
 * so their HPOS declarations and hooks are registered for the test run.
 */
tests_add_filter('muplugins_loaded', function () use ($ecomos_wc_plugin_dir, $ecomos_plugins_dir) {
    if ($ecomos_wc_plugin_dir && file_exists($ecomos_wc_plugin_dir . '/woocommerce.php')) {
        require_once $ecomos_wc_plugin_dir . '/woocommerce.php';
    }

    $ecomos_plugin_files = array(
        'wp-ecomos-addons/wp-ecomos-addons.php',
        'wp-ecomos-operations/wp-ecomos-operations.php',
        'wp-ecomos-rfq/wp-ecomos-rfq.php',
    );
    foreach ($ecomos_plugin_files as $ecomos_plugin_file) {
        $ecomos_path = $ecomos_plugins_dir . '/' . $ecomos_plugin_file;
        if (file_exists($ecomos_path)) {
            require_once $ecomos_path;
        }
    }
});

require_once $ecomos_bootstrap;
