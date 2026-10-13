<?php
// Synthetic integration fixtures for any LOCAL EcomOS instance site.
// Run only through WP-CLI: wp eval-file scripts/seed-instance-fixtures.php
// Never a web endpoint. Refuses non-local environments and non-.local hosts.
// Creates test products (clearly marked synthetic), a Morocco delivery zone and
// cash on delivery. It does NOT touch tax settings: tax policy is a merchant decision.
// Remove the fixtures before real content: wp eval-file scripts/seed-instance-fixtures.php remove
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local') {
    throw new RuntimeException('Fixtures run only through WP-CLI on a local environment.');
}
$host = (string) wp_parse_url(home_url(), PHP_URL_HOST);
if (substr($host, -6) !== '.local') {
    throw new RuntimeException('Fixtures are restricted to *.local sites, got: ' . $host);
}
if (!class_exists('WooCommerce')) {
    throw new RuntimeException('Activate WooCommerce first.');
}

$version = 2;
$mode = isset($args[0]) ? $args[0] : 'seed';
$manifest = get_option('ecomos_instance_fixture_manifest');

if ($mode === 'remove') {
    if (!$manifest) { WP_CLI::line('No fixtures recorded.'); return; }
    foreach (array_filter(array($manifest['variationId'], $manifest['variableId'], $manifest['simpleId'], isset($manifest['bedId']) ? $manifest['bedId'] : 0)) as $id) {
        wp_delete_post((int) $id, true);
    }
    if (!empty($manifest['categoryId'])) wp_delete_term((int) $manifest['categoryId'], 'product_cat');
    if (!empty($manifest['shippingZoneId'])) { $zone = new WC_Shipping_Zone((int) $manifest['shippingZoneId']); $zone->delete(); }
    delete_option('ecomos_instance_fixture_manifest');
    WP_CLI::success('Fixtures removed.');
    return;
}

if (!$manifest) {
    if ((int) wp_count_posts('product')->publish !== 0) {
        throw new RuntimeException('Refusing to seed a non-empty catalog.');
    }
    update_option('woocommerce_currency', 'MAD');
    update_option('woocommerce_default_country', 'MA');
    update_option('woocommerce_enable_guest_checkout', 'yes');
    update_option('woocommerce_enable_signup_and_login_from_checkout', 'no');

    $category = wp_insert_term('EcomOS test fixtures', 'product_cat', array('slug' => 'ecomos-test-fixtures'));
    if (is_wp_error($category)) throw new RuntimeException('Unable to create fixture category.');
    $categoryId = (int) $category['term_id'];

    $simple = new WC_Product_Simple();
    $simple->set_name('EcomOS TEST simple item');
    $simple->set_slug('ecomos-test-simple');
    $simple->set_sku('ECOMOS-TEST-SIMPLE');
    $simple->set_status('publish');
    $simple->set_description('Synthetic integration fixture. Not a merchant product.');
    $simple->set_regular_price('39.95');
    $simple->set_manage_stock(true);
    $simple->set_stock_quantity(20);
    $simple->set_category_ids(array($categoryId));
    $simple->update_meta_data('_ecomos_instance_fixture', $version);
    $simpleId = $simple->save();

    $parent = new WC_Product_Variable();
    $parent->set_name('EcomOS TEST variable item');
    $parent->set_slug('ecomos-test-variable');
    $parent->set_sku('ECOMOS-TEST-VARIABLE');
    $parent->set_status('publish');
    $parent->set_description('Synthetic integration fixture with an exact variation.');
    $parent->set_category_ids(array($categoryId));
    $attribute = new WC_Product_Attribute();
    $attribute->set_name('Size');
    $attribute->set_options(array('Standard'));
    $attribute->set_visible(true);
    $attribute->set_variation(true);
    $parent->set_attributes(array($attribute));
    $parent->update_meta_data('_ecomos_instance_fixture', $version);
    $parentId = $parent->save();

    $variation = new WC_Product_Variation();
    $variation->set_parent_id($parentId);
    $variation->set_attributes(array('size' => 'Standard'));
    $variation->set_sku('ECOMOS-TEST-VARIATION-STANDARD');
    $variation->set_status('publish');
    $variation->set_regular_price('79.50');
    $variation->set_manage_stock(true);
    $variation->set_stock_quantity(20);
    $variation->update_meta_data('_ecomos_instance_fixture', $version);
    $variationId = $variation->save();
    WC_Product_Variable::sync($parentId);

    $zone = new WC_Shipping_Zone();
    $zone->set_zone_name('EcomOS TEST Morocco');
    $zone->set_zone_order(0);
    $zone->add_location('MA', 'country');
    $zoneId = $zone->save();
    $shippingId = $zone->add_shipping_method('flat_rate');
    update_option('woocommerce_flat_rate_' . $shippingId . '_settings', array(
        'title' => 'EcomOS TEST delivery', 'tax_status' => 'none', 'cost' => '25.00',
    ));
    update_option('woocommerce_cod_settings', array(
        'enabled' => 'yes', 'title' => 'Cash on delivery', 'description' => 'Pay in cash on delivery.',
        'instructions' => '', 'enable_for_methods' => array(), 'enable_for_virtual' => 'no',
    ));

    $manifest = array(
        'version' => $version, 'simpleId' => $simpleId, 'variableId' => $parentId,
        'variationId' => $variationId, 'categoryId' => $categoryId,
        'shippingZoneId' => $zoneId, 'shippingRateId' => 'flat_rate:' . $shippingId,
    );
    update_option('ecomos_instance_fixture_manifest', $manifest, false);
}
if ((int) $manifest['version'] !== $version) {
    throw new RuntimeException('Unsupported existing fixture version.');
}

// Third product so quote (RFQ) journeys can build a basket of three distinct items.
if (empty($manifest['bedId']) && !wc_get_product_id_by_sku('ECOMOS-TEST-BED')) {
    $bed = new WC_Product_Simple();
    $bed->set_name('EcomOS TEST medical bed');
    $bed->set_slug('ecomos-test-bed');
    $bed->set_sku('ECOMOS-TEST-BED');
    $bed->set_status('publish');
    $bed->set_description('Synthetic quote fixture. Not a merchant product.');
    $bed->set_regular_price('850.00');
    $bed->set_manage_stock(true);
    $bed->set_stock_quantity(5);
    $bed->set_category_ids(array((int) $manifest['categoryId']));
    $bed->update_meta_data('_ecomos_instance_fixture', $version);
    $manifest['bedId'] = $bed->save();
    update_option('ecomos_instance_fixture_manifest', $manifest, false);
}
WP_CLI::line(wp_json_encode($manifest));
