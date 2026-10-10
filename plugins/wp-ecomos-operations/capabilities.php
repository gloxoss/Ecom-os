<?php
/**
 * EcomOS Server-Enforced Staff Capabilities and Role Matrix.
 * 
 * Enforces server-side authorization boundaries for store operations.
 * Prevents non-administrators from accessing technical settings or code editors.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Returns role capability mappings for EcomOS staff.
 */
function ecomos_get_role_capabilities(): array {
    return array(
        'ecomos_operator' => array(
            'read'                          => true,
            'edit_posts'                    => true,
            'edit_pages'                    => true,
            'publish_pages'                 => true,
            'edit_published_pages'          => true,
            'edit_products'                 => true,
            'publish_products'              => true,
            'read_private_products'         => true,
            'edit_others_products'          => true,
            'delete_products'               => true,
            'edit_shop_orders'              => true,
            'read_private_shop_orders'      => true,
            'edit_others_shop_orders'       => true,
            'edit_shop_coupons'             => true,
            'publish_shop_coupons'          => true,
            'manage_woocommerce'            => true,
            'ecomos_manage_inventory'       => true,
            'ecomos_view_operations_landing'=> true,
            'ecomos_manage_quotes'          => true,
            // Strictly denied technical capabilities
            'activate_plugins'              => false,
            'edit_plugins'                  => false,
            'edit_themes'                   => false,
            'edit_files'                    => false,
            'manage_options'                => false,
            'unfiltered_html'               => false,
        ),
        'ecomos_fulfillment' => array(
            'read'                          => true,
            'read_private_shop_orders'      => true,
            'edit_shop_orders'              => true,
            'read_private_products'         => true,
            'ecomos_view_operations_landing'=> true,
            // Denied commercial editing and settings
            'edit_products'                 => false,
            'publish_products'              => false,
            'edit_shop_coupons'             => false,
            'manage_woocommerce'            => false,
            'ecomos_manage_inventory'       => false,
            'ecomos_manage_quotes'          => false,
            'activate_plugins'              => false,
            'edit_plugins'                  => false,
            'edit_themes'                   => false,
            'edit_files'                    => false,
            'manage_options'                => false,
        ),
    );
}

/**
 * Registers custom EcomOS staff roles.
 */
function ecomos_register_roles(): void {
    $roles = ecomos_get_role_capabilities();

    if (!get_role('ecomos_operator')) {
        add_role('ecomos_operator', __('EcomOS Store Manager', 'ecomos'), $roles['ecomos_operator']);
    }

    if (!get_role('ecomos_fulfillment')) {
        add_role('ecomos_fulfillment', __('EcomOS Fulfillment Clerk', 'ecomos'), $roles['ecomos_fulfillment']);
    }
}

/**
 * Checks whether quote capability is currently active.
 * Invariant: If quote addon is disabled, quote permissions return false regardless of role.
 */
function ecomos_is_quote_addon_active(): bool {
    // Check if quote addon option or plugin is enabled
    $addon_active = (bool) apply_filters('ecomos_is_addon_active', false, 'quotes');
    if ($addon_active) {
        return true;
    }

    if (function_exists('is_plugin_active') && is_plugin_active('wp-epioso-quotes/wp-epioso-quotes.php')) {
        return true;
    }

    return get_option('ecomos_addon_quotes_enabled') === 'yes';
}

/**
 * Server-side evaluation of job permissions.
 */
function ecomos_check_permission(string $job, ?int $user_id = null): bool {
    $user = $user_id ? get_userdata($user_id) : wp_get_current_user();
    if (!$user || !$user->exists()) {
        return false;
    }

    // Platform administrator can perform all tasks
    if ($user->has_cap('administrator') || user_can($user, 'manage_options')) {
        if ($job === 'quotes') {
            return ecomos_is_quote_addon_active();
        }
        return true;
    }

    switch ($job) {
        case 'view_orders':
            return user_can($user, 'read_private_shop_orders');

        case 'update_order_status':
            return user_can($user, 'edit_shop_orders');

        case 'manage_products':
            return user_can($user, 'edit_products');

        case 'manage_inventory':
            return user_can($user, 'ecomos_manage_inventory');

        case 'manage_coupons':
            return user_can($user, 'edit_shop_coupons');

        case 'manage_content':
            return user_can($user, 'edit_pages');

        case 'quotes':
            if (!ecomos_is_quote_addon_active()) {
                return false;
            }
            return user_can($user, 'ecomos_manage_quotes');

        case 'technical_settings':
            return user_can($user, 'manage_options');

        default:
            return false;
    }
}

/**
 * REST API permission callback helper.
 * Returns true if permitted, or WP_Error with 403 status code if denied.
 */
function ecomos_rest_require_capability(string $job) {
    if (ecomos_check_permission($job)) {
        return true;
    }

    return new WP_Error(
        'rest_forbidden',
        sprintf(__('You do not have permission to perform the "%s" operation.', 'ecomos'), $job),
        array('status' => 403)
    );
}

/**
 * Restrict non-admin staff from accessing core technical admin URLs directly.
 */
function ecomos_enforce_admin_boundaries(): void {
    if (!is_admin() || wp_doing_ajax() || wp_doing_cron()) {
        return;
    }

    $user = wp_get_current_user();
    if (!$user || !$user->exists()) {
        return;
    }

    // If user is administrator, allow everything
    if (user_can($user, 'manage_options')) {
        return;
    }

    // If user has an EcomOS staff role
    $staff_roles = array('ecomos_operator', 'ecomos_fulfillment');
    $user_roles = (array) $user->roles;
    if (array_intersect($staff_roles, $user_roles)) {
        global $pagenow;
        $blocked_pages = array(
            'options-general.php',
            'options.php',
            'plugins.php',
            'plugin-install.php',
            'plugin-editor.php',
            'theme-editor.php',
            'themes.php',
            'tools.php',
        );

        if (in_array($pagenow, $blocked_pages, true)) {
            wp_die(
                esc_html__('Access Denied: Administrative and technical settings are restricted to platform administrators.', 'ecomos'),
                esc_html__('Forbidden', 'ecomos'),
                array('response' => 403)
            );
        }
    }
}
add_action('admin_init', 'ecomos_enforce_admin_boundaries');
