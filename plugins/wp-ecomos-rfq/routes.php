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

    // 6. Get quote document (HTML/PDF print view)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/document', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'ecomos_rfq_rest_get_document',
        'permission_callback' => 'ecomos_rfq_rest_check_document_permission',
    ));

    // 7. Request revision (guest with token)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/revise', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_request_revision',
        'permission_callback' => 'ecomos_rfq_rest_check_revise_permission',
    ));

    // 8. Convert accepted quote to order (merchant/staff action, never guest)
    register_rest_route($namespace, '/quotes/(?P<id>[\w-]+)/convert', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'ecomos_rfq_rest_convert_quote',
        'permission_callback' => 'ecomos_rfq_rest_check_conversion_permission',
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

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    // When a guest token is provided, it MUST be valid. Privileged transport keys
    // must NEVER authorize a request presenting an invalid or forged token.
    if (!empty($token)) {
        if (ecomos_rfq_verify_guest_access($quote, $token)) {
            return true;
        }
        return new WP_Error('forbidden', 'Access denied to quote: invalid guest token', array('status' => 403));
    }

    // No token provided: only authorized staff operators with capability can read.
    // Guests without token are refused.
    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    return new WP_Error('unauthorized', 'Authentication token required', array('status' => 401));
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
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    // Accepting an offer is an exclusively guest operation: valid guest token is mandatory.
    // Privileged backend service credentials cannot substitute for guest proof.
    if (empty($token)) {
        return new WP_Error('unauthorized', 'Guest access token required to accept offer', array('status' => 401));
    }

    if (!ecomos_rfq_verify_guest_access($quote, $token)) {
        return new WP_Error('forbidden', 'Access denied to quote: invalid guest token', array('status' => 403));
    }

    return true;
}

function ecomos_rfq_rest_check_revise_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    // Requesting a revision on a quote is a guest operation: valid guest token is mandatory.
    // Privileged backend service credentials cannot substitute for guest proof.
    if (empty($token)) {
        return new WP_Error('unauthorized', 'Guest access token required to request revision', array('status' => 401));
    }

    if (!ecomos_rfq_verify_guest_access($quote, $token)) {
        return new WP_Error('forbidden', 'Access denied to quote: invalid guest token', array('status' => 403));
    }

    return true;
}

function ecomos_rfq_rest_check_reject_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    if (!empty($token)) {
        if (ecomos_rfq_verify_guest_access($quote, $token)) {
            return true;
        }
        return new WP_Error('forbidden', 'Access denied to quote: invalid guest token', array('status' => 403));
    }

    // Staff rejecting without token must have real capability
    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    return new WP_Error('unauthorized', 'Authentication token required to reject quote', array('status' => 401));
}

function ecomos_rfq_rest_check_document_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    if (!empty($token)) {
        if (ecomos_rfq_verify_guest_access($quote, $token)) {
            return true;
        }
        return new WP_Error('forbidden', 'Access denied: valid guest access token required to view quote document', array('status' => 403));
    }

    // Staff accessing document without token must have real capability
    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    return new WP_Error('unauthorized', 'Access token required to view quote document', array('status' => 401));
}

/**
 * Conversion guard: creating a WooCommerce order is a merchant/staff action.
 *
 * A guest quote token is deliberately not sufficient here. The guest token
 * authorizes reading, accepting or rejecting an offer for one quote; it never
 * authorizes mutating WooCommerce order state and stock policy.
 */
function ecomos_rfq_rest_check_conversion_permission($request) {
    $active_check = ecomos_rfq_rest_check_active();
    if (is_wp_error($active_check)) {
        return $active_check;
    }

    if (current_user_can('ecomos_operator') || current_user_can('manage_woocommerce')) {
        return true;
    }

    return new WP_Error('forbidden', 'Merchant or staff permission is required to convert a quotation into an order', array('status' => 403));
}

function ecomos_rfq_rest_create_quote($request) {
    $params = $request->get_json_params();
    if (empty($params)) {
        $params = $request->get_params();
    }

    // A caller that has already issued a quote identity to a guest (the storefront
    // does) may supply it, so the quote it stores is the quote the guest can read
    // back. Anything supplied is validated and falls back to generation, so a
    // malformed or absent value can never produce an unusable quote.
    $supplied_id = isset($params['id']) ? sanitize_text_field((string) $params['id']) : '';
    $supplied_num = isset($params['quoteNumber']) ? sanitize_text_field((string) $params['quoteNumber']) : '';
    $supplied_hash = isset($params['accessSecretHash']) ? strtolower(trim((string) $params['accessSecretHash'])) : '';

    $secret = wp_generate_password(32, false);
    $secret_hash = preg_match('/^[a-f0-9]{64}$/', $supplied_hash) ? $supplied_hash : hash('sha256', $secret);

    $quote_id = preg_match('/^quote_[A-Za-z0-9_-]{1,60}$/', $supplied_id)
        ? $supplied_id
        : 'quote_' . wp_generate_uuid4();
    $quote_num = preg_match('/^[A-Z0-9-]{3,32}$/', $supplied_num)
        ? $supplied_num
        : 'DEV-' . gmdate('Y') . '-' . wp_rand(1000, 9999);

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
        'state'        => 'submitted',
    );

    // Only return a secret when this endpoint minted it. When the caller supplied the
    // hash it already holds the plaintext, and returning the unrelated value that was
    // generated above would hand the guest a secret that authorizes nothing.
    if ($supplied_hash === '') {
        $response_data['accessSecret'] = $secret;
    }

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
        'lines'      => isset($params['lines']) ? $params['lines'] : array(),
        'expires_at' => isset($params['expiresAt']) ? $params['expiresAt'] : (isset($params['expires_at']) ? $params['expires_at'] : ''),
        'currency'   => isset($params['currency']) ? $params['currency'] : 'MAD',
        'terms'      => isset($params['terms']) ? $params['terms'] : null,
        'notes'      => isset($params['notes']) ? $params['notes'] : null,
    );

    // Call server-pricing and revision logic
    if (function_exists('ecomos_rfq_create_staff_offer')) {
        $updated = ecomos_rfq_create_staff_offer($quote_id, $user, $offer_data);
    } else {
        $updated = ecomos_rfq_add_revision($quote_id, array_merge($offer_data, array(
            'staff_id'   => (string) $user->ID,
            'staff_name' => $user->display_name ?: 'Staff',
        )));
    }

    if (is_wp_error($updated)) {
        return $updated;
    }

    // Trigger transactional notification
    if (function_exists('ecomos_rfq_notify_offer_created')) {
        $current_rev = null;
        if (!empty($updated['revisions'])) {
            foreach ($updated['revisions'] as $r) {
                if ($r['revision_id'] === $updated['current_revision_id']) {
                    $current_rev = $r;
                    break;
                }
            }
        }
        if ($current_rev) {
            ecomos_rfq_notify_offer_created($updated, $current_rev);
        }
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

    // Validate using offers guard if available
    if (function_exists('ecomos_rfq_can_accept_revision')) {
        $guard = ecomos_rfq_can_accept_revision($quote, $revision_id);
        if (is_wp_error($guard)) {
            return $guard;
        }
    } else {
        // Fallback validation
        if (!empty($quote['expires_at']) && strtotime($quote['expires_at']) < time()) {
            return new WP_Error('quote_expired', 'Quotation offer has expired and cannot be accepted', array('status' => 410));
        }
        if (empty($revision_id) || $revision_id !== $quote['current_revision_id']) {
            return new WP_Error('stale_revision', sprintf('Targeted revision "%s" is superseded or invalid. Current is "%s".', $revision_id, $quote['current_revision_id']), array('status' => 409));
        }
    }

    $transitioned = ecomos_rfq_update_state($quote_id, 'accepted', null, array(
        'updated_at' => current_time('mysql', 1),
    ));

    if (!$transitioned) {
        return new WP_Error('update_failed', 'Could not transition quote to accepted', array('status' => 500));
    }

    if (function_exists('ecomos_rfq_notify_offer_accepted')) {
        ecomos_rfq_notify_offer_accepted($quote);
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

    if (function_exists('ecomos_rfq_notify_offer_rejected')) {
        ecomos_rfq_notify_offer_rejected($quote, $reason);
    }

    return rest_ensure_response(array(
        'success' => true,
        'quoteId' => $quote_id,
        'state'   => 'rejected',
        'reason'  => $reason,
    ));
}

function ecomos_rfq_rest_request_revision($request) {
    $quote_id = $request->get_param('id');
    $params = $request->get_json_params();
    $notes = isset($params['notes']) ? sanitize_textarea_field($params['notes']) : '';

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $transitioned = ecomos_rfq_update_state($quote_id, 'revision_requested', null, array(
        'updated_at' => current_time('mysql', 1),
    ));

    if (!$transitioned) {
        return new WP_Error('update_failed', 'Could not transition quote to revision_requested', array('status' => 500));
    }

    return rest_ensure_response(array(
        'success' => true,
        'quoteId' => $quote_id,
        'state'   => 'revision_requested',
        'notes'   => $notes,
    ));
}

function ecomos_rfq_rest_get_document($request) {
    $quote_id = $request->get_param('id');
    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $token = $request->get_header('x-quote-token');
    if (empty($token)) {
        $token = $request->get_param('token');
    }

    if (function_exists('ecomos_rfq_verify_document_access')) {
        $auth_check = ecomos_rfq_verify_document_access($quote, $token, wp_get_current_user());
        if (is_wp_error($auth_check)) {
            return $auth_check;
        }
    }

    $html = function_exists('ecomos_rfq_generate_document_html')
        ? ecomos_rfq_generate_document_html($quote)
        : '<html><body>Devis ' . esc_html($quote['quote_number']) . '</body></html>';

    $response = new WP_REST_Response($html, 200);
    $response->set_headers(array(
        'Content-Type'        => 'text/html; charset=UTF-8',
        'Cache-Control'       => 'no-store, private',
        'Content-Disposition' => sprintf('inline; filename="devis-%s.html"', $quote['quote_number']),
    ));

    return $response;
}

function ecomos_rfq_rest_convert_quote($request) {
    $quote_id = $request->get_param('id');

    if (!function_exists('ecomos_rfq_convert_quote_to_order')) {
        return new WP_Error('module_unavailable', 'Conversion module is unavailable', array('status' => 500));
    }

    // The request body is deliberately not forwarded: fulfilment and stock policy
    // are merchant-owned server configuration, so a caller cannot opt itself into
    // or out of stock reservation.
    $result = ecomos_rfq_convert_quote_to_order($quote_id, array());
    if (is_wp_error($result)) {
        return $result;
    }

    return rest_ensure_response($result);
}

