<?php
/**
 * EcomOS Order Correlation and Exact Recovery
 *
 * Copies Store API attempt markers into indexed order metadata (_ecomos_attempt_id)
 * and exposes an authenticated REST endpoint for exact order lookup by attempt ID.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Extract attempt marker from customer note and save to indexed order meta _ecomos_attempt_id.
 * Safe for WooCommerce HPOS and legacy post meta.
 *
 * @param \WC_Order|int $order_or_id
 * @return void
 */
function ecomos_sync_order_attempt_meta($order_or_id): void {
    $order = is_numeric($order_or_id) ? wc_get_order($order_or_id) : $order_or_id;
    if (!$order instanceof \WC_Order) {
        return;
    }

    // Prevent redundant writes if already indexed
    if ($order->get_meta('_ecomos_attempt_id', true)) {
        return;
    }

    $note = $order->get_customer_note();
    if ($note && preg_match('/\[ecomos-attempt:([^\]\r\n]+)\]/', $note, $matches)) {
        $attempt_id = sanitize_text_field(trim($matches[1]));
        if (!empty($attempt_id)) {
            $order->update_meta_data('_ecomos_attempt_id', $attempt_id);
            $order->save();
        }
    }
}

// Hook Store API checkout completion as well as standard order creation hooks
add_action('woocommerce_store_api_checkout_order_processed', 'ecomos_sync_order_attempt_meta', 10, 1);
add_action('woocommerce_checkout_order_processed', 'ecomos_sync_order_attempt_meta', 10, 1);
add_action('woocommerce_new_order', 'ecomos_sync_order_attempt_meta', 10, 1);

/**
 * Check permission for order attempt lookup.
 * Caller must be authenticated and possess read_private_shop_orders.
 *
 * @param \WP_REST_Request $request
 * @return true|\WP_Error
 */
function ecomos_rest_check_order_attempt_permissions(\WP_REST_Request $request) {
    if (!is_user_logged_in()) {
        return new \WP_Error(
            'rest_not_logged_in',
            'Authentication required to inspect order attempts.',
            array('status' => 401)
        );
    }

    if (!current_user_can('read_private_shop_orders')) {
        return new \WP_Error(
            'rest_forbidden',
            'Caller lacks the read_private_shop_orders capability.',
            array('status' => 403)
        );
    }

    return true;
}

/**
 * Handle GET /wp-json/ecomos/v1/orders/by-attempt/<id>
 *
 * Returns only orderId, orderKey and billing email.
 *
 * @param \WP_REST_Request $request
 * @return \WP_REST_Response|\WP_Error
 */
function ecomos_rest_get_order_by_attempt(\WP_REST_Request $request) {
    $attempt_id = sanitize_text_field($request->get_param('id'));
    if (empty($attempt_id)) {
        return new \WP_Error(
            'invalid_attempt_id',
            'Attempt ID is required.',
            array('status' => 400)
        );
    }

    $orders = wc_get_orders(array(
        'limit'      => 1,
        'status'     => 'any',
        'meta_key'   => '_ecomos_attempt_id',
        'meta_value' => $attempt_id,
        'orderby'    => 'date',
        'order'      => 'DESC',
        'return'     => 'objects',
    ));

    if (empty($orders)) {
        return new \WP_Error(
            'order_not_found',
            'No order found for this attempt ID.',
            array('status' => 404)
        );
    }

    $order = reset($orders);
    if (!$order instanceof \WC_Order) {
        return new \WP_Error(
            'order_not_found',
            'No order found for this attempt ID.',
            array('status' => 404)
        );
    }

    $response = array(
        'orderId'      => (int) $order->get_id(),
        'orderKey'     => (string) $order->get_order_key(),
        'billingEmail' => (string) $order->get_billing_email(),
    );

    return new \WP_REST_Response($response, 200);
}

/**
 * Register the order recovery REST route.
 */
add_action('rest_api_init', function () {
    register_rest_route('ecomos/v1', '/orders/by-attempt/(?P<id>[^/]+)', array(
        'methods'             => \WP_REST_Server::READABLE,
        'callback'            => 'ecomos_rest_get_order_by_attempt',
        'permission_callback' => 'ecomos_rest_check_order_attempt_permissions',
        'args'                => array(
            'id' => array(
                'required'          => true,
                'type'              => 'string',
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => function ($param) {
                    return is_string($param) && '' !== trim($param);
                },
            ),
        ),
    ));
});

/**
 * Ensure WooCommerce REST API key authentication evaluates requests to /wp-json/ecomos/ routes.
 */
add_filter('woocommerce_rest_is_request_to_rest_api', function ($is_rest) {
    if ($is_rest) {
        return true;
    }
    $uri = $_SERVER['REQUEST_URI'] ?? '';
    if (strpos($uri, '/ecomos/') !== false || strpos($uri, 'rest_route=%2Fecomos%2F') !== false || strpos($uri, 'rest_route=/ecomos/') !== false) {
        return true;
    }
    return $is_rest;
});

