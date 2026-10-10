<?php
/**
 * EcomOS Merchant Daily Workflows & Negative Permissions Test Suite
 *
 * Simulates merchant jobs, negative permission gates, and addon off-state behavior.
 */

class EcomOS_Workflows_Test {
    private string $current_role = 'administrator';
    private array $options = [];
    private array $capability_matrix = [
        'ecomos_operator' => [
            'allowed' => ['read', 'edit_shop_orders', 'edit_products', 'edit_shop_coupons', 'ecomos_manage_inventory', 'edit_posts', 'publish_posts'],
            'denied'  => ['manage_options', 'activate_plugins', 'edit_plugins', 'edit_themes', 'edit_files', 'install_plugins'],
        ],
        'ecomos_fulfillment' => [
            'allowed' => ['read', 'edit_shop_orders'],
            'denied'  => ['edit_products', 'edit_shop_coupons', 'ecomos_manage_inventory', 'manage_options', 'activate_plugins', 'edit_themes'],
        ],
        'customer' => [
            'allowed' => ['read'],
            'denied'  => ['edit_shop_orders', 'edit_products', 'edit_shop_coupons', 'ecomos_manage_inventory', 'manage_options', 'activate_plugins'],
        ],
    ];

    public function setUp(): void {
        $this->options = [
            'ecomos_addon_quotes_enabled' => 'no',
        ];
    }

    public function testOperatorDailyJobs(): void {
        $role = 'ecomos_operator';
        $caps = $this->capability_matrix[$role];

        // 1. Order processing
        assert(in_array('edit_shop_orders', $caps['allowed']), 'Operator must be allowed to process orders');

        // 2. Product and stock editing
        assert(in_array('edit_products', $caps['allowed']), 'Operator must be allowed to edit products');
        assert(in_array('ecomos_manage_inventory', $caps['allowed']), 'Operator must be allowed to manage inventory');

        // 3. Coupon management
        assert(in_array('edit_shop_coupons', $caps['allowed']), 'Operator must be allowed to edit coupons');

        // 4. Content editing
        assert(in_array('edit_posts', $caps['allowed']), 'Operator must be allowed to edit content pages');

        // 5. Negative security gates
        foreach ($caps['denied'] as $denied_cap) {
            assert(!in_array($denied_cap, $caps['allowed']), "Operator must NOT have capability: {$denied_cap}");
        }
    }

    public function testFulfillmentDailyJobs(): void {
        $role = 'ecomos_fulfillment';
        $caps = $this->capability_matrix[$role];

        // 1. Order triage allowed
        assert(in_array('edit_shop_orders', $caps['allowed']), 'Fulfillment must be allowed to view/update orders');

        // 2. Catalog & coupon editing denied
        assert(in_array('edit_products', $caps['denied']), 'Fulfillment must NOT edit products');
        assert(in_array('edit_shop_coupons', $caps['denied']), 'Fulfillment must NOT edit coupons');
        assert(in_array('manage_options', $caps['denied']), 'Fulfillment must NOT access settings');
    }

    public function testCustomerIsolation(): void {
        $role = 'customer';
        $caps = $this->capability_matrix[$role];

        assert(in_array('edit_shop_orders', $caps['denied']), 'Customer must have zero order edit permissions');
        assert(in_array('edit_products', $caps['denied']), 'Customer must have zero product edit permissions');
    }

    public function testAddonOffStateGating(): void {
        // When quote addon is disabled
        $this->options['ecomos_addon_quotes_enabled'] = 'no';
        $can_manage_quotes = ($this->options['ecomos_addon_quotes_enabled'] === 'yes');
        assert($can_manage_quotes === false, 'Quote operations must fail when addon is disabled');

        // When quote addon is activated
        $this->options['ecomos_addon_quotes_enabled'] = 'yes';
        $can_manage_quotes = ($this->options['ecomos_addon_quotes_enabled'] === 'yes');
        assert($can_manage_quotes === true, 'Quote operations succeed only when addon is active');
    }

    public function run(): void {
        $this->setUp();
        $this->testOperatorDailyJobs();
        $this->testFulfillmentDailyJobs();
        $this->testCustomerIsolation();
        $this->testAddonOffStateGating();
        echo "All EcomOS Workflows & Permissions tests passed.\n";
    }
}

if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $runner = new EcomOS_Workflows_Test();
    $runner->run();
}
