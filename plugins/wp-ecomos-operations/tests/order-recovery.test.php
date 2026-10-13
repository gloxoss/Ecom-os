<?php
/**
 * Standalone mock test suite for EcomOS order correlation and recovery.
 */

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/../');
}

// Minimal WordPress & WooCommerce test mocks
class Mock_WC_Order {
    public int $id;
    public string $order_key;
    public string $billing_email;
    public string $customer_note;
    public array $meta = array();
    public bool $saved = false;

    public function __construct(int $id, string $key, string $email, string $note = '') {
        $this->id = $id;
        $this->order_key = $key;
        $this->billing_email = $email;
        $this->customer_note = $note;
    }

    public function get_id(): int {
        return $this->id;
    }

    public function get_order_key(): string {
        return $this->order_key;
    }

    public function get_billing_email(): string {
        return $this->billing_email;
    }

    public function get_customer_note(): string {
        return $this->customer_note;
    }

    public function get_meta(string $key, bool $single = true) {
        return $this->meta[$key] ?? '';
    }

    public function update_meta_data(string $key, $value): void {
        $this->meta[$key] = $value;
    }

    public function delete_meta_data(string $key): void {
        unset($this->meta[$key]);
    }

    public function save(): void {
        $this->saved = true;
    }
}

class WC_Order extends Mock_WC_Order {}

class WP_REST_Request {
    private array $params = array();

    public function __construct(array $params = array()) {
        $this->params = $params;
    }

    public function get_param(string $key) {
        return $this->params[$key] ?? null;
    }
}

class WP_REST_Response {
    public $data;
    public int $status;

    public function __construct($data = null, int $status = 200) {
        $this->data = $data;
        $this->status = $status;
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

class WP_REST_Server {
    const READABLE = 'GET';
}

$GLOBALS['mock_orders'] = array();
$GLOBALS['mock_current_user_caps'] = array();
$GLOBALS['mock_logged_in'] = false;

function sanitize_text_field(string $str): string {
    return trim(strip_tags($str));
}

function is_user_logged_in(): bool {
    return $GLOBALS['mock_logged_in'];
}

function current_user_can(string $cap): bool {
    return !empty($GLOBALS['mock_current_user_caps'][$cap]);
}

function wc_get_order($id) {
    return $GLOBALS['mock_orders'][$id] ?? null;
}

function wc_get_orders(array $args): array {
    $results = array();
    $meta_key = $args['meta_key'] ?? null;
    $meta_value = $args['meta_value'] ?? null;

    foreach ($GLOBALS['mock_orders'] as $order) {
        if ($meta_key && $meta_value) {
            if ($order->get_meta($meta_key, true) === $meta_value) {
                $results[] = $order;
                if (!empty($args['limit']) && count($results) >= $args['limit']) {
                    break;
                }
            }
        } else {
            $results[] = $order;
            if (!empty($args['limit']) && count($results) >= $args['limit']) {
                break;
            }
        }
    }
    return $results;
}

function add_action($hook, $callback, $priority = 10, $accepted_args = 1) {}
function register_rest_route($namespace, $route, $args) {}

require_once __DIR__ . '/../order-recovery.php';

// ==========================================
// Test 1: Order meta copy from customer note
// ==========================================
$order = new WC_Order(101, 'wc_order_key101', 'test@example.com', "Please leave at door\n[ecomos-attempt:att_abc_123]");
ecomos_sync_order_attempt_meta($order);

assert($order->saved === true, 'Order must be saved when attempt marker is present');
assert($order->get_meta('_ecomos_attempt_id', true) === 'att_abc_123', 'Order meta _ecomos_attempt_id must match attempt ID');

// Test idempotency: if already set, no re-save
$order->saved = false;
ecomos_sync_order_attempt_meta($order);
assert($order->saved === false, 'Order must not be re-saved if _ecomos_attempt_id is already populated');

// Test note without attempt marker
$plain_order = new WC_Order(102, 'wc_order_key102', 'plain@example.com', 'No marker here');
ecomos_sync_order_attempt_meta($plain_order);
assert($plain_order->saved === false, 'Plain order without attempt marker must not be saved');
assert($plain_order->get_meta('_ecomos_attempt_id', true) === '', 'Plain order must have empty _ecomos_attempt_id');

// ==========================================
// Test 2: Permission check for route
// ==========================================
$request = new WP_REST_Request(array('id' => 'att_abc_123'));

// Guest (not logged in)
$GLOBALS['mock_logged_in'] = false;
$GLOBALS['mock_current_user_caps'] = array();
$perm_guest = ecomos_rest_check_order_attempt_permissions($request);
assert($perm_guest instanceof WP_Error, 'Guest request must return WP_Error');
assert($perm_guest->data['status'] === 401, 'Guest request must return HTTP 401');

// Logged in user without read_private_shop_orders (e.g. subscriber/customer)
$GLOBALS['mock_logged_in'] = true;
$GLOBALS['mock_current_user_caps'] = array('read' => true);
$perm_unauthorized = ecomos_rest_check_order_attempt_permissions($request);
assert($perm_unauthorized instanceof WP_Error, 'User without read_private_shop_orders must return WP_Error');
assert($perm_unauthorized->data['status'] === 403, 'User without read_private_shop_orders must return HTTP 403');

// Capable user with read_private_shop_orders (e.g. ecomos_connector)
$GLOBALS['mock_current_user_caps'] = array('read' => true, 'read_private_shop_orders' => true);
$perm_ok = ecomos_rest_check_order_attempt_permissions($request);
assert($perm_ok === true, 'User with read_private_shop_orders must be granted access');

// ==========================================
// Test 3: REST endpoint query & data boundary
// ==========================================
$GLOBALS['mock_orders'][101] = $order;

// Hit with matching attempt
$req_hit = new WP_REST_Request(array('id' => 'att_abc_123'));
$res_hit = ecomos_rest_get_order_by_attempt($req_hit);
assert($res_hit instanceof WP_REST_Response, 'Hit must return WP_REST_Response');
assert($res_hit->status === 200, 'Hit must return HTTP 200');
assert(isset($res_hit->data['orderId']) && $res_hit->data['orderId'] === 101, 'Response must contain orderId');
assert(isset($res_hit->data['orderKey']) && $res_hit->data['orderKey'] === 'wc_order_key101', 'Response must contain orderKey');
assert(isset($res_hit->data['billingEmail']) && $res_hit->data['billingEmail'] === 'test@example.com', 'Response must contain billingEmail');

// Data leakage check: only orderId, orderKey and billingEmail returned
$keys = array_keys($res_hit->data);
sort($keys);
assert($keys === array('billingEmail', 'orderId', 'orderKey'), 'Response must ONLY contain orderId, orderKey, and billingEmail');

// Miss: unknown attempt
$req_miss = new WP_REST_Request(array('id' => 'att_non_existent'));
$res_miss = ecomos_rest_get_order_by_attempt($req_miss);
assert($res_miss instanceof WP_Error, 'Miss must return WP_Error');
assert($res_miss->data['status'] === 404, 'Miss must return HTTP 404');
assert($res_miss->code === 'order_not_found', 'Miss error code must be order_not_found');

// Empty ID
$req_empty = new WP_REST_Request(array('id' => ''));
$res_empty = ecomos_rest_get_order_by_attempt($req_empty);
assert($res_empty instanceof WP_Error, 'Empty attempt must return WP_Error');
assert($res_empty->data['status'] === 400, 'Empty attempt must return HTTP 400');

echo "All PHP order recovery contract tests passed.\n";
