<?php
/**
 * EcomOS RFQ Database Schema Definition and Migration
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

function ecomos_rfq_get_schema_queries($prefix, $charset_collate) {
    $quotes_table = $prefix . 'ecomos_rfq_quotes';
    $revisions_table = $prefix . 'ecomos_rfq_revisions';

    $sql_quotes = "CREATE TABLE {$quotes_table} (
        id varchar(64) NOT NULL,
        quote_number varchar(32) NOT NULL,
        state varchar(32) NOT NULL DEFAULT 'submitted',
        customer_name varchar(128) NOT NULL,
        customer_email varchar(128) NOT NULL,
        company_name varchar(128) DEFAULT NULL,
        tax_id varchar(64) DEFAULT NULL,
        contact_data longtext NOT NULL,
        items_data longtext NOT NULL,
        current_revision_id varchar(32) DEFAULT NULL,
        access_secret_hash varchar(64) NOT NULL,
        created_at datetime NOT NULL,
        updated_at datetime NOT NULL,
        expires_at datetime DEFAULT NULL,
        converted_order_id bigint unsigned DEFAULT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY uq_quote_number (quote_number),
        KEY ix_email (customer_email),
        KEY ix_state (state),
        KEY ix_hash (access_secret_hash)
    ) {$charset_collate};";

    $sql_revisions = "CREATE TABLE {$revisions_table} (
        id bigint unsigned NOT NULL AUTO_INCREMENT,
        quote_id varchar(64) NOT NULL,
        revision_id varchar(32) NOT NULL,
        revision_number int unsigned NOT NULL,
        created_by_staff_id varchar(64) NOT NULL,
        created_by_staff_name varchar(128) NOT NULL,
        lines_data longtext NOT NULL,
        subtotal_excl_tax decimal(12,2) NOT NULL DEFAULT '0.00',
        total_tax decimal(12,2) NOT NULL DEFAULT '0.00',
        total_incl_tax decimal(12,2) NOT NULL DEFAULT '0.00',
        -- Deliberately not defaulted to a hardcoded currency: an empty value makes the
        -- conversion fall back to the store currency instead of silently pricing a
        -- converted order in the wrong one.
        currency varchar(8) NOT NULL DEFAULT '',
        expires_at datetime NOT NULL,
        terms text DEFAULT NULL,
        notes text DEFAULT NULL,
        is_current tinyint(1) NOT NULL DEFAULT '1',
        created_at datetime NOT NULL,
        PRIMARY KEY  (id),
        UNIQUE KEY uq_quote_revision (quote_id, revision_id),
        KEY ix_quote (quote_id),
        KEY ix_current (quote_id, is_current)
    ) {$charset_collate};";

    return array($sql_quotes, $sql_revisions);
}

function ecomos_rfq_install_schema() {
    global $wpdb;
    require_once ABSPATH . 'wp-admin/includes/upgrade.php';

    $charset_collate = $wpdb->get_charset_collate();
    $queries = ecomos_rfq_get_schema_queries($wpdb->prefix, $charset_collate);

    foreach ($queries as $sql) {
        dbDelta($sql);
    }

    update_option('ecomos_rfq_db_version', '1.0.0');
}

function ecomos_rfq_uninstall_schema($drop_tables = false) {
    global $wpdb;

    if ($drop_tables) {
        $quotes_table = $wpdb->prefix . 'ecomos_rfq_quotes';
        $revisions_table = $wpdb->prefix . 'ecomos_rfq_revisions';

        $wpdb->query("DROP TABLE IF EXISTS {$revisions_table};");
        $wpdb->query("DROP TABLE IF EXISTS {$quotes_table};");
    }

    delete_option('ecomos_rfq_db_version');
}
