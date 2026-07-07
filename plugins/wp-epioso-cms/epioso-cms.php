<?php
/**
 * Plugin Name: Epioso CMS Bridge
 * Description: Exposes ACF and Gutenberg block schemas for the Ecom-os CLI to consume.
 * Version: 1.0.0
 * Author: Epioso
 */

if (!defined('ABSPATH')) {
    exit;
}

class Epioso_CMS_Bridge {
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes() {
        register_rest_route('epioso/v1', '/schema', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_schema'],
            'permission_callback' => '__return_true', // In production, add auth!
        ]);
    }

    public function get_schema(WP_REST_Request $request) {
        $blocks = [];
        $acf_groups = [];

        // 1. Fetch Gutenberg Blocks
        if (function_exists('WP_Block_Type_Registry')) {
            $registry = WP_Block_Type_Registry::get_instance();
            foreach ($registry->get_all_registered() as $name => $block) {
                if (strpos($name, 'epioso/') === 0) {
                    $blocks[] = [
                        'name' => $name,
                        'attributes' => $block->attributes ?? [],
                    ];
                }
            }
        }

        // 2. Fetch ACF Field Groups
        if (function_exists('acf_get_field_groups')) {
            $groups = acf_get_field_groups();
            foreach ($groups as $group) {
                $fields = acf_get_fields($group['key']);
                $acf_groups[] = [
                    'name' => $group['title'],
                    'fields' => array_map(function($f) {
                        return [
                            'name' => $f['name'],
                            'type' => $f['type'],
                        ];
                    }, $fields ? $fields : [])
                ];
            }
        }

        return rest_ensure_response([
            'blocks' => $blocks,
            'acf' => $acf_groups
        ]);
    }
}

new Epioso_CMS_Bridge();
