<?php
/**
 * Plugin Name: EcomOS Addon Lifecycle Manager
 * Description: Reversible addon lifecycle, idempotent database migrations, safe rollback, and data retention for EcomOS.
 * Version: 1.0.0
 * Author: EcomOS Core Team
 * Requires at least: 6.2
 * Requires PHP: 8.1
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ECOMOS_ADDONS_VERSION', '1.0.0');
define('ECOMOS_ADDONS_DIR', plugin_dir_path(__FILE__));

require_once ECOMOS_ADDONS_DIR . 'lifecycle.php';
