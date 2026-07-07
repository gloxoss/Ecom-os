<?php
/**
 * Plugin Name: EPIOSO i18n Companion
 * Description: Manages storefront translations and syncs them to the Next.js frontend via API.
 * Version: 1.0.0
 * Author: EPIOSO
 */

if (!defined('ABSPATH')) {
    exit;
}

define('EPIOSO_I18N_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('EPIOSO_I18N_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once EPIOSO_I18N_PLUGIN_DIR . 'api-client.php';
require_once EPIOSO_I18N_PLUGIN_DIR . 'admin-page.php';

// Initialization
add_action('plugins_loaded', 'epioso_i18n_init');
function epioso_i18n_init() {
    // Add activation hooks, translations, etc.
}
