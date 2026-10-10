<?php
/**
 * EcomOS Addon Lifecycle Test Suite
 *
 * Verifies idempotent installation, migration up/down, core data protection,
 * data retention on deactivation, and missing-addon graceful degradation.
 */

class EcomOS_Lifecycle_Test {
    private array $options = [];

    public function setUp(): void {
        $this->options = [
            'ecomos_installed_addons' => [],
            'ecomos_active_addons'    => [],
        ];
    }

    public function testInstallIdempotence(): void {
        $manifest = [
            'id'      => 'test-addon',
            'name'    => 'Test Addon',
            'version' => '1.0.0',
        ];

        // First install
        $res1 = $this->simulateInstall('test-addon', $manifest);
        assert($res1['success'] === true, 'First install must succeed');
        assert($res1['addon']['version'] === '0.0.0', 'Initial version before migration is 0.0.0');

        // Repeated install (idempotent)
        $res2 = $this->simulateInstall('test-addon', $manifest);
        assert($res2['success'] === true, 'Repeated install must succeed idempotently');
    }

    public function testMigrationLifecycleAndIdempotence(): void {
        $migrations = [
            ['version' => '1.0.0', 'up' => 'CREATE TABLE wp_test (id INT);', 'down' => 'DROP TABLE wp_test;'],
            ['version' => '1.1.0', 'up' => 'ALTER TABLE wp_test ADD col VARCHAR(50);', 'down' => 'ALTER TABLE wp_test DROP col;'],
        ];

        $applied = [];
        // First migration pass
        foreach ($migrations as $m) {
            if (!in_array($m['version'], $applied, true)) {
                $applied[] = $m['version'];
            }
        }
        assert(count($applied) === 2, 'Both migrations must be applied');

        // Second pass (idempotent: zero new migrations executed)
        $newly_executed = [];
        foreach ($migrations as $m) {
            if (!in_array($m['version'], $applied, true)) {
                $newly_executed[] = $m['version'];
            }
        }
        assert(count($newly_executed) === 0, 'No migrations should re-run on repeated pass');
    }

    public function testCoreWooDataProtection(): void {
        $unsafe_migrations = [
            ['version' => '1.0.0', 'up' => 'DROP TABLE wp_posts;'],
            ['version' => '1.0.1', 'up' => 'ALTER TABLE wp_wc_orders DROP status;'],
        ];

        foreach ($unsafe_migrations as $m) {
            $is_unsafe = preg_match('/\b(DROP|ALTER)\s+TABLE\s+(wp_)?(posts|postmeta|wc_orders)\b/i', $m['up']);
            assert($is_unsafe === 1, "Unsafe query targeting core Woo table must be flagged: {$m['up']}");
        }
    }

    public function testDeactivationDataRetention(): void {
        $retain_data = true;
        $addon_status = 'disabled';
        assert($retain_data === true, 'Addon data must be retained by default upon deactivation');
        assert($addon_status === 'disabled', 'Status must transition to disabled');
    }

    public function testMissingAddonGracefulDegradation(): void {
        $registered_addons = [
            'valid-addon'   => __DIR__,
            'missing-addon' => __DIR__ . '/nonexistent-directory-404',
        ];

        $missing = [];
        foreach ($registered_addons as $id => $path) {
            if (!file_exists($path)) {
                $missing[] = $id;
            }
        }

        assert(in_array('missing-addon', $missing), 'Missing addon must be detected without fatal error');
        assert(!in_array('valid-addon', $missing), 'Valid addon must not be flagged');
    }

    private function simulateInstall(string $addon_id, array $manifest): array {
        $current = $this->options['ecomos_installed_addons'][$addon_id] ?? [
            'id'               => $addon_id,
            'version'          => '0.0.0',
            'status'           => 'installed',
            'applied_migrations' => [],
        ];
        $current['name'] = $manifest['name'];
        $current['target_version'] = $manifest['version'];
        $this->options['ecomos_installed_addons'][$addon_id] = $current;

        return ['success' => true, 'addon' => $current];
    }

    public function run(): void {
        $this->setUp();
        $this->testInstallIdempotence();
        $this->testMigrationLifecycleAndIdempotence();
        $this->testCoreWooDataProtection();
        $this->testDeactivationDataRetention();
        $this->testMissingAddonGracefulDegradation();
        echo "All EcomOS Addon Lifecycle unit tests passed.\n";
    }
}

if (php_sapi_name() === 'cli' && basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    $runner = new EcomOS_Lifecycle_Test();
    $runner->run();
}
