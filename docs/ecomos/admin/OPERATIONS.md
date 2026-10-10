# EcomOS Operations Admin Landing Page

## 1. Overview & Architecture

The EcomOS Operations page (`admin.php?page=ecomos-operations`) provides store operators with an intuitive, unified operational triage dashboard directly inside WordPress.

### Key Architectural Tenets:
1. **Zero Second Backend**: Operates 100% within the native WordPress request lifecycle. No secondary Node.js/Next.js merchant backend, no duplicated microservices, and no synchronized reporting databases.
2. **WooCommerce Authoritative CRUD**: All order metrics, customer names, statuses, and inventory counts are queried through native WooCommerce API functions (`wc_get_orders()`, `wc_orders_count()`, `wc_get_products()`).
3. **HPOS Deep Links**: All action links route directly to native High-Performance Order Storage screens (`admin.php?page=wc-orders&action=edit&id=...`).
4. **Server-Side Capability Scoping**: Access is strictly gated by the `edit_shop_orders` capability, terminating unauthorized access with HTTP 403.
5. **Dynamic Addon Slots**: Modular extensibility via the `ecomos_operations_addon_slots` action hook. When an addon (e.g. RFQ Quotes) is disabled, its card is completely absent from the DOM.

---

## 2. Layout Structure & Components

```text
+-----------------------------------------------------------------------------------+
| EcomOS Operations                                               [Native Woo/HPOS] |
| Daily merchant triage, order fulfillment, and inventory queue                     |
+-----------------------------------------------------------------------------------+
| [Orders to Process]    [Orders On Hold]    [Low Stock Warnings] [Completed Today] |
+-----------------------------------------------------------------------------------+
| (Optional Addon Slot: e.g. RFQ Quotes Queue - only if addon active)               |
+---------------------------------------------------------+-------------------------+
| Priority Order Queue (Processing / On-Hold / Pending)   | Merchant Shortcuts      |
| - Order #, Date, Customer, Status Pill, Total, Fulfill  | - WooCommerce Orders    |
+---------------------------------------------------------+ - Products & Catalog    |
| Low Stock Alerts (Stock <= Notification Threshold)      | - Add New Product       |
| - Product Name, SKU, Remaining Quantity, Restock        | - Discount Coupons      |
|                                                         | - Content Pages         |
|                                                         | - Settings (Admin only) |
+---------------------------------------------------------+-------------------------+
```

---

## 3. Security & Access Boundaries

- **Allowed Roles**:
  - `administrator`: Full access to landing, orders, products, and store settings shortcuts.
  - `ecomos_operator`: Full access to landing, orders, products, coupons; settings shortcut hidden; direct URL access to settings blocked.
  - `ecomos_fulfillment`: Access to landing and order fulfillment; catalog editing and settings hidden/blocked.
- **Denied Roles**:
  - `customer`, `subscriber`, anonymous: Blocked immediately at `admin_init` and in `ecomos_render_operations_page()` via `wp_die(..., 403)`.

---

## 4. Addon Slots Integration Contract

Addons register their operational cards via standard WordPress action hooks:
```php
add_action('ecomos_operations_addon_slots', function() {
    if (get_option('my_addon_enabled') !== 'yes') {
        return; // Addon disabled -> slot completely absent
    }
    // Render addon summary card
});
```
This guarantees that uninstalled or deactivated addons leave zero footprint on the operations screen.
