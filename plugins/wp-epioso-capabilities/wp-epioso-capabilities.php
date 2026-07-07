<?php
/**
 * Plugin Name: Epioso Store Capabilities
 * Description: Exposes active store features (loyalty, advanced shipping, coupons) to the Next.js storefront.
 * Version: 1.0.0
 * Author: Epioso
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('epioso/v1', '/capabilities', array(
        'methods' => 'GET',
        'callback' => 'epioso_get_store_capabilities',
        'permission_callback' => '__return_true', // Publicly readable for the storefront
    ));
});

function epioso_get_store_capabilities() {
    $capabilities = array(
        'couponsEnabled' => get_option('woocommerce_enable_coupons') === 'yes',
        'loyaltyEnabled' => is_plugin_active('woocommerce-points-and-rewards/woocommerce-points-and-rewards.php') || is_plugin_active('wp-epioso-loyalty/wp-epioso-loyalty.php'),
        'guestCheckout' => get_option('woocommerce_enable_guest_checkout') === 'yes',
        'multiCurrency' => is_plugin_active('woocommerce-multilingual/wpml-woocommerce.php') || is_plugin_active('woocommerce-currency-switcher/index.php'),
        'version' => '1.0.0',
    );

    return rest_ensure_response($capabilities);
}

/**
 * Redirect password reset links in emails to the Next.js storefront.
 */
add_filter('retrieve_password_message', function($message, $key, $login) {
    // In production, you would pull this from an option or environment variable.
    // For now, assume the storefront is running on the same domain or use a relative path if possible.
    // We'll use a hardcoded storefront URL or rely on FRONTEND_URL if set.
    $storefront_url = defined('STOREFRONT_URL') ? STOREFRONT_URL : 'http://localhost:3000/account/password-reset';
    $new_link = "{$storefront_url}?key={$key}&login={$login}";
    
    // Replace the default wp-login.php reset link with the storefront link
    return preg_replace('/https?:\/\/[^\s]+wp-login\.php[^\s]+/', $new_link, $message);
}, 10, 3);
