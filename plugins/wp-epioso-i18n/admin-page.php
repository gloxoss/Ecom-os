<?php
if (!defined('ABSPATH')) exit;

add_action('admin_menu', 'epioso_i18n_admin_menu');

function epioso_i18n_admin_menu() {
    add_menu_page(
        'Storefront Translations',
        'Translations',
        'manage_options',
        'epioso-i18n',
        'epioso_i18n_admin_page_html',
        'dashicons-translation',
        30
    );
}

function epioso_i18n_admin_page_html() {
    if (!current_user_can('manage_options')) return;

    // Handle form submission
    if (isset($_POST['epioso_i18n_submit'])) {
        check_admin_referer('epioso_i18n_save');
        $locale = sanitize_text_field($_POST['locale']);
        $json_data = stripslashes($_POST['translations_json']);
        
        $decoded = json_decode($json_data, true);
        if ($decoded === null) {
            echo '<div class="notice notice-error"><p>Invalid JSON.</p></div>';
        } else {
            // Push to Next.js API
            $result = epioso_i18n_push_to_storefront($locale, $decoded);
            if ($result) {
                echo '<div class="notice notice-success"><p>Translations saved and synced to storefront!</p></div>';
            } else {
                echo '<div class="notice notice-error"><p>Failed to sync to storefront. Check error logs.</p></div>';
            }
        }
    }

    $locale = isset($_GET['locale']) ? sanitize_text_field($_GET['locale']) : 'en';
    ?>
    <div class="wrap">
        <h1>Storefront Translations</h1>
        
        <form method="get" action="">
            <input type="hidden" name="page" value="epioso-i18n">
            <select name="locale" onchange="this.form.submit()">
                <option value="en" <?php selected($locale, 'en'); ?>>English</option>
                <option value="fr" <?php selected($locale, 'fr'); ?>>French</option>
                <option value="ar" <?php selected($locale, 'ar'); ?>>Arabic</option>
            </select>
        </form>

        <form method="post" action="" style="margin-top: 20px;">
            <?php wp_nonce_field('epioso_i18n_save'); ?>
            <input type="hidden" name="locale" value="<?php echo esc_attr($locale); ?>">
            
            <table class="form-table">
                <tr>
                    <th><label for="translations_json">Translations (JSON format)</label></th>
                    <td>
                        <textarea name="translations_json" id="translations_json" rows="20" class="large-text code">{
  "nav": {
    "catalog": "Catalog"
  }
}</textarea>
                        <p class="description">Edit the raw JSON file content for this locale. This will be synced to the Next.js API.</p>
                    </td>
                </tr>
            </table>
            
            <?php submit_button('Save & Sync', 'primary', 'epioso_i18n_submit'); ?>
        </form>
    </div>
    <?php
}
