<?php
/**
 * Plugin Name: EcomOS RFQ (Request for Quote / Devis)
 * Plugin URI: https://github.com/gloxoss/Ecom-os
 * Description: Native companion plugin providing versioned headless REST API, custom durable quote tables, immutable offer revisions, and guest HMAC ownership for EcomOS.
 * Version: 1.0.0
 * Author: EPIOSO
 * Author URI: https://epioso.com
 * License: GPLv2 or later
 * Text Domain: wp-ecomos-rfq
 * Requires at least: 6.2
 * Requires PHP: 8.1
 * WC requires at least: 8.5
 *
 * @package EcomOS_RFQ
 */

if (!defined('ABSPATH')) {
    exit;
}

// Quotes convert into HPOS order tables; declare it so WooCommerce does not
// fall back to legacy post storage with a compatibility warning.
add_action('before_woocommerce_init', function () {
    if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility('custom_order_tables', __FILE__, true);
    }
});

define('ECOMOS_RFQ_VERSION', '1.0.0');
define('ECOMOS_RFQ_PLUGIN_DIR', plugin_dir_path(__FILE__));

require_once ECOMOS_RFQ_PLUGIN_DIR . 'schema.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'repository.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'offers.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'documents.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'notifications.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'conversion.php';
require_once ECOMOS_RFQ_PLUGIN_DIR . 'routes.php';

register_activation_hook(__FILE__, function () {
    ecomos_rfq_install_schema();
});

register_deactivation_hook(__FILE__, function () {
    // Respect data retention by default: do not drop tables on deactivation
    ecomos_rfq_uninstall_schema(false);
});
