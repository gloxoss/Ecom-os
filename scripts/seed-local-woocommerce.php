<?php
// Run with Local's WP-CLI eval-file, never as a web endpoint.
if (!defined('WP_CLI') || !WP_CLI || wp_get_environment_type() !== 'local'
    || wp_parse_url(home_url(), PHP_URL_HOST) !== 'paraloca.local') {
    throw new RuntimeException('Fixtures are restricted to the approved paraloca.local installation.');
}
if (!class_exists('WooCommerce')) {
    throw new RuntimeException('Activate WooCommerce first.');
}

$version = 1;
$manifest = get_option('ecomos_local_fixture_manifest');
if (!$manifest) {
    if ((int) wp_count_posts('product')->publish !== 0) {
        throw new RuntimeException('Refusing to change settings on a non-empty store.');
    }
    // These settings describe a synthetic test case, not merchant shipping or tax policy.
    update_option('woocommerce_currency', 'MAD');
    update_option('woocommerce_default_country', 'MA');
    update_option('woocommerce_enable_guest_checkout', 'yes');
    update_option('woocommerce_enable_signup_and_login_from_checkout', 'no');
    update_option('woocommerce_calc_taxes', 'yes');
    update_option('woocommerce_prices_include_tax', 'no');
    update_option('woocommerce_tax_based_on', 'shipping');
    update_option('woocommerce_shipping_tax_class', 'inherit');

    $taxClass = WC_Tax::create_tax_class('EcomOS fixture tax', 'ecomos-fixture');
    if (is_wp_error($taxClass)) {
        throw new RuntimeException('Unable to create the synthetic tax class.');
    }
    $taxId = WC_Tax::_insert_tax_rate(array(
        'tax_rate_country' => 'MA', 'tax_rate_state' => '', 'tax_rate' => '10.0000',
        'tax_rate_name' => 'EcomOS SYNTHETIC 10%', 'tax_rate_priority' => 1,
        'tax_rate_compound' => 0, 'tax_rate_shipping' => 1, 'tax_rate_class' => 'ecomos-fixture',
    ));

    $category = wp_insert_term('EcomOS test fixtures', 'product_cat', array('slug' => 'ecomos-test-fixtures'));
    if (is_wp_error($category)) {
        throw new RuntimeException('Unable to create fixture category.');
    }
    $categoryId = (int) $category['term_id'];
    $simple = new WC_Product_Simple();
    $simple->set_name('EcomOS TEST simple item');
    $simple->set_slug('ecomos-test-simple');
    $simple->set_sku('ECOMOS-TEST-SIMPLE');
    $simple->set_status('publish');
    $simple->set_description('Synthetic local integration fixture. Not a merchant product.');
    $simple->set_regular_price('39.95');
    $simple->set_manage_stock(true);
    $simple->set_stock_quantity(20);
    $simple->set_tax_class('ecomos-fixture');
    $simple->set_category_ids(array($categoryId));
    $simple->update_meta_data('_ecomos_local_fixture', $version);
    $simpleId = $simple->save();

    $parent = new WC_Product_Variable();
    $parent->set_name('EcomOS TEST variable item');
    $parent->set_slug('ecomos-test-variable');
    $parent->set_sku('ECOMOS-TEST-VARIABLE');
    $parent->set_status('publish');
    $parent->set_description('Synthetic local integration fixture with an exact variation.');
    $parent->set_tax_class('ecomos-fixture');
    $parent->set_category_ids(array($categoryId));
    $attribute = new WC_Product_Attribute();
    $attribute->set_name('Size');
    $attribute->set_options(array('Standard'));
    $attribute->set_visible(true);
    $attribute->set_variation(true);
    $parent->set_attributes(array($attribute));
    $parent->update_meta_data('_ecomos_local_fixture', $version);
    $parentId = $parent->save();
    $variation = new WC_Product_Variation();
    $variation->set_parent_id($parentId);
    $variation->set_attributes(array('size' => 'Standard'));
    $variation->set_sku('ECOMOS-TEST-VARIATION-STANDARD');
    $variation->set_status('publish');
    $variation->set_regular_price('79.50');
    $variation->set_manage_stock(true);
    $variation->set_stock_quantity(20);
    $variation->set_tax_class('parent');
    $variation->update_meta_data('_ecomos_local_fixture', $version);
    $variationId = $variation->save();
    WC_Product_Variable::sync($parentId);

    $zone = new WC_Shipping_Zone();
    $zone->set_zone_name('EcomOS TEST Morocco');
    $zone->set_zone_order(0);
    $zone->add_location('MA', 'country');
    $zoneId = $zone->save();
    $shippingId = $zone->add_shipping_method('flat_rate');
    update_option('woocommerce_flat_rate_' . $shippingId . '_settings', array(
        'title' => 'EcomOS TEST delivery', 'tax_status' => 'taxable', 'cost' => '25.00',
    ));
    update_option('woocommerce_cod_settings', array(
        'enabled' => 'yes', 'title' => 'EcomOS TEST cash on delivery',
        'description' => 'Local synthetic checkout only.', 'instructions' => '',
        'enable_for_methods' => array(), 'enable_for_virtual' => 'no',
    ));
    $states = WC()->countries->get_states('MA');
    $state = array_key_exists('CAS', $states) ? 'CAS' : array_key_first($states);
    $manifest = array(
        'version' => $version, 'simpleId' => $simpleId, 'variableId' => $parentId,
        'variationId' => $variationId, 'categoryId' => $categoryId,
        'shippingZoneId' => $zoneId, 'shippingRateId' => 'flat_rate:' . $shippingId,
        'taxRateId' => $taxId, 'state' => $state,
    );
    update_option('ecomos_local_fixture_manifest', $manifest, false);
}
if ($manifest['version'] !== $version) {
    throw new RuntimeException('Unsupported existing fixture version.');
}

// Keep privileged REST access server-only and read-only, with no administrator role.
if (!empty($args[0])) {
    $envPath = realpath($args[0]);
    if (!$envPath || basename($envPath) !== '.env.local' || basename(dirname($envPath)) !== 'storefront') {
        throw new RuntimeException('Expected an existing storefront .env.local file.');
    }
    $envText = file_get_contents($envPath);
    $updates = array(
        'ECOM_ENGINE' => 'woocommerce', 'WC_REST_URL' => set_url_scheme(home_url('/wp-json/wc/v3'), 'https'),
        'WC_GRAPHQL_URL' => set_url_scheme(home_url('/graphql'), 'https'),
    );
    if (!preg_match('/^WC_REST_KEY=.+$/m', $envText)) {
        add_role('ecomos_local_reader', 'EcomOS local read-only connector', array('read' => true, 'manage_woocommerce' => true));
        $user = get_user_by('login', 'ecomos-local-reader');
        if ($user && $user->roles !== array('ecomos_local_reader')) {
            throw new RuntimeException('Existing connector user has unexpected permissions.');
        }
        $userId = $user ? $user->ID : wp_insert_user(array(
            'user_login' => 'ecomos-local-reader', 'user_pass' => wp_generate_password(64, true, true),
            'user_email' => 'ecomos-connector@example.test', 'role' => 'ecomos_local_reader',
        ));
        if (is_wp_error($userId)) throw new RuntimeException('Connector user creation failed.');
        $key = 'ck_' . bin2hex(random_bytes(20));
        $secret = 'cs_' . bin2hex(random_bytes(20));
        global $wpdb;
        $inserted = $wpdb->insert($wpdb->prefix . 'woocommerce_api_keys', array(
            'user_id' => $userId, 'description' => 'EcomOS local read-only connector',
            'permissions' => 'read', 'consumer_key' => wc_api_hash($key),
            'consumer_secret' => $secret, 'truncated_key' => substr($key, -7),
        ));
        if (!$inserted) throw new RuntimeException('Read-only API key creation failed.');
        $updates['WC_REST_KEY'] = $key;
        $updates['WC_REST_SECRET'] = $secret;
    }
    foreach (array('REVALIDATE_SECRET', 'SESSION_COOKIE_SECRET') as $name) {
        if (!preg_match('/^' . $name . '=.+$/m', $envText)) $updates[$name] = bin2hex(random_bytes(32));
    }
    foreach ($updates as $name => $value) {
        $pattern = '/^' . preg_quote($name, '/') . '=.*$/m';
        $line = $name . '=' . $value;
        $envText = preg_match($pattern, $envText)
            ? preg_replace_callback($pattern, function () use ($line) { return $line; }, $envText)
            : rtrim($envText) . PHP_EOL . $line . PHP_EOL;
    }
    if (file_put_contents($envPath, $envText, LOCK_EX) === false) throw new RuntimeException('Local environment write failed.');
    $manifest['connectorConfigured'] = true;
}
WP_CLI::line(wp_json_encode($manifest));
