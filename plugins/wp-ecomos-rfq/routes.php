<?php
/**
 * EcomOS RFQ REST API Endpoints & Route Guards
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

function ecomos_rfq_is_active() {
    // Addon on/off capability authority check
    $option = get_option('ecomos_addon_quotes_active', null);
    if ($option === null) {
        return true; // Active by default when companion plugin is active
    }
    return (bool) $option;
}

add_action('rest_api_init', function () {
    $namespace = 'ecomos/v1/rfq';

    // 1. Submit quote (guest)
    register_rest_route($namespace, '/quotes', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_create_quote',
        'permission_callback' => 'ecomos_rfq_rest_check_active',
    ));

    // 2. Get quote (guest with token or staff operator)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'ecomos_rfq_rest_get_quote',
        'permission_callback' => 'ecomos_rfq_rest_check_read_permission',
    ));

    // 3. Create / amend offer revision (staff operator)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/offers', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_add_offer',
        'permission_callback' => 'ecomos_rfq_rest_check_staff_permission',
    ));

    // 4. Accept offer (guest with token)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/accept', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_accept_offer',
        'permission_callback' => 'ecomos_rfq_rest_check_accept_permission',
    ));

    // 5. Reject quote (guest or staff)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/reject', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_reject_quote',
        'permission_callback' => 'ecomos_rfq_rest_check_reject_permission',
    ));
});

function ecomos_rfq_rest_check_active() {
    if (!ecomos_rfq_is_active()) {
        return new WP_Error('addon_disabled', 'RFQ Quotes addon is currently disabled on this platform.', array('status' => 404));
    }
    return true;
}

function ecomos_rfq_rest_check_read_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (!empty($token) && ecomos_rfq_verify_guest_access($quote, $token)) {
        return true;
    }

    return new WP_Error('forbidden', 'Access denied to quote', array('status' => 403));
}

function ecomos_rfq_rest_check_staff_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    return new WP_Error('forbidden', 'Staff permissions required to manage quotation offers', array('status' => 403));
}

function ecomos_rfq_rest_check_accept_permission($request) {
    return ecomos_rfq_rest_check_read_permission($request);
}

function ecomos_rfq_rest_check_reject_permission($request) {
    return ecomos_rfq_rest_check_read_permission($request);
}

function ecomos_rfq_rest_create_quote($request) {
    $params = $request->get_json_params();
    if (empty($params)) {
        $params = $request->get_params();
    }

    $secret = wp_generate_password(32, false);
    $secret_hash = hash('sha256', $secret);

    $quote_id = 'quote_' . wp_generate_uuid4();
    $quote_num = 'DEV-' . gmdate('Y') . '-' . wp_rand(1000, 9999);

    $quote_data = array(
        'id'                 => $quote_id,
        'quote_number'       => $quote_num,
        'state'              => 'submitted',
        'customer_name'      => isset($params['contact']['name']) ? $params['contact']['name'] : 'Guest Customer',
        'customer_email'     => isset($params['contact']['email']) ? $params['contact']['email'] : '',
        'company_name'       => isset($params['contact']['companyName']) ? $params['contact']['companyName'] : null,
        'tax_id'             => isset($params['contact']['taxId']) ? $params['contact']['taxId'] : null,
        'contact_data'       => isset($params['contact']) ? $params['contact'] : array(),
        'items_data'         => isset($params['items']) ? $params['items'] : array(),
        'access_secret_hash' => $secret_hash,
    );

    $created = ecomos_rfq_create_quote($quote_data);
    if (is_wp_error($created)) {
        return $created;
    }

    $response_data = array(
        'success'      => true,
        'quoteId'      => $quote_id,
        'quoteNumber'  => $quote_num,
        'accessSecret' => $secret,
        'state'        => 'submitted',
    );

    $response = rest_ensure_response($response_data);
    $response->set_status(201);
    $response->header('Cache-Control', 'no-store, private');
    return $response;
}

function ecomos_rfq_rest_get_quote($request) {
    $quote = ecomos_rfq_get_quote($request->get_param('id'));
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    // Scrub secret hash before transmitting
    unset($quote['access_secret_hash']);

    $response = rest_ensure_response($quote);
    $response->header('Cache-Control', 'no-store, private');
    return $response;
}

function ecomos_rfq_rest_add_offer($request) {
    $quote_id = $request->get_param('id');
    $params = $request->get_json_params();

    $user = wp_get_current_user();
    $offer_data = array(
        'staff_id'    => (string) $user->ID,
        'staff_name'  => $user->display_name ?: 'Staff',
        'lines'       => isset($params['lines']) ? $params['lines'] : array(),
        'expires_at'  => isset($params['expiresAt']) ? $params['expiresAt'] : '',
        'currency'    => isset($params['currency']) ? $params['currency'] : 'MAD',
        'terms'       => isset($params['terms']) ? $params['terms'] : null,
        'notes'       => isset($params['notes']) ? $params['notes'] : null,
    );

    $updated = ecomos_rfq_add_revision($quote_id, $offer_data);
    if (is_wp_error($updated)) {
        return $updated;
    }

    unset($updated['access_secret_hash']);
    return rest_ensure_response($updated);
}

function ecomos_rfq_rest_accept_offer($request) {
    $quote_id = $request->get_param('id');
    $params = $request->get_json_params();
    $revision_id = isset($params['revisionId']) ? sanitize_text_field($params['revisionId']) : '';

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    // Expiration check
    if (!empty($quote['expires_at']) && strtotime($quote['expires_at']) < time()) {
        return new WP_Error('quote_expired', 'Quotation offer has expired and cannot be accepted', array('status' => 410));
    }

    // Stale revision invariant
    if (empty($revision_id) || $revision_id !== $quote['current_revision_id']) {
        return new WP_Error('stale_revision', sprintf('Targeted revision "%s" is superseded or invalid. Current is "%s".', $revision_id, $quote['current_revision_id']), array('status' => 409));
    }

    $transitioned = ecomos_rfq_update_state($quote_id, 'accepted', null, array(
        'updated_at' => current_time('mysql', 1),
    ));

    if (!$transitioned) {
        return new WP_Error('update_failed', 'Could not transition quote to accepted', array('status' => 500));
    }

    return rest_ensure_response(array(
        'success'     => true,
        'quoteId'     => $quote_id,
        'state'       => 'accepted',
        'acceptedRev' => $revision_id,
    ));
}

function ecomos_rfq_rest_reject_quote($request) {
    $quote_id = $request->get_param('id');
    $params = $request->get_json_params();
    $reason = isset($params['reason']) ? sanitize_textarea_field($params['reason']) : 'Declined';

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $transitioned = ecomos_rfq_update_state($quote_id, 'rejected', null, array(
        'updated_at' => current_time('mysql', 1),
    ));

    if (!$transitioned) {
        return new WP_Error('update_failed', 'Could not transition quote to rejected', array('status' => 500));
    }

    return rest_ensure_response(array(
        'success' => true,
        'quoteId' => $quote_id,
        'state'   => 'rejected',
        'reason'  => $reason,
    ));
}
