# EcomOS Merchant & Operator Role Matrix

## Purpose & Architectural Invariants

This document establishes the authoritative server-side role and capability matrix for **EcomOS Operations**.

In EcomOS, security is enforced **at the server boundary** (REST API permission callbacks and `admin_init` hooks), **never** solely by hiding UI navigation links. If an unauthorized user crafts a direct HTTP request to a restricted route or administrative PHP file, the request is rejected with HTTP `403 Forbidden`.

---

## 1. Roles Definition

| Role Slug | Display Name | Domain Scope |
| :--- | :--- | :--- |
| `administrator` | Platform Administrator | Infrastructure operator with complete WordPress, PHP, plugin, and server options authority. |
| `ecomos_operator` | Store Manager | Client business operator managing daily catalog, inventory, orders, coupons, and content. Denied technical configuration. |
| `ecomos_fulfillment`| Fulfillment Clerk | Dispatch operator viewing orders, printing pack-slips, and advancing order statuses. Denied catalog editing and settings. |
| `customer` | Shopper / Customer | Public consumer. Zero administrative or staff capabilities. *(Customer accounts remain disabled in Phase 4/5).* |

---

## 2. Daily Jobs vs. Server Capabilities Matrix

| Daily Merchant Job | Required WP Capability | `administrator` | `ecomos_operator` | `ecomos_fulfillment` | `customer` / Public |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Order Queue View** | `read_private_shop_orders` | ALLOW | ALLOW | ALLOW | DENY (403) |
| **Order Status Update** (e.g. processing -> completed)| `edit_shop_orders` | ALLOW | ALLOW | ALLOW | DENY (403) |
| **Order Refunds & Line Item Edit** | `edit_shop_orders` + `manage_woocommerce` | ALLOW | ALLOW | DENY (403) | DENY (403) |
| **Product Catalog Read** | `read_private_products` | ALLOW | ALLOW | ALLOW | DENY (403) |
| **Product Create & Edit** | `edit_products`, `publish_products` | ALLOW | ALLOW | DENY (403) | DENY (403) |
| **Inventory & Stock Adjustments** | `ecomos_manage_inventory` | ALLOW | ALLOW | DENY (403) | DENY (403) |
| **Promotions & Discount Coupons** | `edit_shop_coupons` | ALLOW | ALLOW | DENY (403) | DENY (403) |
| **CMS Pages & Content Banners** | `edit_pages`, `publish_pages` | ALLOW | ALLOW | DENY (403) | DENY (403) |
| **Quotes / RFQ Management** *(Addon Gated)* | `ecomos_manage_quotes` | ALLOW | ALLOW *(if addon on)* | DENY (403) | DENY (403) |
| **EcomOS Operations Landing** | `ecomos_view_operations_landing` | ALLOW | ALLOW | ALLOW | DENY (403) |
| **Plugin Activation / Deactivation** | `activate_plugins` | ALLOW | DENY (403) | DENY (403) | DENY (403) |
| **PHP / Theme / Plugin Code Edits** | `edit_plugins`, `edit_themes` | ALLOW | DENY (403) | DENY (403) | DENY (403) |
| **WordPress Global Settings (`wp_options`)**| `manage_options` | ALLOW | DENY (403) | DENY (403) | DENY (403) |
| **Raw Unfiltered HTML Injection** | `unfiltered_html` | ALLOW | DENY (403) | DENY (403) | DENY (403) |

---

## 3. Server-Side Enforcement Rules

1. **REST API Permission Callbacks**:
   - Every route under `/wp-json/ecomos/v1/operations/*` defines an explicit `permission_callback`.
   - Unauthorized requests immediately return `WP_Error('rest_forbidden', '...', array('status' => 403))`.

2. **Direct URL Protection (`admin_init`)**:
   - If an `ecomos_operator` or `ecomos_fulfillment` user directly requests `options.php`, `plugins.php`, or code editors in `/wp-admin/`, the request is terminated with `wp_die(..., 403)`.

3. **Dynamic Quote Addon Gating**:
   - `ecomos_manage_quotes` check verifies both user capability AND whether the RFQ quote addon is activated. If the quote addon is off, the capability check fails server-side, preventing access to dark/dormant quote records.
