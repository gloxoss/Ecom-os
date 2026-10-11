<?php
/**
 * PHP test bootstrap for EcomOS backend compatibility.
 *
 * Boots a REAL WordPress + WooCommerce install against a DISPOSABLE test database
 * and loads the real EcomOS plugins, so the compatibility suite exercises actual
 * code instead of its own mocks. Earlier revisions (a) hardcode-stubbed
 * FeaturesUtil, (b) read WP_VERSION, a constant that only exists inside the
 * WordPress unit-test suite, and (c) passed with no WooCommerce installed at all.
 * There is deliberately no mock fallback now: when required infrastructure is
 * missing this bootstrap stops with exit code 2 (BLOCKED), never a PASS.
 *
 * This bootstrap installs WordPress from scratch on every run into the database
 * named by ECOM_OS_TEST_DB_NAME. It must never be pointed at a database holding
 * real merchant data:
 *   - The database is dropped and recreated unconditionally when
 *     ECOM_OS_CONFIRM_DISPOSABLE_DB=yes.
 *   - Without that confirmation an existing non-empty database is refused (BLOCKED).
 *   - The known local live database name is refused outright.
 *
 * Configuration (environment variables):
 *   ECOM_OS_WP_DIR              WordPress core directory (must contain wp-settings.php).
 *   ECOM_OS_WC_PLUGIN_DIR       WooCommerce plugin directory (must contain woocommerce.php).
 *   ECOM_OS_PLUGINS_DIR         Directory holding the EcomOS plugins. Defaults to the
 *                               repository's plugins/ directory.
 *   ECOM_OS_TEST_DB_NAME        Disposable test database name. Required.
 *   ECOM_OS_TEST_DB_HOST        MySQL host[:port]. Required.
 *   ECOM_OS_TEST_DB_USER        MySQL user. Default: root.
 *   ECOM_OS_TEST_DB_PASSWORD    MySQL password. Default: empty.
 *   ECOM_OS_TEST_TABLE_PREFIX   Table prefix for the test install. Default: wpt_.
 *   ECOM_OS_CONFIRM_DISPOSABLE_DB  Set to exactly "yes" to allow dropping/recreating
 *                               ECOM_OS_TEST_DB_NAME.
 *
 * Exit codes: 0 booted, 2 BLOCKED (infrastructure missing or unsafe configuration).
 */

/** @var string $ecomos_tests_dir Directory of this file (repository plugins/tests). */
$ecomos_tests_dir = __DIR__;

/**
 * Emit a BLOCKED diagnostic and stop. Missing infrastructure must never be
 * reported as a pass or a failure of the product; it is an unrun check.
 */
function ecomos_tests_blocked($reason) {
    fwrite(STDERR, "[BOOTSTRAP-BLOCKED] {$reason}\n");
    fwrite(STDERR, "  Compatibility is NOT certified by this run.\n");
    exit(2);
}

/**
 * Fail before boot when the run would be unsafe or infrastructure is missing.
 */
function ecomos_tests_require_env($name) {
    $value = getenv($name);
    if ($value === false || $value === '') {
        ecomos_tests_blocked("{$name} is not set. A real WordPress/WooCommerce environment is required.");
    }
    return rtrim($value, "/\\");
}

$ecomos_env = array(
    'wp_dir'       => ecomos_tests_require_env('ECOM_OS_WP_DIR'),
    'wc_dir'       => ecomos_tests_require_env('ECOM_OS_WC_PLUGIN_DIR'),
    'db_name'      => ecomos_tests_require_env('ECOM_OS_TEST_DB_NAME'),
    'db_host'      => ecomos_tests_require_env('ECOM_OS_TEST_DB_HOST'),
);

$ecomos_plugins_dir = getenv('ECOM_OS_PLUGINS_DIR');
if ($ecomos_plugins_dir === false || $ecomos_plugins_dir === '') {
    $ecomos_plugins_dir = dirname($ecomos_tests_dir);
}
$ecomos_plugins_dir = rtrim($ecomos_plugins_dir, "/\\");

$ecomos_db_user     = getenv('ECOM_OS_TEST_DB_USER');
$ecomos_db_user     = ($ecomos_db_user === false || $ecomos_db_user === '') ? 'root' : $ecomos_db_user;
$ecomos_db_password = getenv('ECOM_OS_TEST_DB_PASSWORD') ?: '';
$ecomos_table_prefix = getenv('ECOM_OS_TEST_TABLE_PREFIX') ?: 'wpt_';
$ecomos_confirm     = getenv('ECOM_OS_CONFIRM_DISPOSABLE_DB');

// 1. Required software present: WordPress core, WooCommerce, mysqli, the plugins.
if (!file_exists($ecomos_env['wp_dir'] . '/wp-settings.php')) {
    ecomos_tests_blocked("WordPress core not found at {$ecomos_env['wp_dir']} (set ECOM_OS_WP_DIR).");
}
if (!file_exists($ecomos_env['wc_dir'] . '/woocommerce.php')) {
    ecomos_tests_blocked("WooCommerce not found at {$ecomos_env['wc_dir']} (set ECOM_OS_WC_PLUGIN_DIR).");
}
if (!extension_loaded('mysqli')) {
    ecomos_tests_blocked('PHP mysqli extension is not loaded; MySQL-backed checks cannot run.');
}

$ecomos_required_plugins = array(
    'wp-ecomos-addons/wp-ecomos-addons.php',
    'wp-ecomos-operations/wp-ecomos-operations.php',
    'wp-ecomos-rfq/wp-ecomos-rfq.php',
);
foreach ($ecomos_required_plugins as $ecomos_plugin) {
    if (!file_exists($ecomos_plugins_dir . '/' . $ecomos_plugin)) {
        ecomos_tests_blocked("Required EcomOS plugin {$ecomos_plugin} not found under {$ecomos_plugins_dir}.");
    }
}

// 2. Disposable-database interlock.
$ecomos_refused_databases = array('ecomos_wp');
if (in_array(strtolower($ecomos_env['db_name']), $ecomos_refused_databases, true)) {
    ecomos_tests_blocked("Refusing to run against '{$ecomos_env['db_name']}' (known non-disposable local database).");
}

// PHP 8.1+ mysqli throws mysqli_sql_exception by default; connection problems
// must surface as BLOCKED, not as an uncaught fatal.
mysqli_report(MYSQLI_REPORT_OFF);
$ecomos_db = mysqli_init();
try {
    $ecomos_connected = $ecomos_db->real_connect($ecomos_env['db_host'], $ecomos_db_user, $ecomos_db_password, null);
} catch (Throwable $ecomos_connect_error) {
    $ecomos_connected = false;
}
if (!$ecomos_connected) {
    ecomos_tests_blocked('Could not connect to MySQL at ' . $ecomos_env['db_host'] . ' (disposable test database server unreachable).');
}

$ecomos_db_exists = null;
$ecomos_result = $ecomos_db->query("SHOW DATABASES LIKE '" . $ecomos_db->real_escape_string($ecomos_env['db_name']) . "'");
if ($ecomos_result) {
    $ecomos_row = $ecomos_result->fetch_assoc();
    $ecomos_db_exists = $ecomos_row !== null;
}

if ($ecomos_db_exists) {
    $ecomos_count = $ecomos_db->query(
        "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = '" . $ecomos_db->real_escape_string($ecomos_env['db_name']) . "'"
    );
    $ecomos_table_count = $ecomos_count ? (int) $ecomos_count->fetch_assoc()['c'] : -1;

    if ($ecomos_table_count > 0 && $ecomos_confirm !== 'yes') {
        ecomos_tests_blocked(
            "Database '{$ecomos_env['db_name']}' already exists and is not empty. Set ECOM_OS_CONFIRM_DISPOSABLE_DB=yes "
            . "to allow wiping a disposable test database, or point ECOM_OS_TEST_DB_NAME at an empty one."
        );
    }
    if (!$ecomos_db->query("DROP DATABASE `" . str_replace('`', '', $ecomos_env['db_name']) . "`")) {
        ecomos_tests_blocked('Could not drop the disposable database: ' . $ecomos_db->error);
    }
}
if (!$ecomos_db->query("CREATE DATABASE `" . str_replace('`', '', $ecomos_env['db_name']) . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci")) {
    ecomos_tests_blocked('Could not create the disposable test database: ' . $ecomos_db->error);
}
$ecomos_db->close();

// 3. Install WordPress core when the disposable database is still empty.
//
// A normal boot against an empty database never reaches the test code:
// wp_not_installed() silently redirects and exits. Core installation therefore
// runs in a child process with WP_INSTALLING defined (the wp-cli pattern),
// after which this process boots normally.
$ecomos_phase = getenv('ECOM_OS_BOOTSTRAP_PHASE');
$ecomos_core_installed = false;
$ecomos_probe = mysqli_connect($ecomos_env['db_host'], $ecomos_db_user, $ecomos_db_password, $ecomos_env['db_name']);
if ($ecomos_probe) {
    mysqli_report(MYSQLI_REPORT_OFF);
    $ecomos_probe_result = $ecomos_probe->query("SHOW TABLES LIKE '" . $ecomos_probe->real_escape_string($ecomos_table_prefix . 'options') . "'");
    $ecomos_core_installed = $ecomos_probe_result && $ecomos_probe_result->fetch_row() !== null;
    $ecomos_probe->close();
}

if (!$ecomos_core_installed && $ecomos_phase !== 'install') {
    $ecomos_child_cmd = escapeshellarg(PHP_BINARY);
    $ecomos_ini = php_ini_loaded_file();
    if ($ecomos_ini) {
        $ecomos_child_cmd .= ' -c ' . escapeshellarg($ecomos_ini);
    }
    $ecomos_child_cmd .= ' ' . escapeshellarg(__FILE__);

    putenv('ECOM_OS_BOOTSTRAP_PHASE=install');
    passthru($ecomos_child_cmd, $ecomos_child_rc);
    putenv('ECOM_OS_BOOTSTRAP_PHASE');

    if ($ecomos_child_rc !== 0) {
        ecomos_tests_blocked("WordPress core installation failed in the child process (exit {$ecomos_child_rc}).");
    }
    // Re-verify: the child must have created the options table.
    $ecomos_verify = mysqli_connect($ecomos_env['db_host'], $ecomos_db_user, $ecomos_db_password, $ecomos_env['db_name']);
    mysqli_report(MYSQLI_REPORT_OFF);
    $ecomos_verify_result = $ecomos_verify ? $ecomos_verify->query("SHOW TABLES LIKE '" . ($ecomos_verify->real_escape_string($ecomos_table_prefix . 'options')) . "'") : false;
    if (!$ecomos_verify_result || $ecomos_verify_result->fetch_row() === null) {
        ecomos_tests_blocked('WordPress core installation reported success but the options table is missing.');
    }
    if ($ecomos_verify) {
        $ecomos_verify->close();
    }
}

if ($ecomos_phase === 'install') {
    define('WP_INSTALLING', true);
}

// 4. Sync the real EcomOS plugins into the test install's plugins directory so
//    plugin_basename() (and therefore FeaturesUtil compatibility registration)
//    sees the canonical 'directory/file.php' plugin names. Not needed in the
//    install phase, which loads no plugins.
if ($ecomos_phase !== 'install') {
    $ecomos_test_plugins_dir = $ecomos_env['wp_dir'] . '/wp-content/plugins';
    foreach ($ecomos_required_plugins as $ecomos_plugin) {
        $ecomos_dir_name = dirname($ecomos_plugin);
        $ecomos_target = $ecomos_test_plugins_dir . '/' . $ecomos_dir_name;
        if (is_dir($ecomos_target)) {
            ecomos_tests_rrmdir($ecomos_target);
        }
        ecomos_tests_rcopy($ecomos_plugins_dir . '/' . $ecomos_dir_name, $ecomos_target);
    }
}

/**
 * Recursive copy used only to mirror plugin sources into the disposable install.
 */
function ecomos_tests_rcopy($source, $target) {
    @mkdir($target, 0777, true);
    $ecomos_entries = scandir($source);
    foreach ($ecomos_entries as $ecomos_entry) {
        if ($ecomos_entry === '.' || $ecomos_entry === '..') {
            continue;
        }
        if (is_dir($source . '/' . $ecomos_entry)) {
            ecomos_tests_rcopy($source . '/' . $ecomos_entry, $target . '/' . $ecomos_entry);
        } else {
            copy($source . '/' . $ecomos_entry, $target . '/' . $ecomos_entry);
        }
    }
}

/**
 * Recursive delete used only inside the disposable install's plugins directory.
 */
function ecomos_tests_rrmdir($target) {
    if (!is_dir($target)) {
        return;
    }
    $ecomos_entries = scandir($target);
    foreach ($ecomos_entries as $ecomos_entry) {
        if ($ecomos_entry === '.' || $ecomos_entry === '..') {
            continue;
        }
        if (is_dir($target . '/' . $ecomos_entry)) {
            ecomos_tests_rrmdir($target . '/' . $ecomos_entry);
        } else {
            unlink($target . '/' . $ecomos_entry);
        }
    }
    rmdir($target);
}

// 4. Boot WordPress with a minimal CLI server environment.
$_SERVER['HTTP_HOST']     = 'localhost';
$_SERVER['SERVER_NAME']   = 'localhost';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR']   = '127.0.0.1';
$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
$_SERVER['PHP_SELF']      = '/index.php';
$_SERVER['SCRIPT_NAME']   = '/index.php';

define('ABSPATH', $ecomos_env['wp_dir'] . '/');
define('DB_NAME', $ecomos_env['db_name']);
define('DB_USER', $ecomos_db_user);
define('DB_PASSWORD', $ecomos_db_password);
define('DB_HOST', $ecomos_env['db_host']);
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');
define('WP_DEBUG', true);
define('WP_DEBUG_DISPLAY', false);
$table_prefix = $ecomos_table_prefix;

require_once ABSPATH . 'wp-includes/plugin.php';

/**
 * Load the real EcomOS plugins BEFORE WooCommerce so their
 * before_woocommerce_init handlers are registered when WooCommerce fires that
 * hook during its own load; FeaturesUtil::declare_compatibility() only records
 * declarations made inside that hook.
 */
function ecomos_tests_load_plugins() {
    global $ecomos_test_plugins_dir, $ecomos_env, $wpdb;
    update_option('woocommerce_custom_orders_table_enabled', 'yes', true);

    // WooCommerce queries its own tables during boot, before WC_Install has
    // created them in this fresh install. Those expected boot-time warnings are
    // suppressed here and un-suppressed once installation has finished, so the
    // suite's own checks still surface real database errors.
    $wpdb->suppress_errors(true);

    require_once $ecomos_test_plugins_dir . '/wp-ecomos-addons/wp-ecomos-addons.php';
    require_once $ecomos_test_plugins_dir . '/wp-ecomos-operations/wp-ecomos-operations.php';
    require_once $ecomos_test_plugins_dir . '/wp-ecomos-rfq/wp-ecomos-rfq.php';
    require_once $ecomos_env['wc_dir'] . '/woocommerce.php';
}
if ($ecomos_phase !== 'install') {
    add_action('muplugins_loaded', 'ecomos_tests_load_plugins', 5);
}

require ABSPATH . 'wp-settings.php';

if ($ecomos_phase === 'install') {
    // Install phase: create the core tables and stop. WooCommerce and the
    // EcomOS plugins are not loaded in this process.
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    $ecomos_install_result = wp_install(
        'EcomOS Compatibility Tests',
        'ecomos-tests',
        'compat-tests@example.invalid',
        false,
        '',
        wp_generate_password(24, false),
        ''
    );
    if (is_wp_error($ecomos_install_result)) {
        fwrite(STDERR, '[BOOTSTRAP-BLOCKED] wp_install() failed: ' . $ecomos_install_result->get_error_message() . "\n");
        exit(2);
    }
    exit(0);
}

// 5. Install WooCommerce tables after full boot (pluggables loaded), the same
//    sequence wp-cli uses for `wp wc install`. WooCommerce queries its tables
//    during boot, before they exist; those boot-time warnings are expected and
//    suppressed until installation has completed. Real database errors during
//    the checks themselves remain visible to the suite.
global $wpdb;
$ecomos_prior_suppression = $wpdb->suppress_errors(true);
if (class_exists('WC_Install')) {
    WC_Install::install();
}
$wpdb->flush();
$wpdb->suppress_errors($ecomos_prior_suppression);

// 6. Track every synthetic order so it is deleted even when assertions fail.
$GLOBALS['ecomos_test_order_ids'] = array();

/**
 * Register a synthetic order for cleanup (runs on shutdown as a safety net).
 */
function ecomos_tests_register_order_for_cleanup($order_id) {
    $GLOBALS['ecomos_test_order_ids'][] = (int) $order_id;
}

register_shutdown_function(function () {
    if (empty($GLOBALS['ecomos_test_order_ids'])) {
        return;
    }
    foreach (array_unique($GLOBALS['ecomos_test_order_ids']) as $ecomos_order_id) {
        $ecomos_order = function_exists('wc_get_order') ? wc_get_order($ecomos_order_id) : false;
        if ($ecomos_order) {
            $ecomos_order->delete(true);
        }
    }
    $GLOBALS['ecomos_test_order_ids'] = array();
});
