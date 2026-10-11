<?php
/**
 * EcomOS RFQ Repository: Durable Data Access & Immutable Revisions
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

function ecomos_rfq_create_quote($data) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_quotes';

    if (empty($data['id']) || empty($data['quote_number']) || empty($data['customer_name']) || empty($data['customer_email']) || empty($data['access_secret_hash'])) {
        return new WP_Error('missing_required_fields', 'Required quote fields are missing', array('status' => 400));
    }

    $now = current_time('mysql', 1);

    $row = array(
        'id'                  => sanitize_text_field($data['id']),
        'quote_number'        => sanitize_text_field($data['quote_number']),
        'state'               => isset($data['state']) ? sanitize_text_field($data['state']) : 'submitted',
        'customer_name'       => sanitize_text_field($data['customer_name']),
        'customer_email'      => sanitize_email($data['customer_email']),
        'company_name'        => isset($data['company_name']) ? sanitize_text_field($data['company_name']) : null,
        'tax_id'              => isset($data['tax_id']) ? sanitize_text_field($data['tax_id']) : null,
        'contact_data'        => is_string($data['contact_data']) ? $data['contact_data'] : wp_json_encode($data['contact_data']),
        'items_data'          => is_string($data['items_data']) ? $data['items_data'] : wp_json_encode($data['items_data']),
        'current_revision_id' => null,
        'access_secret_hash'  => sanitize_text_field($data['access_secret_hash']),
        'created_at'          => isset($data['created_at']) ? $data['created_at'] : $now,
        'updated_at'          => $now,
        'expires_at'          => isset($data['expires_at']) ? $data['expires_at'] : null,
        'converted_order_id'  => null,
    );

    $inserted = $wpdb->insert($table, $row);
    if ($inserted === false) {
        return new WP_Error('db_insert_failed', 'Could not save quote to database: ' . $wpdb->last_error, array('status' => 500));
    }

    return ecomos_rfq_get_quote($row['id']);
}

function ecomos_rfq_get_quote($id_or_number) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_quotes';

    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$table} WHERE id = %s OR quote_number = %s LIMIT 1",
        $id_or_number,
        $id_or_number
    ), ARRAY_A);

    if (!$row) {
        return null;
    }

    $row['contact'] = json_decode($row['contact_data'], true);
    $row['items'] = json_decode($row['items_data'], true);
    $row['revisions'] = ecomos_rfq_get_revisions($row['id']);

    return $row;
}

function ecomos_rfq_get_revisions($quote_id) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_revisions';

    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT * FROM {$table} WHERE quote_id = %s ORDER BY revision_number ASC",
        $quote_id
    ), ARRAY_A);

    if (!$rows) {
        return array();
    }

    foreach ($rows as &$rev) {
        $rev['lines'] = json_decode($rev['lines_data'], true);
        $rev['is_current'] = (bool) $rev['is_current'];
        $rev['subtotal_excl_tax'] = (float) $rev['subtotal_excl_tax'];
        $rev['total_tax'] = (float) $rev['total_tax'];
        $rev['total_incl_tax'] = (float) $rev['total_incl_tax'];
    }

    return $rows;
}

function ecomos_rfq_add_revision($quote_id, $data) {
    global $wpdb;
    $revisions_table = $wpdb->prefix . 'ecomos_rfq_revisions';
    $quotes_table = $wpdb->prefix . 'ecomos_rfq_quotes';

    $quote = ecomos_rfq_get_quote($quote_id);
    if (!$quote) {
        return new WP_Error('not_found', 'Quote not found', array('status' => 404));
    }

    if (empty($data['lines']) || empty($data['expires_at'])) {
        return new WP_Error('invalid_offer', 'Lines and expiration date are required', array('status' => 400));
    }

    $existing_count = (int) $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM {$revisions_table} WHERE quote_id = %s",
        $quote_id
    ));

    $revision_number = $existing_count + 1;
    $revision_id = 'rev_' . $revision_number;
    $now = current_time('mysql', 1);

    // Atomically deactivate prior revisions
    $wpdb->update(
        $revisions_table,
        array('is_current' => 0),
        array('quote_id' => $quote_id)
    );

    // Calculate totals
    $subtotal = 0.0;
    $tax = 0.0;
    $total = 0.0;
    foreach ($data['lines'] as $line) {
        $subtotal += isset($line['totalExclTax']) ? (float) $line['totalExclTax'] : 0.0;
        $tax      += isset($line['taxAmount'])    ? (float) $line['taxAmount']    : 0.0;
        $total    += isset($line['totalInclTax']) ? (float) $line['totalInclTax'] : 0.0;
    }

    $rev_row = array(
        'quote_id'             => $quote_id,
        'revision_id'          => $revision_id,
        'revision_number'      => $revision_number,
        'created_by_staff_id'  => isset($data['staff_id']) ? sanitize_text_field($data['staff_id']) : 'system',
        'created_by_staff_name'=> isset($data['staff_name']) ? sanitize_text_field($data['staff_name']) : 'Operator',
        'lines_data'           => is_string($data['lines']) ? $data['lines'] : wp_json_encode($data['lines']),
        'subtotal_excl_tax'    => $subtotal,
        'total_tax'            => $tax,
        'total_incl_tax'       => $total,
        // Never default to a hardcoded currency: a quote priced in the wrong currency
        // becomes an order priced in the wrong currency. Fall back to the store's own.
        'currency'             => !empty($data['currency'])
            ? sanitize_text_field($data['currency'])
            : (function_exists('get_woocommerce_currency') ? get_woocommerce_currency() : ''),
        'expires_at'           => $data['expires_at'],
        'terms'                => isset($data['terms']) ? sanitize_textarea_field($data['terms']) : null,
        'notes'                => isset($data['notes']) ? sanitize_textarea_field($data['notes']) : null,
        'is_current'           => 1,
        'created_at'           => $now,
    );

    $inserted = $wpdb->insert($revisions_table, $rev_row);
    if ($inserted === false) {
        return new WP_Error('db_error', 'Could not record offer revision: ' . $wpdb->last_error, array('status' => 500));
    }

    $new_state = $revision_number === 1 ? 'offer_created' : 'revised';
    $wpdb->update(
        $quotes_table,
        array(
            'current_revision_id' => $revision_id,
            'state'               => $new_state,
            'expires_at'          => $data['expires_at'],
            'updated_at'          => $now,
        ),
        array('id' => $quote_id)
    );

    return ecomos_rfq_get_quote($quote_id);
}

function ecomos_rfq_update_state($quote_id, $new_state, $current_state_condition = null, $extra = array()) {
    global $wpdb;
    $table = $wpdb->prefix . 'ecomos_rfq_quotes';

    $where = array('id' => $quote_id);
    if ($current_state_condition !== null) {
        $where['state'] = $current_state_condition;
    }

    $update_data = array_merge(array(
        'state'      => sanitize_text_field($new_state),
        'updated_at' => current_time('mysql', 1),
    ), $extra);

    $affected = $wpdb->update($table, $update_data, $where);
    if ($affected === false || ($current_state_condition !== null && $affected === 0)) {
        return false;
    }

    return true;
}

function ecomos_rfq_verify_guest_access($quote, $provided_secret) {
    if (empty($quote['access_secret_hash']) || empty($provided_secret)) {
        return false;
    }
    $computed = hash('sha256', trim($provided_secret));
    return hash_equals($quote['access_secret_hash'], $computed);
}
