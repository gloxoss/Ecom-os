<?php
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local'
    || wp_parse_url(home_url(), PHP_URL_HOST) !== 'paraloca.local') {
    throw new RuntimeException('Order verification is restricted to the approved local site.');
}
$order = wc_get_order((int) ($args[0] ?? 0));
if (!$order || strpos($order->get_customer_note(), 'ECOMOS-SMOKE-') !== 0
    || !str_ends_with($order->get_billing_email(), '@example.test')) {
    throw new RuntimeException('Expected an EcomOS synthetic test order.');
}
$manifest = get_option('ecomos_local_fixture_manifest');
$lines = array();
foreach ($order->get_items() as $item) {
    $lines[] = array(
        'productId' => $item->get_product_id(), 'variationId' => $item->get_variation_id(),
        'quantity' => $item->get_quantity(), 'total' => wc_format_decimal($item->get_total(), 2),
    );
}
$matchingIds = wc_get_orders(array(
    'limit' => -1, 'return' => 'ids', 'billing_email' => $order->get_billing_email(),
    'status' => array_keys(wc_get_order_statuses()),
));
$simpleVerified = false;
$variationVerified = false;
foreach ($lines as $line) {
    if ($line['productId'] === $manifest['simpleId'] && $line['variationId'] === 0
        && $line['quantity'] === 2 && $line['total'] === '79.90') $simpleVerified = true;
    if ($line['productId'] === $manifest['variableId'] && $line['variationId'] === $manifest['variationId']
        && $line['quantity'] === 1 && $line['total'] === '79.50') $variationVerified = true;
}
if ($order->get_customer_id() !== 0 || !$simpleVerified || !$variationVerified || count($lines) !== 2
    || $order->get_currency() !== 'MAD' || wc_format_decimal($order->get_total(), 2) !== '202.84'
    || wc_format_decimal($order->get_shipping_total(), 2) !== '25.00' || wc_format_decimal($order->get_total_tax(), 2) !== '18.44'
    || $order->get_payment_method() !== 'cod' || $order->get_status() !== 'processing'
    || count($matchingIds) !== 1) {
    WP_CLI::error('Saved-order checks failed: ' . wp_json_encode(array(
        'guest' => $order->get_customer_id() === 0, 'simple' => $simpleVerified, 'variation' => $variationVerified,
        'lineCount' => count($lines), 'total' => $order->get_total(), 'shipping' => $order->get_shipping_total(),
        'tax' => $order->get_total_tax(), 'currency' => $order->get_currency(),
        'status' => $order->get_status(), 'matchingOrderCount' => count($matchingIds),
    )));
}
WP_CLI::line(wp_json_encode(array(
    'orderId' => $order->get_id(), 'status' => $order->get_status(), 'customerId' => $order->get_customer_id(),
    'currency' => $order->get_currency(), 'total' => wc_format_decimal($order->get_total(), 2),
    'shipping' => wc_format_decimal($order->get_shipping_total(), 2), 'tax' => wc_format_decimal($order->get_total_tax(), 2),
    'paymentMethod' => $order->get_payment_method(), 'lines' => $lines,
    'ordersForThisRun' => count($matchingIds), 'crudVerification' => 'PASS',
)));
