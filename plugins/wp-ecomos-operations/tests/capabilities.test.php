<?php
/**
 * Standalone & PHPUnit compatible test suite for EcomOS role capabilities.
 */

// Minimal mock environment if running outside WordPress
if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/../');

    class WP_User {
        public int $ID = 0;
        public array $roles = array();
        public array $caps = array();

        public function __construct(int $id = 0, array $roles = array(), array $caps = array()) {
            $this->ID = $id;
            $this->roles = $roles;
            $this->caps = $caps;
        }

        public function exists(): bool {
            return $this->ID > 0;
        }

        public function has_cap(string $cap): bool {
            return !empty($this->caps[$cap]);
        }
    }

    class WP_Error {
        public string $code;
        public string $message;
        public array $data;

        public function __construct(string $code = '', string $message = '', array $data = array()) {
            $this->code = $code;
            $this->message = $message;
            $this->data = $data;
        }

        public function get_error_data() {
            return $this->data;
        }
    }

    $GLOBALS['mock_current_user'] = null;
    $GLOBALS['mock_roles'] = array();
    $GLOBALS['mock_options'] = array();

    function wp_get_current_user(): WP_User {
        return $GLOBALS['mock_current_user'] ?? new WP_User();
    }

    function get_userdata(int $id): ?WP_User {
        if ($id === 1) { // Admin
            return new WP_User(1, array('administrator'), array('manage_options' => true, 'administrator' => true));
        }
        if ($id === 2) { // Operator
            return new WP_User(2, array('ecomos_operator'), ecomos_get_role_capabilities()['ecomos_operator']);
        }
        if ($id === 3) { // Fulfillment
            return new WP_User(3, array('ecomos_fulfillment'), ecomos_get_role_capabilities()['ecomos_fulfillment']);
        }
        if ($id === 4) { // Customer
            return new WP_User(4, array('customer'), array('read' => true));
        }
        return null;
    }

    function user_can($user, string $cap): bool {
        if (!$user || !($user instanceof WP_User) || !$user->exists()) {
            return false;
        }
        return $user->has_cap($cap);
    }

    function get_role(string $slug) {
        return $GLOBALS['mock_roles'][$slug] ?? null;
    }

    function add_role(string $slug, string $display_name, array $caps): void {
        $GLOBALS['mock_roles'][$slug] = array('name' => $display_name, 'capabilities' => $caps);
    }

    function get_option(string $name, $default = false) {
        return $GLOBALS['mock_options'][$name] ?? $default;
    }

    function apply_filters(string $hook, $value, ...$args) {
        return $value;
    }

    function __($text, $domain = 'default') {
        return $text;
    }

    function esc_html__($text, $domain = 'default') {
        return $text;
    }

    function is_admin(): bool {
        return true;
    }

    function wp_doing_ajax(): bool {
        return false;
    }

    function wp_doing_cron(): bool {
        return false;
    }

    function add_action($hook, $callback, $priority = 10, $accepted_args = 1) {}
}

require_once __DIR__ . '/../capabilities.php';

/**
 * Runner asserting capability rules.
 */
function run_capabilities_tests() {
    $tests_run = 0;
    $assertions_passed = 0;

    $assert = function (bool $condition, string $message) use (&$assertions_passed) {
        if (!$condition) {
            throw new Exception("Assertion Failed: " . $message);
        }
        $assertions_passed++;
    };

    // 1. Role registration test
    $tests_run++;
    ecomos_register_roles();
    $assert(isset($GLOBALS['mock_roles']['ecomos_operator']), "ecomos_operator role must be registered");
    $assert(isset($GLOBALS['mock_roles']['ecomos_fulfillment']), "ecomos_fulfillment role must be registered");

    // 2. Operator permissions
    $tests_run++;
    $operator = get_userdata(2);
    $GLOBALS['mock_current_user'] = $operator;
    $assert(ecomos_check_permission('view_orders'), "Operator must have view_orders");
    $assert(ecomos_check_permission('update_order_status'), "Operator must have update_order_status");
    $assert(ecomos_check_permission('manage_products'), "Operator must have manage_products");
    $assert(ecomos_check_permission('manage_inventory'), "Operator must have manage_inventory");
    $assert(ecomos_check_permission('manage_coupons'), "Operator must have manage_coupons");
    $assert(ecomos_check_permission('manage_content'), "Operator must have manage_content");
    $assert(!ecomos_check_permission('technical_settings'), "Operator must NOT have technical_settings");

    // 3. Fulfillment permissions
    $tests_run++;
    $fulfillment = get_userdata(3);
    $GLOBALS['mock_current_user'] = $fulfillment;
    $assert(ecomos_check_permission('view_orders'), "Fulfillment must have view_orders");
    $assert(ecomos_check_permission('update_order_status'), "Fulfillment must have update_order_status");
    $assert(!ecomos_check_permission('manage_products'), "Fulfillment must NOT have manage_products");
    $assert(!ecomos_check_permission('manage_inventory'), "Fulfillment must NOT have manage_inventory");
    $assert(!ecomos_check_permission('manage_coupons'), "Fulfillment must NOT have manage_coupons");
    $assert(!ecomos_check_permission('technical_settings'), "Fulfillment must NOT have technical_settings");

    // 4. Customer & Anonymous permissions
    $tests_run++;
    $customer = get_userdata(4);
    $GLOBALS['mock_current_user'] = $customer;
    $assert(!ecomos_check_permission('view_orders'), "Customer must NOT have view_orders");
    $assert(!ecomos_check_permission('manage_products'), "Customer must NOT have manage_products");

    $GLOBALS['mock_current_user'] = new WP_User();
    $assert(!ecomos_check_permission('view_orders'), "Anonymous must NOT have view_orders");
    $assert(!ecomos_check_permission('update_order_status'), "Anonymous must NOT have update_order_status");

    // 5. Quote Addon Gating Test
    $tests_run++;
    $GLOBALS['mock_current_user'] = $operator;
    $GLOBALS['mock_options']['ecomos_addon_quotes_enabled'] = 'no';
    $assert(!ecomos_check_permission('quotes'), "Quotes must be denied when quote addon is disabled");

    $GLOBALS['mock_options']['ecomos_addon_quotes_enabled'] = 'yes';
    $assert(ecomos_check_permission('quotes'), "Quotes must be permitted for operator when quote addon is enabled");

    // 6. REST Permission Callback 403 test
    $tests_run++;
    $GLOBALS['mock_current_user'] = $fulfillment;
    $res = ecomos_rest_require_capability('manage_products');
    $assert($res instanceof WP_Error, "Unauthorized REST call must return WP_Error");
    $assert($res->get_error_data()['status'] === 403, "WP_Error status must be 403");

    $GLOBALS['mock_current_user'] = $operator;
    $resOk = ecomos_rest_require_capability('manage_products');
    $assert($resOk === true, "Authorized REST call must return true");

    echo "Capabilities Test Results: {$tests_run} test suites passed, {$assertions_passed} assertions verified.\n";
}

run_capabilities_tests();
