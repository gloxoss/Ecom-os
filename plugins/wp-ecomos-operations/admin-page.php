<?php
/**
 * EcomOS Operations WP Admin Landing Page
 *
 * Lightweight, capability-scoped operational dashboard for merchant operators.
 * Uses native WordPress authentication and WooCommerce CRUD.
 * Avoids second merchant backends and duplicate reporting databases.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register top-level EcomOS Operations menu page.
 */
function ecomos_register_operations_menu() {
    add_menu_page(
        __('EcomOS Operations', 'wp-ecomos-operations'),
        __('Operations', 'wp-ecomos-operations'),
        'edit_shop_orders',
        'ecomos-operations',
        'ecomos_render_operations_page',
        'dashicons-chart-pie',
        2
    );
}
add_action('admin_menu', 'ecomos_register_operations_menu');

/**
 * Enqueue lightweight administrative stylesheet for operations page.
 *
 * @param string $hook_suffix
 */
function ecomos_enqueue_operations_assets($hook_suffix) {
    if ($hook_suffix !== 'toplevel_page_ecomos-operations') {
        return;
    }

    $custom_css = "
        .ecomos-ops-wrap { max-width: 1300px; margin-top: 15px; }
        .ecomos-ops-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .ecomos-ops-badge { background: #2271b1; color: #fff; padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .ecomos-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .ecomos-stat-card { background: #fff; border: 1px solid #c3c4c7; border-left: 4px solid #2271b1; padding: 16px; border-radius: 4px; }
        .ecomos-stat-card.alert { border-left-color: #d63638; }
        .ecomos-stat-card.warning { border-left-color: #dba617; }
        .ecomos-stat-card.success { border-left-color: #00a32a; }
        .ecomos-stat-label { font-size: 13px; color: #646970; margin-bottom: 6px; }
        .ecomos-stat-value { font-size: 28px; font-weight: 700; color: #1d2327; }
        .ecomos-layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
        @media (max-width: 960px) { .ecomos-layout-grid { grid-template-columns: 1fr; } }
        .ecomos-table-wrap { background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; margin-bottom: 24px; overflow: hidden; }
        .ecomos-table-header { padding: 12px 16px; border-bottom: 1px solid #c3c4c7; background: #f6f7f7; display: flex; justify-content: space-between; align-items: center; }
        .ecomos-table-header h2 { margin: 0; font-size: 15px; font-weight: 600; color: #1d2327; }
        .ecomos-table { width: 100%; border-collapse: collapse; }
        .ecomos-table th, .ecomos-table td { padding: 10px 16px; text-align: left; border-bottom: 1px solid #f0f0f1; font-size: 13px; }
        .ecomos-table th { background: #fafafa; font-weight: 600; color: #50575e; }
        .ecomos-table tr:hover { background: #f6f7f7; }
        .ecomos-status-pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .status-processing { background: #c6e1c6; color: #1e4620; }
        .status-pending { background: #f8dda6; color: #6d4b00; }
        .status-on-hold { background: #f8dda6; color: #6d4b00; }
        .status-low-stock { background: #f8d7da; color: #721c24; }
        .ecomos-shortcuts { background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; padding: 16px; margin-bottom: 24px; }
        .ecomos-shortcuts h2 { margin-top: 0; font-size: 15px; font-weight: 600; }
        .ecomos-shortcut-links { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
        .ecomos-shortcut-links a { display: flex; align-items: center; gap: 8px; text-decoration: none; padding: 8px 10px; border-radius: 4px; color: #2271b1; background: #f6f7f7; font-weight: 500; font-size: 13px; }
        .ecomos-shortcut-links a:hover { background: #2271b1; color: #fff; }
        .ecomos-addon-card { background: #fff; border: 1px solid #c3c4c7; border-left: 4px solid #72aee6; padding: 16px; border-radius: 4px; margin-bottom: 24px; }
    ";
    wp_add_inline_style('wp-admin', $custom_css);
}
add_action('admin_enqueue_scripts', 'ecomos_enqueue_operations_assets');

/**
 * Retrieve summary counts for orders and stock.
 *
 * @return array
 */
function ecomos_get_operations_summary() {
    $summary = [
        'processing_orders' => 0,
        'on_hold_orders'    => 0,
        'low_stock_count'   => 0,
        'completed_today'   => 0,
    ];

    if (function_exists('wc_orders_count')) {
        $summary['processing_orders'] = wc_orders_count('processing');
        $summary['on_hold_orders']    = wc_orders_count('on-hold');
        $summary['completed_today']   = wc_orders_count('completed');
    } elseif (function_exists('wc_get_orders')) {
        $summary['processing_orders'] = count(wc_get_orders(['status' => 'processing', 'return' => 'ids', 'limit' => 100]));
        $summary['on_hold_orders']    = count(wc_get_orders(['status' => 'on-hold', 'return' => 'ids', 'limit' => 100]));
    }

    if (function_exists('wc_get_products')) {
        $low_stock_amount = (int) get_option('woocommerce_notify_low_stock_amount', 2);
        $low_stock_products = wc_get_products([
            'status'     => 'publish',
            'limit'      => 50,
            'meta_query' => [
                [
                    'key'     => '_stock',
                    'value'   => $low_stock_amount,
                    'compare' => '<=',
                    'type'    => 'NUMERIC',
                ],
                [
                    'key'     => '_manage_stock',
                    'value'   => 'yes',
                    'compare' => '=',
                ],
            ],
            'return' => 'ids',
        ]);
        $summary['low_stock_count'] = count($low_stock_products);
    }

    return $summary;
}

/**
 * Fetch latest priority orders requiring merchant action.
 *
 * @param int $limit
 * @return array
 */
function ecomos_get_priority_orders($limit = 6) {
    if (!function_exists('wc_get_orders')) {
        return [];
    }

    $orders = wc_get_orders([
        'status'  => ['processing', 'pending', 'on-hold'],
        'limit'   => $limit,
        'orderby' => 'date',
        'order'   => 'DESC',
    ]);

    $results = [];
    foreach ($orders as $order) {
        $order_id = $order->get_id();
        $results[] = [
            'id'             => $order_id,
            'number'         => $order->get_order_number(),
            'status'         => $order->get_status(),
            'formatted_date' => $order->get_date_created() ? $order->get_date_created()->date_i18n(get_option('date_format') . ' ' . get_option('time_format')) : '—',
            'customer'       => trim($order->get_formatted_billing_full_name()) ?: __('Guest', 'wp-ecomos-operations'),
            'total'          => $order->get_formatted_order_total(),
            'edit_url'       => admin_url('admin.php?page=wc-orders&action=edit&id=' . $order_id),
        ];
    }

    return $results;
}

/**
 * Fetch low-stock products.
 *
 * @param int $limit
 * @return array
 */
function ecomos_get_low_stock_products($limit = 6) {
    if (!function_exists('wc_get_products')) {
        return [];
    }

    $low_stock_amount = (int) get_option('woocommerce_notify_low_stock_amount', 2);
    $products = wc_get_products([
        'status'     => 'publish',
        'limit'      => $limit,
        'meta_query' => [
            [
                'key'     => '_stock',
                'value'   => $low_stock_amount,
                'compare' => '<=',
                'type'    => 'NUMERIC',
            ],
            [
                'key'     => '_manage_stock',
                'value'   => 'yes',
                'compare' => '=',
            ],
        ],
    ]);

    $results = [];
    foreach ($products as $product) {
        $product_id = $product->get_id();
        $results[] = [
            'id'       => $product_id,
            'name'     => $product->get_name(),
            'sku'      => $product->get_sku() ?: '—',
            'stock'    => (int) $product->get_stock_quantity(),
            'edit_url' => admin_url('post.php?post=' . $product_id . '&action=edit'),
        ];
    }

    return $results;
}

/**
 * Render optional RFQ Quote queue addon slot.
 * Only rendered when quote addon is active.
 */
function ecomos_render_quotes_addon_slot() {
    $addon_enabled = get_option('ecomos_addon_quotes_enabled', 'no');
    if ($addon_enabled !== 'yes') {
        // Dynamic addon gating: completely absent when disabled
        return;
    }

    $pending_quotes = (int) get_option('ecomos_pending_quotes_count', 0);
    ?>
    <div class="ecomos-addon-card" role="region" aria-label="<?php esc_attr_e('RFQ Quotes Queue', 'wp-ecomos-operations'); ?>">
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h3 style="margin:0 0 4px 0; font-size:14px;"><?php esc_html_e('RFQ Quotes Queue (Addon Active)', 'wp-ecomos-operations'); ?></h3>
                <p style="margin:0; color:#646970; font-size:12px;"><?php printf(esc_html__('%d pending quotes awaiting merchant review', 'wp-ecomos-operations'), $pending_quotes); ?></p>
            </div>
            <a href="<?php echo esc_url(admin_url('admin.php?page=ecomos-quotes')); ?>" class="button button-secondary button-small">
                <?php esc_html_e('Manage Quotes', 'wp-ecomos-operations'); ?>
            </a>
        </div>
    </div>
    <?php
}
add_action('ecomos_operations_addon_slots', 'ecomos_render_quotes_addon_slot');

/**
 * Main render function for EcomOS Operations landing page.
 */
function ecomos_render_operations_page() {
    if (!current_user_can('edit_shop_orders')) {
        wp_die(__('You do not have sufficient permissions to access EcomOS Operations.', 'wp-ecomos-operations'), 403);
    }

    $summary        = ecomos_get_operations_summary();
    $priority_orders = ecomos_get_priority_orders(8);
    $low_stock       = ecomos_get_low_stock_products(6);
    ?>
    <div class="wrap ecomos-ops-wrap">
        <header class="ecomos-ops-header">
            <div>
                <h1 style="margin:0 0 4px 0; font-size:24px; font-weight:700;"><?php esc_html_e('EcomOS Operations', 'wp-ecomos-operations'); ?></h1>
                <p style="margin:0; color:#646970; font-size:13px;"><?php esc_html_e('Daily merchant triage, order fulfillment, and inventory queue.', 'wp-ecomos-operations'); ?></p>
            </div>
            <span class="ecomos-ops-badge"><?php esc_html_e('Native Woo / HPOS', 'wp-ecomos-operations'); ?></span>
        </header>

        <!-- KPI Summary Cards -->
        <section class="ecomos-stat-grid" aria-label="<?php esc_attr_e('Operational Highlights', 'wp-ecomos-operations'); ?>">
            <div class="ecomos-stat-card warning">
                <div class="ecomos-stat-label"><?php esc_html_e('Orders to Process', 'wp-ecomos-operations'); ?></div>
                <div class="ecomos-stat-value"><?php echo esc_html($summary['processing_orders']); ?></div>
            </div>
            <div class="ecomos-stat-card">
                <div class="ecomos-stat-label"><?php esc_html_e('Orders On Hold', 'wp-ecomos-operations'); ?></div>
                <div class="ecomos-stat-value"><?php echo esc_html($summary['on_hold_orders']); ?></div>
            </div>
            <div class="ecomos-stat-card <?php echo $summary['low_stock_count'] > 0 ? 'alert' : 'success'; ?>">
                <div class="ecomos-stat-label"><?php esc_html_e('Low Stock Warnings', 'wp-ecomos-operations'); ?></div>
                <div class="ecomos-stat-value"><?php echo esc_html($summary['low_stock_count']); ?></div>
            </div>
            <div class="ecomos-stat-card success">
                <div class="ecomos-stat-label"><?php esc_html_e('Completed Today', 'wp-ecomos-operations'); ?></div>
                <div class="ecomos-stat-value"><?php echo esc_html($summary['completed_today']); ?></div>
            </div>
        </section>

        <!-- Dynamic Addon Slots -->
        <?php do_action('ecomos_operations_addon_slots'); ?>

        <div class="ecomos-layout-grid">
            <!-- Left Column: Priority Orders & Low Stock Triage -->
            <div>
                <!-- Priority Orders Queue -->
                <section class="ecomos-table-wrap" aria-labelledby="ecomos-orders-heading">
                    <div class="ecomos-table-header">
                        <h2 id="ecomos-orders-heading"><?php esc_html_e('Priority Order Queue', 'wp-ecomos-operations'); ?></h2>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=wc-orders')); ?>" class="button button-secondary button-small">
                            <?php esc_html_e('View All Orders', 'wp-ecomos-operations'); ?>
                        </a>
                    </div>
                    <?php if (empty($priority_orders)) : ?>
                        <div style="padding:24px; text-align:center; color:#646970;">
                            <?php esc_html_e('All caught up! No urgent orders waiting in processing.', 'wp-ecomos-operations'); ?>
                        </div>
                    <?php else : ?>
                        <table class="ecomos-table" role="table">
                            <thead>
                                <tr>
                                    <th scope="col"><?php esc_html_e('Order', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Customer', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Status', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Total', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Action', 'wp-ecomos-operations'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($priority_orders as $order_item) : ?>
                                    <tr>
                                        <td>
                                            <a href="<?php echo esc_url($order_item['edit_url']); ?>" style="font-weight:600;">
                                                #<?php echo esc_html($order_item['number']); ?>
                                            </a>
                                            <div style="font-size:11px; color:#646970;"><?php echo esc_html($order_item['formatted_date']); ?></div>
                                        </td>
                                        <td><?php echo esc_html($order_item['customer']); ?></td>
                                        <td>
                                            <span class="ecomos-status-pill status-<?php echo esc_attr($order_item['status']); ?>">
                                                <?php echo esc_html(wc_get_order_status_name($order_item['status'])); ?>
                                            </span>
                                        </td>
                                        <td><?php echo wp_kses_post($order_item['total']); ?></td>
                                        <td>
                                            <a href="<?php echo esc_url($order_item['edit_url']); ?>" class="button button-small">
                                                <?php esc_html_e('Fulfill', 'wp-ecomos-operations'); ?>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </section>

                <!-- Low Stock Products -->
                <section class="ecomos-table-wrap" aria-labelledby="ecomos-stock-heading">
                    <div class="ecomos-table-header">
                        <h2 id="ecomos-stock-heading"><?php esc_html_e('Low Stock Alerts', 'wp-ecomos-operations'); ?></h2>
                        <a href="<?php echo esc_url(admin_url('edit.php?post_type=product')); ?>" class="button button-secondary button-small">
                            <?php esc_html_e('View Catalog', 'wp-ecomos-operations'); ?>
                        </a>
                    </div>
                    <?php if (empty($low_stock)) : ?>
                        <div style="padding:24px; text-align:center; color:#646970;">
                            <?php esc_html_e('Inventory healthy. No products below threshold.', 'wp-ecomos-operations'); ?>
                        </div>
                    <?php else : ?>
                        <table class="ecomos-table" role="table">
                            <thead>
                                <tr>
                                    <th scope="col"><?php esc_html_e('Product', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('SKU', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Remaining', 'wp-ecomos-operations'); ?></th>
                                    <th scope="col"><?php esc_html_e('Action', 'wp-ecomos-operations'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($low_stock as $stock_item) : ?>
                                    <tr>
                                        <td>
                                            <a href="<?php echo esc_url($stock_item['edit_url']); ?>" style="font-weight:600;">
                                                <?php echo esc_html($stock_item['name']); ?>
                                            </a>
                                        </td>
                                        <td><code><?php echo esc_html($stock_item['sku']); ?></code></td>
                                        <td>
                                            <span class="ecomos-status-pill status-low-stock">
                                                <?php printf(esc_html__('%d in stock', 'wp-ecomos-operations'), $stock_item['stock']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <a href="<?php echo esc_url($stock_item['edit_url']); ?>" class="button button-small">
                                                <?php esc_html_e('Restock', 'wp-ecomos-operations'); ?>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php endif; ?>
                </section>
            </div>

            <!-- Right Column: Navigation Shortcuts & Operational Tools -->
            <aside aria-label="<?php esc_attr_e('Operational Shortcuts', 'wp-ecomos-operations'); ?>">
                <div class="ecomos-shortcuts">
                    <h2><?php esc_html_e('Merchant Shortcuts', 'wp-ecomos-operations'); ?></h2>
                    <ul class="ecomos-shortcut-links">
                        <li>
                            <a href="<?php echo esc_url(admin_url('admin.php?page=wc-orders')); ?>">
                                <span class="dashicons dashicons-cart"></span>
                                <?php esc_html_e('WooCommerce Orders (HPOS)', 'wp-ecomos-operations'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url(admin_url('edit.php?post_type=product')); ?>">
                                <span class="dashicons dashicons-products"></span>
                                <?php esc_html_e('Product Catalog & Pricing', 'wp-ecomos-operations'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url(admin_url('post-new.php?post_type=product')); ?>">
                                <span class="dashicons dashicons-plus-alt"></span>
                                <?php esc_html_e('Add New Product', 'wp-ecomos-operations'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url(admin_url('edit.php?post_type=shop_coupon')); ?>">
                                <span class="dashicons dashicons-tickets-alt"></span>
                                <?php esc_html_e('Discount Coupons', 'wp-ecomos-operations'); ?>
                            </a>
                        </li>
                        <li>
                            <a href="<?php echo esc_url(admin_url('edit.php?post_type=page')); ?>">
                                <span class="dashicons dashicons-admin-page"></span>
                                <?php esc_html_e('Content Pages & Policy', 'wp-ecomos-operations'); ?>
                            </a>
                        </li>
                        <?php if (current_user_can('manage_options')) : ?>
                            <li>
                                <a href="<?php echo esc_url(admin_url('admin.php?page=wc-settings')); ?>">
                                    <span class="dashicons dashicons-admin-settings"></span>
                                    <?php esc_html_e('Store Configuration (Admin)', 'wp-ecomos-operations'); ?>
                                </a>
                            </li>
                        <?php endif; ?>
                    </ul>
                </div>
            </aside>
        </div>
    </div>
    <?php
}
