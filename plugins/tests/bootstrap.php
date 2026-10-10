<?php
/**
 * PHP Test Bootstrap for EcomOS Backend Compatibility Testing.
 */

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/../../');
}

if (!defined('WC_VERSION')) {
    define('WC_VERSION', '9.3.0');
}

if (!defined('WP_VERSION')) {
    define('WP_VERSION', '6.7.0');
}

namespace Automattic\WooCommerce\Utilities {
    class FeaturesUtil {
        private static array $compatibilities = [];

        public static function declare_compatibility(string $feature_id, string $plugin_file, bool $positive = true): void {
            self::$compatibilities[$feature_id][$plugin_file] = $positive;
        }

        public static function has_compatibility(string $feature_id, string $plugin_file): bool {
            return self::$compatibilities[$feature_id][$plugin_file] ?? false;
        }

        public static function reset(): void {
            self::$compatibilities = [];
        }
    }
}
