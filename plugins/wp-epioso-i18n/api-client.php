<?php
if (!defined('ABSPATH')) exit;

/**
 * Pushes updated JSON translations to the Next.js storefront API.
 * 
 * @param string $locale The locale code (e.g. 'en', 'fr')
 * @param array $translations The associative array of translations
 * @return bool True on success, false on failure
 */
function epioso_i18n_push_to_storefront($locale, $translations) {
    // In production, this URL should be configurable via settings
    $storefront_url = defined('EPIOSO_STOREFRONT_URL') ? EPIOSO_STOREFRONT_URL : 'http://localhost:3000';
    $api_endpoint = $storefront_url . '/api/admin/i18n/strings';

    // In production, use a secure API key
    $api_secret = defined('EPIOSO_STOREFRONT_SECRET') ? EPIOSO_STOREFRONT_SECRET : 'dev-secret-key';

    $body = wp_json_encode([
        'locale' => $locale,
        'translations' => $translations
    ]);

    $response = wp_remote_post($api_endpoint, [
        'method'      => 'PUT',
        'timeout'     => 15,
        'headers'     => [
            'Content-Type'  => 'application/json',
            'Authorization' => 'Bearer ' . $api_secret
        ],
        'body'        => $body,
        'data_format' => 'body'
    ]);

    if (is_wp_error($response)) {
        error_log('EPIOSO i18n Error: ' . $response->get_error_message());
        return false;
    }

    $response_code = wp_remote_retrieve_response_code($response);
    if ($response_code >= 200 && $response_code < 300) {
        return true;
    }

    error_log('EPIOSO i18n Error: API returned ' . $response_code);
    return false;
}
