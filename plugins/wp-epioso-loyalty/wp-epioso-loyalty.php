<?php
/**
 * Plugin Name: Epioso Loyalty & Rewards
 * Description: Simple loyalty system that grants points for purchases and allows redeeming points for discounts.
 * Version: 1.0.0
 * Author: Epioso
 */

if (!defined('ABSPATH')) {
    exit;
}

// Configuration
define('EPIOSO_LOYALTY_EARN_RATE', 1); // 1 point per $1 spent
define('EPIOSO_LOYALTY_REDEEM_RATE', 0.05); // 1 point = $0.05 discount

// Register REST Routes
add_action('rest_api_init', function () {
    register_rest_route('epioso/v1', '/loyalty/balance', array(
        'methods' => 'GET',
        'callback' => 'epioso_loyalty_get_balance',
        'permission_callback' => function () { return is_user_logged_in(); },
    ));

    register_rest_route('epioso/v1', '/loyalty/redeem', array(
        'methods' => 'POST',
        'callback' => 'epioso_loyalty_redeem_points',
        'permission_callback' => function () { return is_user_logged_in(); },
    ));
});

// Get balance
function epioso_loyalty_get_balance() {
    $user_id = get_current_user_id();
    $points = (int) get_user_meta($user_id, 'epioso_loyalty_points', true);
    return rest_ensure_response(array('points' => $points, 'value_minor' => $points * EPIOSO_LOYALTY_REDEEM_RATE * 100));
}

// Redeem points (Generates a WooCommerce coupon)
function epioso_loyalty_redeem_points(WP_REST_Request $request) {
    $user_id = get_current_user_id();
    $points_to_redeem = (int) $request->get_param('points');

    if ($points_to_redeem <= 0) {
        return new WP_Error('invalid_points', 'Invalid points amount', array('status' => 400));
    }

    $current_points = (int) get_user_meta($user_id, 'epioso_loyalty_points', true);
    if ($current_points < $points_to_redeem) {
        return new WP_Error('insufficient_points', 'Insufficient points', array('status' => 400));
    }

    // Deduct points
    update_user_meta($user_id, 'epioso_loyalty_points', $current_points - $points_to_redeem);

    // Create a coupon
    $discount_amount = $points_to_redeem * EPIOSO_LOYALTY_REDEEM_RATE;
    $coupon_code = 'LOYALTY-' . wp_generate_password(8, false, false);

    $coupon = new WC_Coupon();
    $coupon->set_code($coupon_code);
    $coupon->set_discount_type('fixed_cart');
    $coupon->set_amount($discount_amount);
    $coupon->set_individual_use(false);
    $coupon->set_usage_limit(1);
    $coupon->set_email_restrictions(array(wp_get_current_user()->user_email));
    $coupon->save();

    return rest_ensure_response(array(
        'success' => true,
        'coupon_code' => $coupon_code,
        'discount_amount' => $discount_amount,
        'remaining_points' => $current_points - $points_to_redeem
    ));
}

// Award points on order completion
add_action('woocommerce_order_status_completed', 'epioso_loyalty_award_points');
function epioso_loyalty_award_points($order_id) {
    $order = wc_get_order($order_id);
    if (!$order || !$order->get_user_id()) return;

    // Check if points already awarded for this order
    if ($order->get_meta('_epioso_loyalty_awarded')) return;

    $total = $order->get_total();
    $points_earned = floor($total * EPIOSO_LOYALTY_EARN_RATE);

    if ($points_earned > 0) {
        $user_id = $order->get_user_id();
        $current_points = (int) get_user_meta($user_id, 'epioso_loyalty_points', true);
        update_user_meta($user_id, 'epioso_loyalty_points', $current_points + $points_earned);
        $order->update_meta_data('_epioso_loyalty_awarded', $points_earned);
        $order->save();
    }
}
