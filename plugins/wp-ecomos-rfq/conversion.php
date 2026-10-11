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
 * Merchant-owned conversion policy.
 *
 * Stock reservation is a platform decision read from stored configuration. A
 * request body must never be able to switch it on or off, so this helper is the
 * only source of truth for conversion policy flags.
 *
 * @return array Policy values.
 */
function ecomos_rfq_conversion_policy() {
    $stock_policy = get_option('ecomos_rfq_stock_reservation', 'none');
    if (!is_string($stock_policy)) {
        $stock_policy = 'none';
    }

    return array(
        'stock_policy'  => $stock_policy,
        'reserve_stock' => ($stock_policy === 'on_acceptance'),
    );
}

/**
 * Atomically claim an accepted quote so only one conversion can proceed.
 *
 * Compare-and-set on the quote row: the claim is granted only while the quote is
 * still `accepted` and holds no order link. A concurrent request that loses the
 * race sees zero affected rows and must back off instead of creating an order.
 *
 * `converting` is transient. It is linked to `converted_to_order` on success and
 * released back to `accepted` when order creation or linking fails, so a plain
 * retry succeeds. A process that dies mid-conversion leaves the row in
 * `converting`; staff recover it by resetting the row to `accepted` with a NULL
 * `converted_order_id` (e.g. `WHERE state='converting' AND updated_at < ...`).
 * Automatic claim stealing is deliberately not implemented: a slow request that
 * is still running would otherwise be duplicated.
 *
 * @param string $quote_id Quote identifier.
 * @return int|false 1 when claimed, 0 when the claim was lost, false on DB error.
 */
function ecomos_rfq_claim_quote_for_conversion($quote_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_quotes';

    $claimed = $wpdb->query($wpdb->prepare(
        "UPDATE {$table}
            SET state = %s, updated_at = %s
          WHERE id = %s
            AND state = %s
            AND (converted_order_id IS NULL OR converted_order_id = '')",
        'converting',
        current_time('mysql', 1),
        $quote_id,
        'accepted'
    ));

    if ($claimed === false) {
        return false;
    }

    return (int) $claimed;
}

/**
 * Release a held conversion claim so the quote can be retried.
 *
 * Only the holder's own row is released; the state guard prevents this from
 * overwriting a concurrent transition.
 *
 * @param string $quote_id Quote identifier.
 * @return int|false Released row count, or false on DB error.
 */
function ecomos_rfq_release_conversion_claim($quote_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_quotes';

    $released = $wpdb->query($wpdb->prepare(
        "UPDATE {$table}
            SET state = %s, updated_at = %s
          WHERE id = %s AND state = %s",
        'accepted',
        current_time('mysql', 1),
        $quote_id,
        'converting'
    ));

    if ($released === false) {
        return false;
    }

    return (int) $released;
}

/**
 * Idempotent replay payload for a quote that already has an order.
 *
 * @param array $quote Quote record.
 * @return array Conversion result shaped like a fresh success.
 */
function ecomos_rfq_conversion_replay($quote) {
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

/**
 * Resolve the exact WooCommerce product a priced quote line converts to.
 *
 * A requested variation stays a variation. Loading only the parent product would
 * collapse two variants of the same parent into one order line identity, which
 * violates the variation-identity rule for quoted lines.
 *
 * @param array $line Priced quote line.
 * @return array|WP_Error Resolved product reference, or WP_Error when the line
 *                        cannot be mapped to a real product/variation pair.
 */
function ecomos_rfq_resolve_conversion_product($line) {
    if (!function_exists('wc_get_product')) {
        return new WP_Error('woocommerce_unavailable', 'WooCommerce product API is unavailable for conversion', array('status' => 500));
    }

    $product_id = isset($line['productId']) ? (int) $line['productId'] : 0;
    $variation_id = isset($line['variationId']) ? (int) $line['variationId'] : 0;

    if ($product_id <= 0) {
        return new WP_Error('unresolvable_product', 'Quote line has no product identity to convert', array('status' => 400));
    }

    $lookup_id = $variation_id > 0 ? $variation_id : $product_id;
    $product = wc_get_product($lookup_id);

    if (!$product) {
        return new WP_Error(
            'unresolvable_product',
            sprintf('Product %d is no longer available; refresh the quotation before converting', $lookup_id),
            array('status' => 409)
        );
    }

    if ($variation_id > 0 && (int) $product->get_parent_id() !== $product_id) {
        return new WP_Error(
            'invalid_variation_mapping',
            sprintf('Variation %d does not belong to quoted product %d', $variation_id, $product_id),
            array('status' => 409)
        );
    }

    return array(
        'product'      => $product,
        'product_id'   => $product_id,
        'variation_id' => $variation_id,
    );
}

/**
 * Void an order whose quote link could not be recorded.
 *
 * Best effort, so a failed link cannot leave an unlinked duplicate order behind.
 * Deletion is preferred; otherwise the order is cancelled so staff see an
 * explicit abandoned order rather than a silent twin.
 *
 * @param object|null $order    WooCommerce order object, when one was created.
 * @param string|int  $order_id Order identifier.
 * @return bool True when the order was voided.
 */
function ecomos_rfq_discard_unlinked_order($order, $order_id) {
    global $ecomos_rfq_mock_orders;

    if (is_object($order) && method_exists($order, 'delete')) {
        $deleted = $order->delete(true);
        if (!is_wp_error($deleted) && $deleted) {
            return true;
        }
    }

    if (is_object($order) && method_exists($order, 'update_status')) {
        $order->update_status('cancelled', 'EcomOS RFQ: quote link failed; order voided to prevent a duplicate conversion.');
        return true;
    }

    if (is_array($ecomos_rfq_mock_orders) && isset($ecomos_rfq_mock_orders[$order_id])) {
        unset($ecomos_rfq_mock_orders[$order_id]);
        return true;
    }

    return false;
}

/**
 * Convert an accepted quote into a native WooCommerce order.
 *
 * Authorization belongs to the REST boundary. This helper additionally ignores
 * caller-supplied fulfilment policy, claims the quote with an atomic
 * compare-and-set, and links the created order with a guarded write, so
 * concurrent or retried calls yield exactly one linked order.
 *
 * @param string $quote_id ID of the quote to convert.
 * @param array $options Backwards-compatible argument. Caller-supplied policy
 *                       fields (e.g. reserve_stock) are ignored; policy comes
 *                       from ecomos_rfq_conversion_policy().
 * @return array|WP_Error Array with order details or WP_Error on failure.
 */
function ecomos_rfq_convert_quote_to_order($quote_id, $options = array()) {
    global $wpdb, $ecomos_rfq_mock_orders;

    // Caller options are intentionally not consulted anywhere below. They cannot
    // override merchant-owned policy; see ecomos_rfq_conversion_policy().
    unset($options);

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
        return ecomos_rfq_conversion_replay($quote);
    }

    // 2. Another request holds the transient claim for this quote.
    if ($quote['state'] === 'converting') {
        return new WP_Error('conversion_in_progress', 'Another conversion is already running for this quote', array('status' => 409));
    }

    // 3. Acceptance Gate: only accepted quotes can be converted to orders
    if ($quote['state'] !== 'accepted') {
        return new WP_Error(
            'invalid_conversion_state',
            sprintf('Quote state "%s" cannot be converted to order. Quote must be "accepted".', $quote['state']),
            array('status' => 400)
        );
    }

    // 4. Current Revision Lookup
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

    // 5. Resolve every line to an exact product/variation pair before any write.
    $resolved_lines = array();
    if (function_exists('wc_get_product')) {
        foreach ($current_rev['lines'] as $index => $line) {
            $resolved = ecomos_rfq_resolve_conversion_product($line);
            if (is_wp_error($resolved)) {
                return $resolved;
            }
            $resolved_lines[$index] = $resolved;
        }
    }

    // 6. Atomic claim: only the request that flips accepted -> converting proceeds.
    $claimed = ecomos_rfq_claim_quote_for_conversion($quote['id']);
    if ($claimed !== 1) {
        if ($claimed === false) {
            return new WP_Error('claim_failed', 'Could not lock the quote for conversion', array('status' => 500));
        }

        $latest = ecomos_rfq_get_quote($quote['id']);
        if ($latest && !empty($latest['converted_order_id'])) {
            return ecomos_rfq_conversion_replay($latest);
        }

        return new WP_Error('conversion_conflict', 'Quote state changed before conversion could start; reload and retry', array('status' => 409));
    }

    $contact = isset($quote['contact']) && is_array($quote['contact']) ? $quote['contact'] : array();
    $currency = isset($current_rev['currency']) ? $current_rev['currency'] : 'MAD';
    $order_id = null;
    $order = null;

    // 7. Create WooCommerce HPOS Order or fallback to mock representation
    if (function_exists('wc_create_order')) {
        $order_args = array(
            'status'        => 'pending',
            'customer_note' => sprintf('Converted from Quote %s (Revision %s)', $quote['quote_number'], $current_rev['revision_id']),
            'created_via'   => 'ecomos_rfq',
        );

        $order = wc_create_order($order_args);
        if (is_wp_error($order) || !$order) {
            ecomos_rfq_release_conversion_claim($quote['id']);
            return new WP_Error('order_creation_failed', 'Could not create WooCommerce order', array('status' => 500));
        }

        $order_id = $order->get_id();

        // Add line items, each carrying its own variation identity
        foreach ($current_rev['lines'] as $index => $line) {
            $qty = isset($line['quantity']) ? (int) $line['quantity'] : 1;
            $unit_price = isset($line['unitPriceExclTax']) ? (float) $line['unitPriceExclTax'] : 0.0;
            $tax_amount = isset($line['taxAmount']) ? (float) $line['taxAmount'] : 0.0;

            if (!empty($resolved_lines[$index])) {
                $order->add_product($resolved_lines[$index]['product'], $qty, array(
                    'subtotal' => $unit_price * $qty,
                    'total'    => $unit_price * $qty,
                ));
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

        // Stock reservation follows server policy only, never the request body.
        $policy = ecomos_rfq_conversion_policy();
        if ($policy['reserve_stock'] && function_exists('wc_reduce_stock_levels')) {
            wc_reduce_stock_levels($order_id);
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

    // 8. Link the quote to the created order with a guarded compare-and-set.
    // The state guard proves this request still holds the claim; the affected-row
    // count is checked so a lost claim can never be recorded as success.
    $now = current_time('mysql', 1);
    $quotes_table = $wpdb->prefix . 'ecomos_rfq_quotes';
    $updated = $wpdb->update(
        $quotes_table,
        array(
            'state'              => 'converted_to_order',
            'converted_order_id' => (string) $order_id,
            'updated_at'         => $now,
        ),
        array(
            'id'    => $quote['id'],
            'state' => 'converting',
        )
    );

    if ($updated !== 1) {
        // The claim was lost between order creation and linking. Void the order so
        // a failed link cannot leave an unlinked duplicate behind, then release
        // the claim so an operator-triggered retry can run.
        ecomos_rfq_discard_unlinked_order($order, $order_id);
        ecomos_rfq_release_conversion_claim($quote['id']);

        return new WP_Error(
            'conversion_link_failed',
            'Order was created but the quote link could not be recorded; the order was voided',
            array('status' => 500)
        );
    }

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
