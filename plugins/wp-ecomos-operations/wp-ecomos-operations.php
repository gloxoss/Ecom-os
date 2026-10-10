<?php
/**
 * Plugin Name: EcomOS Operations & Role Enforcement
 * Description: Server-enforced staff roles, permission boundaries, and operations management for EcomOS.
 * Version: 1.0.0
 * Author: EcomOS Core Team
 * Requires at least: 6.2
 * Requires PHP: 8.1
 */

if (!defined('ABSPATH')) {
    exit;
}

define('ECOMOS_OPERATIONS_VERSION', '1.0.0');
define('ECOMOS_OPERATIONS_DIR', plugin_dir_path(__FILE__));

require_once ECOMOS_OPERATIONS_DIR . 'capabilities.php';

// Register roles on plugin activation
register_activation_hook(__FILE__, 'ecomos_register_roles');

// Ensure roles exist on init if not yet registered
add_action('init', function () {
    if (!get_role('ecomos_operator')) {
        ecomos_register_roles();
    }
});
