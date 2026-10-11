<?php
/**
 * EcomOS RFQ Staff Offer Creation, Line Pricing & Revision Guards
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Calculate pricing and tax for a single offer line item.
 *
 * @param array $line Line item input.
 * @return array Calculated line item with tax and total fields.
 */
function ecomos_rfq_calculate_offer_line($line) {
    $qty = isset($line['quantity']) ? max(1, (int) $line['quantity']) : 1;
    $unit_price = isset($line['unitPriceExclTax']) ? max(0, (float) $line['unitPriceExclTax']) : 0.0;
    if (isset($line['unit_price_excl_tax'])) {
        $unit_price = max(0, (float) $line['unit_price_excl_tax']);
    }

    $tax_rate = isset($line['taxRate']) ? max(0, (float) $line['taxRate']) : 0.20;
    if (isset($line['tax_rate'])) {
        $tax_rate = max(0, (float) $line['tax_rate']);
    }

    $total_excl_tax = round($unit_price * $qty, 2);
    $tax_amount = round($total_excl_tax * $tax_rate, 2);
    $total_incl_tax = round($total_excl_tax + $tax_amount, 2);

    return array(
        'productId'        => isset($line['productId']) ? $line['productId'] : (isset($line['product_id']) ? $line['product_id'] : 0),
        'variationId'      => isset($line['variationId']) ? $line['variationId'] : (isset($line['variation_id']) ? $line['variation_id'] : null),
        'sku'              => isset($line['sku']) ? sanitize_text_field($line['sku']) : '',
        'title'            => isset($line['title']) ? sanitize_text_field($line['title']) : 'Product Line',
        'quantity'         => $qty,
        'unitPriceExclTax' => $unit_price,
        'taxRate'          => $tax_rate,
        'taxAmount'        => $tax_amount,
        'totalExclTax'     => $total_excl_tax,
        'totalInclTax'     => $total_incl_tax,
        'customerNotes'    => isset($line['customerNotes']) ? sanitize_text_field($line['customerNotes']) : '',
    );
}

/**
 * Calculate totals across all line items in an offer.
 *
 * @param array $lines List of calculated lines.
 * @return array Aggregated totals.
 */
function ecomos_rfq_calculate_offer_totals($lines) {
    $subtotal_excl_tax = 0.0;
    $total_tax = 0.0;
    $total_incl_tax = 0.0;

    foreach ($lines as $line) {
        $subtotal_excl_tax += (float) $line['totalExclTax'];
        $total_tax += (float) $line['taxAmount'];
        $total_incl_tax += (float) $line['totalInclTax'];
    }

    return array(
        'subtotalExclTax' => round($subtotal_excl_tax, 2),
        'totalTax'        => round($total_tax, 2),
        'totalInclTax'    => round($total_incl_tax, 2),
    );
}

/**
 * Validate an offer submission payload.
 *
 * @param array $data Input payload.
 * @param int|null $now_timestamp Optional current time override for testing.
 * @return true|WP_Error True if valid, or WP_Error on validation failure.
 */
function ecomos_rfq_validate_offer_payload($data, $now_timestamp = null) {
    if (empty($data['lines']) || !is_array($data['lines'])) {
        return new WP_Error('invalid_offer_lines', 'Offer must contain at least one line item', array('status' => 400));
    }

    foreach ($data['lines'] as $idx => $line) {
        $qty = isset($line['quantity']) ? (int) $line['quantity'] : 0;
        $price = isset($line['unitPriceExclTax']) ? (float) $line['unitPriceExclTax'] : (isset($line['unit_price_excl_tax']) ? (float) $line['unit_price_excl_tax'] : 0.0);

        if ($qty <= 0) {
            return new WP_Error('invalid_line_quantity', sprintf('Line item %d must have positive quantity', $idx + 1), array('status' => 400));
        }
        if ($price < 0) {
            return new WP_Error('invalid_line_price', sprintf('Line item %d must have non-negative unit price', $idx + 1), array('status' => 400));
        }
    }

    if (empty($data['expires_at']) && empty($data['expiresAt'])) {
        return new WP_Error('missing_expiration', 'Offer must specify an expiration timestamp', array('status' => 400));
    }

    $expires_at_str = !empty($data['expires_at']) ? $data['expires_at'] : $data['expiresAt'];
    $expires_at = strtotime($expires_at_str);
    if ($expires_at === false) {
        return new WP_Error('invalid_expiration_format', 'Offer expiration date format is invalid', array('status' => 400));
    }

    $current_time = $now_timestamp !== null ? $now_timestamp : time();
    if ($expires_at <= $current_time) {
        return new WP_Error('expiration_past', 'Offer expiration date must be in the future', array('status' => 400));
    }

    return true;
}

/**
 * Create or revise a staff quotation offer revision.
 *
 * @param string $quote_id Target quote ID.
 * @param array|WP_User $staff Staff user or identity array.
 * @param array $offer_data Input offer parameters.
 * @return array|WP_Error Updated quote array or WP_Error on failure.
 */
function ecomos_rfq_create_staff_offer($quote_id, $staff, $offer_data) {
    // Off-state barrier: reject offer creation when addon is disabled
    if (function_exists('ecomos_rfq_is_active') && !ecomos_rfq_is_active()) {
        return new WP_Error('addon_disabled', 'RFQ Quotes addon is currently disabled on this platform.', array('status' => 404));
    }

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    $protected_states = array('cancelled', 'rejected', 'converted_to_order', 'accepted', 'converting', 'expired');
    if (in_array($quote['state'], $protected_states, true)) {
        return new WP_Error('invalid_quote_state', sprintf('Cannot create offer on a %s quote', $quote['state']), array('status' => 409));
    }

    $validation = ecomos_rfq_validate_offer_payload($offer_data);
    if (is_wp_error($validation)) {
        return $validation;
    }

    // Process and price lines on the server
    $priced_lines = array();
    foreach ($offer_data['lines'] as $line) {
        $priced_lines[] = ecomos_rfq_calculate_offer_line($line);
    }

    $expires_at = !empty($offer_data['expires_at']) ? $offer_data['expires_at'] : $offer_data['expiresAt'];

    $staff_id = 'operator';
    $staff_name = 'Operator';
    if ($staff instanceof WP_User) {
        $staff_id = (string) $staff->ID;
        $staff_name = $staff->display_name ?: $staff->user_login;
    } elseif (is_array($staff)) {
        $staff_id = isset($staff['id']) ? (string) $staff['id'] : 'operator';
        $staff_name = isset($staff['name']) ? (string) $staff['name'] : 'Operator';
    }

    $revision_payload = array(
        'staff_id'   => $staff_id,
        'staff_name' => $staff_name,
        'lines'      => $priced_lines,
        'expires_at' => $expires_at,
        'currency'   => isset($offer_data['currency']) ? sanitize_text_field($offer_data['currency']) : 'MAD',
        'terms'      => isset($offer_data['terms']) ? sanitize_textarea_field($offer_data['terms']) : null,
        'notes'      => isset($offer_data['notes']) ? sanitize_textarea_field($offer_data['notes']) : null,
    );

    $updated = ecomos_rfq_add_revision($quote_id, $revision_payload);
    if (is_wp_error($updated)) {
        return $updated;
    }

    if (function_exists('do_action')) {
        do_action('ecomos_rfq_offer_created', $quote_id, $updated['current_revision_id']);
    }

    return $updated;
}

/**
 * Validate whether a targeted revision can be accepted by the guest.
 *
 * @param array $quote Quote record.
 * @param string $revision_id Requested revision ID to accept.
 * @param int|null $now_timestamp Optional time override.
 * @return true|WP_Error True if acceptable, WP_Error otherwise.
 */
function ecomos_rfq_can_accept_revision($quote, $revision_id, $now_timestamp = null) {
    $now = $now_timestamp !== null ? $now_timestamp : time();

    if (!empty($quote['expires_at'])) {
        $exp = strtotime($quote['expires_at']);
        if ($exp !== false && $exp <= $now) {
            return new WP_Error('quote_expired', 'Quotation offer has expired and cannot be accepted', array('status' => 410));
        }
    }

    if (empty($revision_id) || $revision_id !== $quote['current_revision_id']) {
        return new WP_Error(
            'stale_revision',
            sprintf('Targeted revision "%s" is superseded or invalid. Current revision is "%s".', $revision_id, $quote['current_revision_id']),
            array('status' => 409)
        );
    }

    $valid_states = array('offer_created', 'revised');
    if (!in_array($quote['state'], $valid_states, true)) {
        return new WP_Error(
            'invalid_state_transition',
            sprintf('Quote state "%s" cannot transition to accepted.', $quote['state']),
            array('status' => 400)
        );
    }

    return true;
}
