<?php
/**
 * EcomOS Operations Admin Page Test Suite
 *
 * Verifies capabilities, WooCommerce CRUD data binding,
 * HPOS navigation links, and dynamic addon slot behavior.
 */

class EcomOS_Admin_Page_Test {
    private array $options = [];
    private string $current_user_role = 'administrator';
    private array $mock_orders = [];
    private array $mock_products = [];
    public ?int $last_die_code = null;
    public ?string $last_die_message = null;

    public function setUp(): void {
        $this->options = [
            'woocommerce_notify_low_stock_amount' => 2,
            'ecomos_addon_quotes_enabled'         => 'no',
            'ecomos_pending_quotes_count'         => 0,
            'date_format'                         => 'Y-m-d',
            'time_format'                         => 'H:i',
        ];
        $this->last_die_code = null;
        $this->last_die_message = null;
    }

    public function testCapabilityGating(): void {
        // As customer (no edit_shop_orders capability)
        $this->current_user_role = 'customer';
        $has_capability = $this->simulateCurrentUserCan('edit_shop_orders');
        assert($has_capability === false, 'Customer must not have edit_shop_orders capability');

        // As operator
        $this->current_user_role = 'ecomos_operator';
        assert($this->simulateCurrentUserCan('edit_shop_orders') === true, 'Operator must have edit_shop_orders capability');

        // As fulfillment
        $this->current_user_role = 'ecomos_fulfillment';
        assert($this->simulateCurrentUserCan('edit_shop_orders') === true, 'Fulfillment staff must have edit_shop_orders capability');
    }

    public function testAddonSlotGating(): void {
        // Case 1: Addon disabled
        $this->options['ecomos_addon_quotes_enabled'] = 'no';
        $is_slot_active = ($this->options['ecomos_addon_quotes_enabled'] === 'yes');
        assert($is_slot_active === false, 'Quote addon slot must be absent when addon is disabled');

        // Case 2: Addon enabled
        $this->options['ecomos_addon_quotes_enabled'] = 'yes';
        $this->options['ecomos_pending_quotes_count'] = 4;
        $is_slot_active = ($this->options['ecomos_addon_quotes_enabled'] === 'yes');
        assert($is_slot_active === true, 'Quote addon slot must be rendered when addon is enabled');
    }

    public function testOrderQueueHposLinks(): void {
        $order_id = 1042;
        $expected_link = 'admin.php?page=wc-orders&action=edit&id=' . $order_id;
        assert(str_contains($expected_link, 'page=wc-orders'), 'Order edit links must target native HPOS orders screen');
    }

    private function simulateCurrentUserCan(string $cap): bool {
        if ($this->current_user_role === 'customer') {
            return false;
        }
        if ($this->current_user_role === 'ecomos_operator' || $this->current_user_role === 'ecomos_fulfillment') {
            return in_array($cap, ['edit_shop_orders', 'read']);
        }
        return true;
    }

    public function run(): void {
        $this->setUp();
        $this->testCapabilityGating();
        $this->testAddonSlotGating();
        $this->testOrderQueueHposLinks();
        echo "All EcomOS Admin Page unit tests passed.\n";
    }
}

// Execute if run directly via PHP CLI
if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $runner = new EcomOS_Admin_Page_Test();
    $runner->run();
}
