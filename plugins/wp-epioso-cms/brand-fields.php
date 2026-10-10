<?php
/**
 * Plugin Name: Epioso CMS Brand Metadata
 * Description: Registers taxonomy term metadata for product brands (owned-label classification, origin, story, and documentation).
 * Version: 1.0.0
 * Author: EcomOS
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register term meta for product_brand taxonomy.
 * Invariant: term metadata is purely presentation and editorial;
 * it does not alter canonical WooCommerce product IDs, pricing, stock, or checkout.
 */
function epioso_register_brand_term_meta() {
    $meta_fields = [
        '_epioso_brand_is_owned' => [
            'type'         => 'boolean',
            'description'  => 'Flag indicating whether this brand is an owned private-label',
            'single'       => true,
            'show_in_rest' => true,
            'default'      => false,
        ],
        '_epioso_brand_origin' => [
            'type'         => 'string',
            'description'  => 'Country of origin or headquarters',
            'single'       => true,
            'show_in_rest' => true,
            'default'      => '',
        ],
        '_epioso_brand_story' => [
            'type'         => 'string',
            'description'  => 'Editorial brand narrative and history',
            'single'       => true,
            'show_in_rest' => true,
            'default'      => '',
        ],
        '_epioso_brand_docs_url' => [
            'type'         => 'string',
            'description'  => 'Optional URL to technical specifications or warranty documentation',
            'single'       => true,
            'show_in_rest' => true,
            'default'      => '',
        ],
    ];

    foreach ($meta_fields as $meta_key => $args) {
        register_term_meta('product_brand', $meta_key, [
            'type'              => $args['type'],
            'description'       => $args['description'],
            'single'            => $args['single'],
            'show_in_rest'      => $args['show_in_rest'],
            'default'           => $args['default'],
            'sanitize_callback' => 'epioso_sanitize_brand_meta',
            'auth_callback'     => function() {
                return current_user_can('manage_product_terms');
            },
        ]);
    }
}
add_action('init', 'epioso_register_brand_term_meta');

/**
 * Sanitize callback for brand metadata.
 */
function epioso_sanitize_brand_meta($meta_value) {
    if (is_bool($meta_value)) {
        return (bool) $meta_value;
    }
    return sanitize_text_field($meta_value);
}

/**
 * Retrieve brand metadata for a given brand term.
 */
function epioso_get_brand_metadata($term_id) {
    return [
        'is_owned'     => (bool) get_term_meta($term_id, '_epioso_brand_is_owned', true),
        'origin'       => (string) get_term_meta($term_id, '_epioso_brand_origin', true),
        'story'        => (string) get_term_meta($term_id, '_epioso_brand_story', true),
        'docs_url'     => (string) get_term_meta($term_id, '_epioso_brand_docs_url', true),
    ];
}
