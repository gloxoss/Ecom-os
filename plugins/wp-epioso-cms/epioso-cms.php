<?php
/**
 * Plugin Name: Epioso CMS Bridge
 * Description: Exposes ACF and Gutenberg block schemas and merchant-managed structured content for EcomOS storefront.
 * Version: 1.1.0
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
        // Schema inspection endpoint
        register_rest_route('epioso/v1', '/schema', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_schema'],
            'permission_callback' => '__return_true',
        ]);

        // Public read endpoints for structured CMS content
        register_rest_route('epioso/v1', '/content', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_all_content'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route('epioso/v1', '/content/(?P<slot>[a-zA-Z0-9_-]+)', [
            [
                'methods'  => 'GET',
                'callback' => [$this, 'get_content_slot'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'  => 'POST',
                'callback' => [$this, 'save_content_slot'],
                'permission_callback' => [$this, 'check_merchant_permissions'],
            ],
        ]);
    }

    public function check_merchant_permissions() {
        if (!function_exists('current_user_can')) {
            return false;
        }
        return current_user_can('edit_pages') || current_user_can('manage_options');
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

    public function get_all_content(WP_REST_Request $request) {
        $slots = ['home', 'hero', 'navigation', 'banners', 'story', 'articles', 'seo'];
        $data = [];
        foreach ($slots as $slot) {
            $content = get_option('epioso_cms_content_' . $slot, null);
            if ($content !== null) {
                $data[$slot] = $this->sanitize_content_tree($content);
            }
        }
        return rest_ensure_response([
            'slots' => $data,
        ]);
    }

    public function get_content_slot(WP_REST_Request $request) {
        $slot = sanitize_key($request->get_param('slot'));
        $content = get_option('epioso_cms_content_' . $slot, null);

        if ($content === null) {
            return new WP_Error(
                'content_not_found',
                sprintf('Content for slot "%s" not configured', $slot),
                ['status' => 404]
            );
        }

        return rest_ensure_response([
            'slot' => $slot,
            'data' => $this->sanitize_content_tree($content),
            'updated_at' => get_option('epioso_cms_updated_' . $slot, null),
        ]);
    }

    public function save_content_slot(WP_REST_Request $request) {
        $slot = sanitize_key($request->get_param('slot'));
        $body = $request->get_json_params();

        if (empty($body) || !is_array($body)) {
            return new WP_Error(
                'invalid_payload',
                'Request body must be a valid JSON object',
                ['status' => 400]
            );
        }

        $sanitized = $this->sanitize_content_tree($body);
        update_option('epioso_cms_content_' . $slot, $sanitized, 'no');
        $now = gmdate('Y-m-d\TH:i:s\Z');
        update_option('epioso_cms_updated_' . $slot, $now, 'no');

        // Allow cache flush hooks or external invalidators
        do_action('epioso_cms_content_updated', $slot, $sanitized);

        return rest_ensure_response([
            'slot' => $slot,
            'data' => $sanitized,
            'updated_at' => $now,
            'saved' => true,
        ]);
    }

    /**
     * Recursively sanitizes data, stripping dangerous tags and scripts.
     */
    protected function sanitize_content_tree($value) {
        if (is_array($value)) {
            $clean = [];
            foreach ($value as $k => $v) {
                $clean_key = is_string($k) ? sanitize_text_field($k) : $k;
                $clean[$clean_key] = $this->sanitize_content_tree($v);
            }
            return $clean;
        }

        if (is_string($value)) {
            // Remove script tags and dangerous HTML attributes
            $stripped = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $value);
            $stripped = preg_replace('/javascript:/i', '', $stripped);
            $stripped = preg_replace('/(onerror|onload|onclick|onmouseover|onfocus|onblur)\s*=/i', '', $stripped);
            return function_exists('wp_kses_post') ? wp_kses_post($stripped) : strip_tags($stripped, '<b><strong><i><em><a><p><br><ul><ol><li>');
        }

        if (is_numeric($value) || is_bool($value)) {
            return $value;
        }

        return null;
    }
}

new Epioso_CMS_Bridge();
