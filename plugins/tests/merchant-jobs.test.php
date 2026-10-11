<?php
/**
 * Live capability-scoped merchant jobs and addon lifecycle acceptance.
 *
 * Boots the real WordPress + WooCommerce install from bootstrap.php and does the
 * jobs through the real APIs with real users carrying the real roles, instead of
 * asserting on a role matrix array. It checks three things the contract suites
 * cannot: that a store manager can actually finish a job, that unprivileged staff
 * are refused, and that switching an existing addon on and off changes what the
 * backend permits without touching core catalog or orders.
 *
 * Deliberately NOT verified here:
 *  - The admin-page redirect in ecomos_enforce_admin_boundaries(): it ends in
 *    wp_die(), which terminates the process, so it cannot be asserted in-process.
 *    Its page list and guard are covered by the source contract suites instead.
 *  - A real browser session. Capability decisions are checked at the layer that
 *    makes them (ecomos_check_permission / ecomos_rest_require_capability).
 *
 * Exit codes: 0 = suite passed, 1 = assertion failed, 2 = BLOCKED (infrastructure
 * missing; merchant jobs are not certified by the run).
 */

require_once __DIR__ . '/bootstrap.php';

$GLOBALS['ecomos_failures'] = array();

function ecomos_check($condition, $message) {
    if ($condition) {
        echo "PASS: {$message}\n";
        return;
    }
    $GLOBALS['ecomos_failures'][] = $message;
    fwrite(STDERR, "FAIL: {$message}\n");
}

function ecomos_jobs_blocked($reason) {
    fwrite(STDERR, "[SUITE-BLOCKED] {$reason}\n");
    fwrite(STDERR, "  Merchant jobs are NOT certified by this run.\n");
    exit(2);
}

function ecomos_section($title) {
    echo "\n--- {$title} ---\n";
}

// 0. The environment must really be the one this suite claims to test.

if (!defined('WC_VERSION') || !class_exists('WooCommerce')) {
    ecomos_jobs_blocked('WooCommerce did not boot; merchant jobs cannot be exercised.');
}
foreach (array('ecomos_check_permission', 'ecomos_rest_require_capability', 'ecomos_addon_install', 'ecomos_addon_migrate_up', 'ecomos_addon_deactivate') as $ecomos_required_function) {
    if (!function_exists($ecomos_required_function)) {
        ecomos_jobs_blocked("Required function {$ecomos_required_function}() is not loaded from the EcomOS plugins.");
    }
}

global $wpdb;
$ecomos_prefix = $wpdb->prefix;

// 1. The role model is really registered in this install, and the pre-existing
//    WordPress roles survived.

ecomos_section('Role model');

$ecomos_operator_role = get_role('ecomos_operator');
$ecomos_fulfillment_role = get_role('ecomos_fulfillment');
ecomos_check($ecomos_operator_role !== null, "role ecomos_operator is registered in WordPress");
ecomos_check($ecomos_fulfillment_role !== null, "role ecomos_fulfillment is registered in WordPress");
ecomos_check(get_role('administrator') !== null && get_role('subscriber') !== null, 'core WordPress roles survived staff role registration');

if ($ecomos_operator_role === null || $ecomos_fulfillment_role === null) {
    ecomos_jobs_blocked('Staff roles are not registered; every job check below would be meaningless.');
}

// 2. Real users, one per role.

$ecomos_admin_ids = get_users(array('role' => 'administrator', 'number' => 1, 'fields' => 'ID'));
if (empty($ecomos_admin_ids)) {
    ecomos_jobs_blocked('No administrator exists in the test install.');
}
$ecomos_admin_id = (int) $ecomos_admin_ids[0];

$ecomos_user_specs = array(
    'operator'    => array('ecomos_test_operator', 'ecomos_operator'),
    'fulfillment' => array('ecomos_test_fulfillment', 'ecomos_fulfillment'),
    'subscriber'  => array('ecomos_test_subscriber', 'subscriber'),
);
$ecomos_users = array();
foreach ($ecomos_user_specs as $ecomos_key => $ecomos_spec) {
    $ecomos_user_id = wp_insert_user(array(
        'user_login' => $ecomos_spec[0],
        'user_pass'  => wp_generate_password(20),
        'user_email' => $ecomos_spec[0] . '@example.invalid',
        'role'       => $ecomos_spec[1],
    ));
    if (is_wp_error($ecomos_user_id)) {
        ecomos_jobs_blocked('Could not create the ' . $ecomos_key . ' test user: ' . $ecomos_user_id->get_error_message());
    }
    $ecomos_users[$ecomos_key] = (int) $ecomos_user_id;
}
$ecomos_operator = get_userdata($ecomos_users['operator']);
$ecomos_fulfillment = get_userdata($ecomos_users['fulfillment']);
$ecomos_subscriber = get_userdata($ecomos_users['subscriber']);
ecomos_check(
    in_array('ecomos_operator', (array) $ecomos_operator->roles, true),
    'the operator test user really carries the ecomos_operator role'
);

// 3. A store manager finishes real jobs.

ecomos_section('Store manager jobs');

$ecomos_product = new WC_Product_Simple();
$ecomos_product->set_name('EcomOS merchant job product');
$ecomos_product->set_regular_price('120');
$ecomos_product->set_manage_stock(true);
$ecomos_product->set_stock_quantity(7);
$ecomos_product_id = $ecomos_product->save();
ecomos_check($ecomos_product_id > 0, 'a synthetic catalog product exists to work on');

// 3a. Edit stock.
ecomos_check(
    ecomos_check_permission('manage_inventory', $ecomos_users['operator']) === true,
    'operator is permitted the manage_inventory job'
);
wc_update_product_stock($ecomos_product_id, 3, 'set');
$ecomos_stock_reread = wc_get_product($ecomos_product_id);
ecomos_check(
    $ecomos_stock_reread && (int) $ecomos_stock_reread->get_stock_quantity() === 3,
    'the manager stock edit reached the product (stock is 3 when re-read)'
);

// 3b. Process a synthetic order.
$ecomos_order = wc_create_order();
$ecomos_order->add_product(wc_get_product($ecomos_product_id), 2);
$ecomos_order->set_status('pending');
$ecomos_order->calculate_totals();
$ecomos_order->save();
$ecomos_order_id = $ecomos_order->get_id();
ecomos_tests_register_order_for_cleanup($ecomos_order_id);
ecomos_check($ecomos_order_id > 0, 'a synthetic order exists to process');

ecomos_check(
    ecomos_check_permission('update_order_status', $ecomos_users['operator']) === true,
    'operator is permitted the update_order_status job'
);
$ecomos_order->update_status('processing', 'EcomOS merchant job acceptance');
$ecomos_order_reread = wc_get_order($ecomos_order_id);
ecomos_check(
    $ecomos_order_reread && $ecomos_order_reread->get_status() === 'processing',
    'the manager status change persisted (order is processing when re-read)'
);
$ecomos_order_row = $wpdb->get_var($wpdb->prepare(
    "SELECT id FROM {$ecomos_prefix}wc_orders WHERE id = %d",
    $ecomos_order_id
));
ecomos_check(
    (int) $ecomos_order_row === $ecomos_order_id,
    'the processed order lives in the HPOS orders table, not legacy post storage'
);

// The order for 2 units legitimately reduces stock, so the baseline for every
// "nothing else touched the catalog" check below is the stock after processing,
// not the 3 the manager set.
$ecomos_stock_after_order = wc_get_product($ecomos_product_id);
$ecomos_stock_baseline = $ecomos_stock_after_order ? (int) $ecomos_stock_after_order->get_stock_quantity() : null;
ecomos_check(
    $ecomos_stock_baseline === 1,
    'processing the order reduced stock by the ordered quantity (3 - 2 = 1), so WooCommerce accounting still runs'
);

// 3c. Change homepage content.
$ecomos_page_id = wp_insert_post(array(
    'post_title'   => 'EcomOS homepage under test',
    'post_content' => 'content before the merchant job',
    'post_status'  => 'publish',
    'post_type'    => 'page',
));
ecomos_check($ecomos_page_id > 0 && !is_wp_error($ecomos_page_id), 'a synthetic page exists to edit');
update_option('show_on_front', 'page');
update_option('page_on_front', $ecomos_page_id);
ecomos_check(
    (int) get_option('page_on_front') === (int) $ecomos_page_id,
    'the synthetic page is the configured front page'
);
ecomos_check(
    ecomos_check_permission('manage_content', $ecomos_users['operator']) === true,
    'operator is permitted the manage_content job'
);
wp_update_post(array('ID' => $ecomos_page_id, 'post_content' => 'content after the merchant job'));
ecomos_check(
    get_post_field('post_content', $ecomos_page_id) === 'content after the merchant job',
    'the manager content change persisted on the front page'
);

// 4. Wrong-role staff fail closed, with 403 rather than a silent allow.

ecomos_section('Fail-closed boundaries');

$ecomos_all_jobs = array(
    'view_orders', 'update_order_status', 'manage_products', 'manage_inventory',
    'manage_coupons', 'manage_content', 'quotes', 'technical_settings',
);

$ecomos_subscriber_denied = true;
foreach ($ecomos_all_jobs as $ecomos_job) {
    if (ecomos_check_permission($ecomos_job, $ecomos_users['subscriber']) !== false) {
        $ecomos_subscriber_denied = false;
        fwrite(STDERR, "  subscriber was permitted the '{$ecomos_job}' job\n");
    }
}
ecomos_check($ecomos_subscriber_denied, 'a subscriber is refused every job, including with the quotes addon off');

wp_set_current_user($ecomos_users['subscriber']);
$ecomos_subscriber_403 = true;
foreach ($ecomos_all_jobs as $ecomos_job) {
    $ecomos_result = ecomos_rest_require_capability($ecomos_job);
    $ecomos_data = is_wp_error($ecomos_result) ? $ecomos_result->get_error_data() : null;
    if (!is_wp_error($ecomos_result) || !is_array($ecomos_data) || (int) ($ecomos_data['status'] ?? 0) !== 403) {
        $ecomos_subscriber_403 = false;
        fwrite(STDERR, "  subscriber REST check for '{$ecomos_job}' did not return a 403 WP_Error\n");
    }
}
ecomos_check($ecomos_subscriber_403, 'REST permission callbacks return 403 WP_Error for a subscriber on every protected job');
wp_set_current_user(0);

$ecomos_fulfillment_expected = array(
    'view_orders'          => true,
    'update_order_status'  => true,
    'manage_products'      => false,
    'manage_inventory'     => false,
    'manage_coupons'       => false,
    'manage_content'       => false,
    'quotes'               => false,
    'technical_settings'   => false,
);
$ecomos_fulfillment_ok = true;
foreach ($ecomos_fulfillment_expected as $ecomos_job => $ecomos_expected) {
    $ecomos_actual = ecomos_check_permission($ecomos_job, $ecomos_users['fulfillment']);
    if ($ecomos_actual !== $ecomos_expected) {
        $ecomos_fulfillment_ok = false;
        fwrite(STDERR, sprintf(
            "  fulfillment clerk '{$ecomos_job}': expected %s, got %s\n",
            $ecomos_expected ? 'allowed' : 'denied',
            $ecomos_actual ? 'allowed' : 'denied'
        ));
    }
}
ecomos_check($ecomos_fulfillment_ok, 'a fulfillment clerk may view and progress orders but not edit products, stock, coupons or content');

$ecomos_technical_caps = array('manage_options', 'edit_plugins', 'activate_plugins', 'edit_themes', 'edit_files', 'unfiltered_html');
$ecomos_no_technical = true;
foreach ($ecomos_technical_caps as $ecomos_cap) {
    if (user_can($ecomos_operator, $ecomos_cap)) {
        $ecomos_no_technical = false;
        fwrite(STDERR, "  store manager unexpectedly holds '{$ecomos_cap}'\n");
    }
}
ecomos_check($ecomos_no_technical, 'the store manager holds no technical capability, so settings and secrets stay out of reach');
ecomos_check(
    ecomos_check_permission('technical_settings', $ecomos_users['operator']) === false,
    'the store manager is refused the technical_settings job'
);

// 5. Existing addon on/off agrees across the capability layers and leaves core data alone.

ecomos_section('Addon projection');

update_option('ecomos_active_addons', array(), false);
update_option('ecomos_addon_quotes_enabled', 'no', false);
ecomos_check(ecomos_is_addon_enabled('quotes') === false, 'the quotes addon reads as off');

$ecomos_quotes_off_ok = true;
foreach (array('admin' => $ecomos_admin_id, 'operator' => $ecomos_users['operator'], 'fulfillment' => $ecomos_users['fulfillment']) as $ecomos_who => $ecomos_uid) {
    if (ecomos_check_permission('quotes', $ecomos_uid) !== false) {
        $ecomos_quotes_off_ok = false;
        fwrite(STDERR, "  {$ecomos_who} was permitted quotes while the addon is off\n");
    }
}
ecomos_check($ecomos_quotes_off_ok, 'with the addon off, the quotes job is refused for every role including the platform administrator');

update_option('ecomos_active_addons', array('quotes'), false);
ecomos_check(ecomos_is_addon_enabled('quotes') === true, 'the quotes addon reads as on');
ecomos_check(ecomos_check_permission('quotes', $ecomos_admin_id) === true, 'administrator is permitted quotes once the addon is on');
ecomos_check(ecomos_check_permission('quotes', $ecomos_users['operator']) === true, 'the store manager is permitted quotes once the addon is on');
ecomos_check(ecomos_check_permission('quotes', $ecomos_users['fulfillment']) === false, 'the fulfillment clerk is still refused quotes with the addon on');

wp_set_current_user($ecomos_users['operator']);
ecomos_check(ecomos_rest_require_capability('quotes') === true, 'the REST layer agrees with the addon being on for the manager');
wp_set_current_user($ecomos_users['fulfillment']);
ecomos_check(is_wp_error(ecomos_rest_require_capability('quotes')), 'the REST layer refuses quotes for the clerk with the addon on');
wp_set_current_user(0);

$ecomos_catalog_after_on = wc_get_product($ecomos_product_id);
$ecomos_order_after_on = wc_get_order($ecomos_order_id);
ecomos_check(
    $ecomos_catalog_after_on && (int) $ecomos_catalog_after_on->get_stock_quantity() === $ecomos_stock_baseline,
    'turning the addon on left the catalog product and its stock intact'
);
ecomos_check(
    $ecomos_order_after_on && $ecomos_order_after_on->get_status() === 'processing',
    'turning the addon on left the order and its status intact'
);

update_option('ecomos_active_addons', array(), false);
update_option('ecomos_addon_quotes_enabled', 'no', false);
$ecomos_catalog_after_off = wc_get_product($ecomos_product_id);
$ecomos_order_after_off = wc_get_order($ecomos_order_id);
ecomos_check(
    $ecomos_catalog_after_off && $ecomos_order_after_off && $ecomos_order_after_off->get_status() === 'processing',
    'turning the addon back off left catalog and orders intact'
);

// 6. Existing-addon lifecycle is idempotent, recoverable and preserves core data.

ecomos_section('Addon lifecycle');

$ecomos_manifest = array('name' => 'EcomOS Acceptance Addon', 'version' => '1.2.0');
$ecomos_first_install = ecomos_addon_install('acceptance_addon', $ecomos_manifest);
$ecomos_registry_after_first = ecomos_get_addons_registry();
$ecomos_installed_at = $ecomos_registry_after_first['acceptance_addon']['installed_at'] ?? null;
$ecomos_second_install = ecomos_addon_install('acceptance_addon', $ecomos_manifest);
$ecomos_registry_after_second = ecomos_get_addons_registry();
ecomos_check(
    $ecomos_first_install['success'] && $ecomos_second_install['success'],
    'installing the same addon twice succeeds both times'
);
ecomos_check(
    count($ecomos_registry_after_second) === 1
        && ($ecomos_registry_after_second['acceptance_addon']['installed_at'] ?? null) === $ecomos_installed_at,
    'the repeated install is idempotent: one registry entry, original install time preserved'
);

$ecomos_migrations = array(
    array(
        'version' => '1.0.0',
        'up'      => "CREATE TABLE IF NOT EXISTS {$ecomos_prefix}ecomos_acceptance (id INT AUTO_INCREMENT PRIMARY KEY)",
        'down'    => "DROP TABLE IF EXISTS {$ecomos_prefix}ecomos_acceptance",
    ),
    array(
        'version' => '1.2.0',
        'up'      => "ALTER TABLE {$ecomos_prefix}ecomos_acceptance ADD COLUMN note VARCHAR(32) NULL",
        'down'    => '',
    ),
);
$ecomos_migrate_first = ecomos_addon_migrate_up('acceptance_addon', $ecomos_migrations);
$ecomos_migrate_second = ecomos_addon_migrate_up('acceptance_addon', $ecomos_migrations);
ecomos_check(
    $ecomos_migrate_first['success'] && count($ecomos_migrate_first['executed']) === 2,
    'both pending migrations applied on the first run'
);
ecomos_check(
    $ecomos_migrate_second['success'] && $ecomos_migrate_second['executed'] === array(),
    'the second migration run applied nothing: migrations are idempotent'
);
$ecomos_table_exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $ecomos_prefix . 'ecomos_acceptance'));
ecomos_check($ecomos_table_exists === $ecomos_prefix . 'ecomos_acceptance', 'the addon migration really created its own table');

// The install's real prefix is `wpt_`, so this is exactly the statement that used
// to pass the guard and delete the posts table.
$ecomos_prohibited = ecomos_addon_migrate_up('acceptance_addon', array(
    array('version' => '9.9.9', 'up' => "DROP TABLE {$ecomos_prefix}posts", 'down' => ''),
));
ecomos_check(
    $ecomos_prohibited['success'] === false && stripos($ecomos_prohibited['error'] ?? '', 'prohibited') !== false,
    'a migration that drops the core posts table under this install\'s own prefix is refused, not executed'
);
$ecomos_posts_table = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $ecomos_prefix . 'posts'));
ecomos_check(
    $ecomos_posts_table === $ecomos_prefix . 'posts',
    'the posts table is still there after the refused migration'
);

$ecomos_prohibited_qualified = ecomos_addon_migrate_up('acceptance_addon', array(
    array('version' => '9.9.8', 'up' => "DROP TABLE `other_db`.`{$ecomos_prefix}posts`", 'down' => ''),
));
ecomos_check(
    $ecomos_prohibited_qualified['success'] === false,
    'a schema-qualified drop of a core table is refused too'
);
$ecomos_prohibited_truncate = ecomos_addon_migrate_up('acceptance_addon', array(
    array('version' => '9.9.7', 'up' => "TRUNCATE TABLE {$ecomos_prefix}wc_orders", 'down' => ''),
));
ecomos_check(
    $ecomos_prohibited_truncate['success'] === false,
    'truncating the core HPOS orders table is refused'
);
$ecomos_allowed_own_table = ecomos_addon_migrate_up('acceptance_addon', array(
    array('version' => '9.9.6', 'up' => "ALTER TABLE {$ecomos_prefix}ecomos_acceptance ADD COLUMN allowed_col TINYINT NULL", 'down' => ''),
));
ecomos_check(
    $ecomos_allowed_own_table['success'] === true && in_array('9.9.6', $ecomos_allowed_own_table['executed'], true),
    'the guard does not over-block: an ALTER on the addon\'s own table still runs'
);

$ecomos_rollback = ecomos_addon_rollback_down('acceptance_addon', $ecomos_migrations, '0.0.0');
ecomos_check(
    $ecomos_rollback['success'] && in_array('1.2.0', $ecomos_rollback['rolled_back'], true),
    'rolling back reverses the applied migrations in order'
);

$ecomos_deactivate = ecomos_addon_deactivate('acceptance_addon', true);
$ecomos_registry_after_deactivate = ecomos_get_addons_registry();
ecomos_check(
    $ecomos_deactivate['success'] && $ecomos_deactivate['status'] === 'disabled',
    'deactivating the addon reports the disabled state'
);
ecomos_check(
    ($ecomos_registry_after_deactivate['acceptance_addon']['retained_data'] ?? null) === true,
    'deactivation records that data is retained rather than purged'
);
ecomos_check(
    ecomos_is_addon_enabled('acceptance_addon') === false,
    'a deactivated addon stops being enabled in the server-side registry'
);

$ecomos_missing = ecomos_addon_verify_integrity(array('ghost_addon' => ABSPATH . 'wp-content/plugins/definitely-not-here/ghost.php'));
ecomos_check(
    in_array('ghost_addon', $ecomos_missing, true),
    'an addon whose files are gone is reported missing instead of fataling'
);

$ecomos_catalog_after_lifecycle = wc_get_product($ecomos_product_id);
$ecomos_order_after_lifecycle = wc_get_order($ecomos_order_id);
$ecomos_posts_after_lifecycle = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$ecomos_prefix}posts");
ecomos_check(
    $ecomos_catalog_after_lifecycle && (int) $ecomos_catalog_after_lifecycle->get_stock_quantity() === $ecomos_stock_baseline,
    'the whole addon lifecycle left the catalog product and its stock untouched'
);
ecomos_check(
    $ecomos_order_after_lifecycle && $ecomos_order_after_lifecycle->get_status() === 'processing',
    'the whole addon lifecycle left the order and its status untouched'
);
ecomos_check($ecomos_posts_after_lifecycle > 0, 'core posts survived every addon operation');

// Tidy up the synthetic catalog entry; the order is deleted by the bootstrap's
// shutdown handler and the page/database are disposable.
wp_delete_post($ecomos_product_id, true);

if (!empty($GLOBALS['ecomos_failures'])) {
    fwrite(STDERR, sprintf("Merchant jobs suite FAILED with %d failure(s).\n", count($GLOBALS['ecomos_failures'])));
    exit(1);
}

echo "\n[SUITE-PASS] Merchant jobs and addon lifecycle verified against real WordPress "
    . get_bloginfo('version') . " / WooCommerce " . WC_VERSION . " / PHP " . PHP_VERSION . ".\n";
exit(0);
