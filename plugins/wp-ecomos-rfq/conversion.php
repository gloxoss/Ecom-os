<?php
/**
 * EcomOS RFQ WooCommerce Order Conversion Engine
 *
 * Implements idempotent, audit-referenced conversion of accepted quotations
 * into native WooCommerce HPOS orders while enforcing stock reservation policies.
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

// In-memory order counter & store for testing environments where WooCommerce is mocked
global $ecomos_rfq_mock_orders;
$ecomos_rfq_mock_orders = array();

/**
 * Reset mock orders for test suite.
 */
function ecomos_rfq_reset_mock_orders() {
    global $ecomos_rfq_mock_orders;
    $ecomos_rfq_mock_orders = array();
}

/**
 * Retrieve created mock orders.
 *
 * @return array
 */
function ecomos_rfq_get_mock_orders() {
    global $ecomos_rfq_mock_orders;
    return is_array($ecomos_rfq_mock_orders) ? $ecomos_rfq_mock_orders : array();
}

/**
 * Convert an accepted quote into a native WooCommerce order.
 *
 * @param string $quote_id ID of the quote to convert.
 * @param array $options Optional configuration overrides (e.g. reserve_stock, payment_method).
 * @return array|WP_Error Array with order details or WP_Error on failure.
 */
function ecomos_rfq_convert_quote_to_order($quote_id, $options = array()) {
    global $wpdb, $ecomos_rfq_mock_orders;

    // Off-state barrier: reject conversion when addon is disabled
    if (function_exists('ecomos_rfq_is_active') && !ecomos_rfq_is_active()) {
        return new WP_Error('addon_disabled', 'RFQ Quotes addon is currently disabled on this platform.', array('status' => 404));
    }

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    // 1. Idempotency Check: if already converted, return existing order reference
    if (!empty($quote['converted_order_id'])) {
        return array(
            'success'     => true,
            'quoteId'     => $quote['id'],
            'orderId'     => (string) $quote['converted_order_id'],
            'quoteNumber' => $quote['quote_number'],
            'isDuplicate' => true,
            'state'       => $quote['state'],
            'message'     => 'Quote was already converted into an order',
        );
    }

    // 2. Acceptance Gate: only accepted quotes can be converted to orders
    if ($quote['state'] !== 'accepted') {
        return new WP_Error(
            'invalid_conversion_state',
            sprintf('Quote state "%s" cannot be converted to order. Quote must be "accepted".', $quote['state']),
            array('status' => 400)
        );
    }

    // 3. Current Revision Lookup
    $current_rev = null;
    $revisions = isset($quote['revisions']) ? $quote['revisions'] : array();
    foreach ($revisions as $rev) {
        if (!empty($rev['is_current']) || (isset($quote['current_revision_id']) && $rev['revision_id'] === $quote['current_revision_id'])) {
            $current_rev = $rev;
            break;
        }
    }

    if (!$current_rev) {
        return new WP_Error('missing_revision', 'Accepted quote has no active priced revision', array('status' => 400));
    }

    if (empty($current_rev['lines']) || !is_array($current_rev['lines'])) {
        return new WP_Error('empty_lines', 'Accepted revision contains no priced line items', array('status' => 400));
    }

    $contact = isset($quote['contact']) && is_array($quote['contact']) ? $quote['contact'] : array();
    $currency = isset($current_rev['currency']) ? $current_rev['currency'] : 'MAD';
    $order_id = null;

    // 4. Create WooCommerce HPOS Order or fallback to mock representation
    if (function_exists('wc_create_order')) {
        $order_args = array(
            'status'        => 'pending',
            'customer_note' => sprintf('Converted from Quote %s (Revision %s)', $quote['quote_number'], $current_rev['revision_id']),
            'created_via'   => 'ecomos_rfq',
        );

        $order = wc_create_order($order_args);
        if (is_wp_error($order) || !$order) {
            return new WP_Error('order_creation_failed', 'Could not create WooCommerce order', array('status' => 500));
        }

        $order_id = $order->get_id();

        // Add line items
        foreach ($current_rev['lines'] as $line) {
            $product_id = isset($line['productId']) ? (int) $line['productId'] : 0;
            $qty = isset($line['quantity']) ? (int) $line['quantity'] : 1;
            $unit_price = isset($line['unitPriceExclTax']) ? (float) $line['unitPriceExclTax'] : 0.0;
            $tax_amount = isset($line['taxAmount']) ? (float) $line['taxAmount'] : 0.0;

            if ($product_id > 0 && function_exists('wc_get_product')) {
                $product = wc_get_product($product_id);
                if ($product) {
                    $item_id = $order->add_product($product, $qty, array(
                        'subtotal' => $unit_price * $qty,
                        'total'    => $unit_price * $qty,
                    ));
                }
            }
        }

        // Customer billing details
        $customer_name = $quote['customer_name'];
        $name_parts = explode(' ', trim($customer_name), 2);
        $first_name = $name_parts[0];
        $last_name = isset($name_parts[1]) ? $name_parts[1] : '';

        $order->set_billing_first_name($first_name);
        $order->set_billing_last_name($last_name);
        $order->set_billing_email($quote['customer_email']);
        if (!empty($quote['company_name'])) {
            $order->set_billing_company($quote['company_name']);
        }
        if (!empty($contact['phone'])) {
            $order->set_billing_phone($contact['phone']);
        }

        // Set currency
        $order->set_currency($currency);

        // Cross-Audit Meta References
        $order->update_meta_data('_ecomos_rfq_quote_id', $quote['id']);
        $order->update_meta_data('_ecomos_rfq_quote_number', $quote['quote_number']);
        $order->update_meta_data('_ecomos_rfq_revision_id', $current_rev['revision_id']);
        $order->update_meta_data('_ecomos_conversion_timestamp', current_time('mysql', 1));
        if (!empty($quote['tax_id'])) {
            $order->update_meta_data('_billing_tax_id', $quote['tax_id']);
        }

        // Recalculate totals
        $order->calculate_totals(true);

        // Optional stock reservation check
        $stock_policy = get_option('ecomos_rfq_stock_reservation', 'none');
        if ($stock_policy === 'on_acceptance' || !empty($options['reserve_stock'])) {
            if (function_exists('wc_reduce_stock_levels')) {
                wc_reduce_stock_levels($order_id);
            }
        }

        $order->save();
    } else {
        // Test / mock order generator
        $order_num = wp_rand(10000, 99999);
        $order_id = 'woo_order_' . $order_num;

        $mock_order_record = array(
            'id'            => $order_id,
            'quote_id'      => $quote['id'],
            'quote_number'  => $quote['quote_number'],
            'revision_id'   => $current_rev['revision_id'],
            'customer_name' => $quote['customer_name'],
            'customer_email'=> $quote['customer_email'],
            'company_name'  => $quote['company_name'],
            'tax_id'        => $quote['tax_id'],
            'currency'      => $currency,
            'subtotal'      => $current_rev['subtotal_excl_tax'],
            'tax'           => $current_rev['total_tax'],
            'total'         => $current_rev['total_incl_tax'],
            'lines'         => $current_rev['lines'],
            'status'        => 'pending',
            'audit'         => array(
                '_ecomos_rfq_quote_id'       => $quote['id'],
                '_ecomos_rfq_quote_number'   => $quote['quote_number'],
                '_ecomos_rfq_revision_id'    => $current_rev['revision_id'],
                '_ecomos_conversion_time'    => current_time('mysql', 1),
            ),
        );

        if (!is_array($ecomos_rfq_mock_orders)) {
            $ecomos_rfq_mock_orders = array();
        }
        $ecomos_rfq_mock_orders[$order_id] = $mock_order_record;
    }

    // 5. Update Quote state to converted_to_order
    $now = current_time('mysql', 1);
    $quotes_table = $wpdb->prefix . 'ecomos_rfq_quotes';
    $updated = $wpdb->update(
        $quotes_table,
        array(
            'state'              => 'converted_to_order',
            'converted_order_id' => (string) $order_id,
            'updated_at'         => $now,
        ),
        array('id' => $quote['id'])
    );

    if (function_exists('do_action')) {
        do_action('ecomos_rfq_quote_converted', $quote['id'], $order_id);
    }

    return array(
        'success'            => true,
        'quoteId'            => $quote['id'],
        'quoteNumber'        => $quote['quote_number'],
        'orderId'            => (string) $order_id,
        'state'              => 'converted_to_order',
        'acceptedRevisionId' => $current_rev['revision_id'],
        'isDuplicate'        => false,
    );
}
