<?php
/**
 * EcomOS Addon Lifecycle & Reversible Migrations
 *
 * Manages addon installation, idempotent migrations, safe rollback,
 * missing-addon graceful degradation, and core WooCommerce data preservation.
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Whether a migration statement destroys or rewrites a core WordPress or
/**
 * Prefix-aware core-table migration guard.
 *
 * Prevents addon migrations or rollbacks from executing destructive DDL or DML
 * against WordPress or WooCommerce core tables.
 *
 * Guaranteed boundaries:
 *  - Refuses DROP TABLE, ALTER TABLE, TRUNCATE [TABLE], RENAME TABLE, DELETE FROM
 *    against core WordPress tables (posts, postmeta, options, users, usermeta,
 *    terms, term_taxonomy, term_relationships, comments, commentmeta) and
 *    WooCommerce tables (wc_orders, wc_orders_meta, wc_order_product_lookup,
 *    wc_order_stats, wc_customer_lookup, woocommerce_order_items, woocommerce_order_itemmeta).
 *  - Refuses DROP DATABASE / DROP SCHEMA outright.
 *  - Handles dynamic $wpdb->prefix (e.g. wpt_) with fallback to wp_.
 *  - Catches schema-qualified identifiers (e.g. `other_db`.`wpt_posts`).
 *  - Permits safe addon operations on addon-owned tables (e.g. wp_ecomos_*).
 *
 * @param string $sql
 * @return bool True if statement targets a protected core table or is prohibited DDL
 */
function ecomos_sql_targets_core_table(string $sql): bool {
    global $wpdb;

    // 1. Prohibit database-level drop outright
    if (preg_match('/\bDROP\s+(?:DATABASE|SCHEMA)\b/i', $sql)) {
        return true;
    }

    $prefixes = array('wp_');
    if (isset($wpdb) && is_object($wpdb) && !empty($wpdb->prefix)) {
        $prefixes[] = $wpdb->prefix;
    }

    $core_names = array(
        'posts',
        'postmeta',
        'options',
        'users',
        'usermeta',
        'terms',
        'term_taxonomy',
        'term_relationships',
        'comments',
        'commentmeta',
        'wc_orders',
        'wc_orders_meta',
        'wc_order_product_lookup',
        'wc_order_stats',
        'wc_customer_lookup',
        'woocommerce_order_items',
        'woocommerce_order_itemmeta',
    );

    $tables = array();
    foreach (array_unique($prefixes) as $prefix) {
        foreach ($core_names as $core_table) {
            $tables[] = preg_quote($prefix . $core_table, '/');
        }
    }

    $table_disjunction = '(?:' . implode('|', $tables) . ')';

    // 2. Prohibit DROP / ALTER / TRUNCATE on core tables (schema-qualified tolerated)
    $ddl_pattern = '/\b(?:DROP|ALTER|TRUNCATE)\s+(?:TABLE\s+)?(?:IF\s+EXISTS\s+)?(?:`?[\w$]+`?\s*\.\s*)?`?'
        . $table_disjunction . '`?\b/i';
    if (preg_match($ddl_pattern, $sql)) {
        return true;
    }

    // 3. Prohibit RENAME TABLE where source or target is a core table
    $rename_pattern = '/\bRENAME\s+TABLE\s+(?:(?:`?[\w$]+`?\s*\.\s*)?`?' . $table_disjunction . '`?\s+TO\b|.*?\bTO\s+(?:`?[\w$]+`?\s*\.\s*)?`?' . $table_disjunction . '`?\b)/i';
    if (preg_match($rename_pattern, $sql)) {
        return true;
    }

    // 4. Prohibit DELETE FROM on core tables
    $delete_pattern = '/\bDELETE\s+(?:LOW_PRIORITY\s+|QUICK\s+|IGNORE\s+)?FROM\s+(?:`?[\w$]+`?\s*\.\s*)?`?'
        . $table_disjunction . '`?\b/i';
    if (preg_match($delete_pattern, $sql)) {
        return true;
    }

    return false;
}

/**
 * Retrieve installed addons registry from WordPress options.
 *
 * @return array<string, array>
 */
function ecomos_get_addons_registry(): array {
    $registry = get_option('ecomos_installed_addons', array());
    return is_array($registry) ? $registry : array();
}

/**
 * Persist installed addons registry to WordPress options.
 *
 * @param array $registry
 * @return bool
 */
function ecomos_save_addons_registry(array $registry): bool {
    return update_option('ecomos_installed_addons', $registry, false);
}

/**
 * Installs or registers an addon with the lifecycle manager.
 * Idempotent: repeated installs update the manifest without data loss.
 *
 * @param string $addon_id
 * @param array $manifest
 * @return array
 */
function ecomos_addon_install(string $addon_id, array $manifest): array {
    $registry = ecomos_get_addons_registry();

    $current = $registry[$addon_id] ?? array(
        'id'               => $addon_id,
        'version'          => '0.0.0',
        'status'           => 'installed',
        'applied_migrations' => array(),
        'installed_at'     => current_time('mysql'),
        'updated_at'       => current_time('mysql'),
    );

    $current['name'] = $manifest['name'] ?? $addon_id;
    $current['target_version'] = $manifest['version'] ?? '1.0.0';
    $current['manifest'] = $manifest;
    $current['updated_at'] = current_time('mysql');

    $registry[$addon_id] = $current;
    ecomos_save_addons_registry($registry);

    return array(
        'success' => true,
        'addon'   => $current,
    );
}

/**
 * Applies pending migrations up to target version.
 * Idempotent: previously applied migration versions are skipped.
 *
 * @param string $addon_id
 * @param array $migrations List of migrations with ['version', 'up', 'down']
 * @return array
 */
function ecomos_addon_migrate_up(string $addon_id, array $migrations): array {
    global $wpdb;
    $registry = ecomos_get_addons_registry();
    if (!isset($registry[$addon_id])) {
        return array('success' => false, 'error' => "Addon {$addon_id} not installed");
    }

    $applied = $registry[$addon_id]['applied_migrations'] ?? array();
    $executed = array();

    foreach ($migrations as $m) {
        $version = $m['version'] ?? '';
        if (in_array($version, $applied, true)) {
            continue; // Already applied, skip idempotently
        }

        $up_sql = trim($m['up'] ?? '');
        if ($up_sql) {
            // Safety invariant: never allow DROP/ALTER/TRUNCATE on core tables.
            if (ecomos_sql_targets_core_table($up_sql)) {
                return array(
                    'success' => false,
                    'error'   => "Prohibited SQL operation targeting core WooCommerce tables in migration {$version}",
                );
            }

            if (isset($wpdb) && method_exists($wpdb, 'query')) {
                $wpdb->query($up_sql);
            }
        }

        $applied[] = $version;
        $executed[] = $version;
    }

    $registry[$addon_id]['applied_migrations'] = $applied;
    $registry[$addon_id]['version'] = end($applied) ?: $registry[$addon_id]['version'];
    $registry[$addon_id]['updated_at'] = current_time('mysql');
    ecomos_save_addons_registry($registry);

    return array(
        'success'  => true,
        'executed' => $executed,
        'current_version' => $registry[$addon_id]['version'],
    );
}

/**
 * Rolls back applied migrations down to a specified target version.
 *
 * @param string $addon_id
 * @param array $migrations List of migrations with ['version', 'up', 'down']
 * @param string $rollback_to Target version to stop at
 * @return array
 */
function ecomos_addon_rollback_down(string $addon_id, array $migrations, string $rollback_to = '0.0.0'): array {
    global $wpdb;
    $registry = ecomos_get_addons_registry();
    if (!isset($registry[$addon_id])) {
        return array('success' => false, 'error' => "Addon {$addon_id} not installed");
    }

    $applied = $registry[$addon_id]['applied_migrations'] ?? array();
    $rolled_back = array();

    // Reverse order for rollback
    $reversed = array_reverse($migrations);
    foreach ($reversed as $m) {
        $version = $m['version'] ?? '';
        if (!in_array($version, $applied, true)) {
            continue; // Not applied, nothing to roll back
        }

        if (version_compare($version, $rollback_to, '<=')) {
            continue; // At or below target version, stop rollback
        }

        $down_sql = trim($m['down'] ?? '');
        if ($down_sql) {
            if (ecomos_sql_targets_core_table($down_sql)) {
                return array(
                    'success' => false,
                    'error'   => "Prohibited SQL operation targeting core WooCommerce tables in down migration {$version}",
                );
            }

            if (isset($wpdb) && method_exists($wpdb, 'query')) {
                $wpdb->query($down_sql);
            }
        }

        $applied = array_diff($applied, array($version));
        $rolled_back[] = $version;
    }

    $registry[$addon_id]['applied_migrations'] = array_values($applied);
    $registry[$addon_id]['version'] = end($applied) ?: '0.0.0';
    $registry[$addon_id]['updated_at'] = current_time('mysql');
    ecomos_save_addons_registry($registry);

    return array(
        'success'     => true,
        'rolled_back' => $rolled_back,
        'current_version' => $registry[$addon_id]['version'],
    );
}

/**
 * Deactivates an addon.
 * Data retention policy: preserves tables and records unless explicit purge is requested.
 * Core WooCommerce data is guaranteed 100% untouched.
 *
 * @param string $addon_id
 * @param bool $retain_data Whether to preserve addon database tables (default: true)
 * @return array
 */
function ecomos_addon_deactivate(string $addon_id, bool $retain_data = true): array {
    $registry = ecomos_get_addons_registry();
    if (!isset($registry[$addon_id])) {
        return array('success' => false, 'error' => "Addon {$addon_id} not found");
    }

    $registry[$addon_id]['status'] = 'disabled';
    $registry[$addon_id]['retained_data'] = $retain_data;
    $registry[$addon_id]['updated_at'] = current_time('mysql');

    // Remove from active addons list
    $active = (array) get_option('ecomos_active_addons', array());
    $active = array_values(array_diff($active, array($addon_id)));
    update_option('ecomos_active_addons', $active, false);
    update_option("ecomos_addon_{$addon_id}_enabled", 'no', false);

    ecomos_save_addons_registry($registry);

    return array(
        'success'      => true,
        'status'       => 'disabled',
        'data_retained'=> $retain_data,
    );
}

/**
 * Detects missing addon modules on disk and performs graceful degradation.
 *
 * @param array $registered_addons Map of addon_id => expected plugin directory path
 * @return array List of missing addons handled
 */
function ecomos_addon_verify_integrity(array $registered_addons): array {
    $missing = array();
    $active = (array) get_option('ecomos_active_addons', array());

    foreach ($registered_addons as $addon_id => $plugin_path) {
        if (!file_exists($plugin_path)) {
            $missing[] = $addon_id;
            // Deactivate gracefully to prevent PHP fatal errors
            if (in_array($addon_id, $active, true)) {
                ecomos_addon_deactivate($addon_id, true);
            }
        }
    }

    return $missing;
}
