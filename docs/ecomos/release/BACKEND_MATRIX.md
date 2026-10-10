# EcomOS Backend Compatibility Matrix: WordPress, WooCommerce & HPOS

- **Document**: `BACKEND_MATRIX.md`
- **Application**: EcomOS Backend Architecture
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Supported Platform Matrix

| Layer | Supported Versions | Minimum Required | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **PHP** | `8.1.x`, `8.2.x`, `8.3.x` | `8.1.0` | **CERTIFIED** | Strict types enabled; OPcache & Sodium extensions required. |
| **WordPress** | `6.4.x`, `6.5.x`, `6.6.x`, `6.7.x` | `6.4.0` | **CERTIFIED** | Tested with multi-site and standard standalone installs. |
| **WooCommerce** | `8.5.x` through `9.3.x+` | `8.5.0` | **CERTIFIED** | High-Performance Order Storage (HPOS) strictly enforced. |
| **MySQL / MariaDB** | MySQL `8.0+`, MariaDB `10.6+` | MySQL `8.0` | **CERTIFIED** | InnoDB engine with `utf8mb4` encoding. |
| **Store API** | Store API `v1` (CoCart / WC Native) | `v1` | **CERTIFIED** | Stateless guest cart and checkout sessions. |

---

## 2. High-Performance Order Storage (HPOS) Verification

All custom EcomOS plugins declare explicit compatibility with WooCommerce HPOS (`custom_order_tables`):

```php
add_action('before_woocommerce_init', function () {
    if (class_exists(\Automattic\WooCommerce\Utilities\FeaturesUtil::class)) {
        \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
            'custom_order_tables',
            __FILE__,
            true
        );
    }
});
```

### Verified Custom Plugins:
1. `wp-ecomos-addons`: Modular addon registry and feature flags (HPOS compatible).
2. `wp-ecomos-operations`: Operational health, sync status, and admin bridge (HPOS compatible).
3. `wp-ecomos-rfq`: High-scale quotation requests and durable quote revisions (HPOS order conversion compatible).

---

## 3. Store API & Guest Authorization

1. **Guest Cart & Checkout**: Orders created with `customer_id = 0` using HMAC order-key verification.
2. **Permanent Guest-First Guarantee**: No `wp_users` row is minted for guest purchasers.
3. **Certified Payments**: Default checkout strictly filters for `cod` (Cash on Delivery).
