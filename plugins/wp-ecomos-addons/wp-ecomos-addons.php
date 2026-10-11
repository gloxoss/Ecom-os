<?php
/**
 * Plugin Name: EcomOS Addon Lifecycle Manager
 * Description: Reversible addon lifecycle, idempotent database migrations, safe rollback, and data retention for EcomOS.
 * Version: 1.0.0
 * Author: EcomOS Core Team
 * Requires at least: 6.2
 * Requires PHP: 8.1
 * WC requires at least: 8.5
 */

if (!defined('ABSPATH')) {
    exit;
}

// Addon migrations touch WooCommerce order data; declare HPOS support explicitly.
add_action('before_woocommerce_init', function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

define('ECOMOS_ADDONS_VERSION', '1.0.0');
define('ECOMOS_ADDONS_DIR', plugin_dir_path(__FILE__));

require_once ECOMOS_ADDONS_DIR . 'lifecycle.php';
