# ECO-504 Evidence: Merchant Workflow UAT & Negative Permissions Audit

## Objective
Record comprehensive user acceptance testing (UAT) evidence verifying routine merchant tasks, negative permission gates, addon off-state isolation, and platform administrator separation.

---

## 1. Routine Merchant Job Acceptance Ledger

| Test Case | Actor Role | Action Performed | Expected Result | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **UAT-01** | `ecomos_operator` | View Operations landing (`admin.php?page=ecomos-operations`) | Dashboard loads with KPI cards and queues | HTTP 200, summary metrics rendered | **PASS** |
| **UAT-02** | `ecomos_operator` | Process order `#1042` (`processing` -> `completed`) | Order updated in HPOS `wp_wc_orders` | Status updated, customer note saved | **PASS** |
| **UAT-03** | `ecomos_operator` | Update product price & stock (Product #205) | Product price changed, stock quantity updated | Updated in `wp_postmeta` / Woo CRUD | **PASS** |
| **UAT-04** | `ecomos_operator` | Create discount coupon `SUMMER10` | Coupon saved and usable at checkout | Saved in `shop_coupon` post type | **PASS** |
| **UAT-05** | `ecomos_operator` | Edit "About Us" page in Block Editor | Page content updated and published | Saved in `wp_posts` | **PASS** |
| **UAT-06** | `ecomos_fulfillment` | View Operations landing & Priority Order Queue | Order queue visible; catalog shortcuts hidden | HTTP 200, order list visible | **PASS** |
| **UAT-07** | `ecomos_fulfillment` | Update order status to `completed` | Order completed; packing slip recorded | Status updated successfully | **PASS** |

---

## 2. Negative Permissions & Technical Setting Traps

| Test Case | Actor Role | Target URL / Action | Expected Result | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **SEC-01** | `ecomos_operator` | GET `/wp-admin/options-general.php` | Blocked at `admin_init` | HTTP 403 Forbidden `wp_die` | **PASS** |
| **SEC-02** | `ecomos_operator` | GET `/wp-admin/plugins.php` | Blocked at `admin_init` | HTTP 403 Forbidden `wp_die` | **PASS** |
| **SEC-03** | `ecomos_operator` | GET `/wp-admin/theme-editor.php` | Blocked at `admin_init` | HTTP 403 Forbidden `wp_die` | **PASS** |
| **SEC-04** | `ecomos_operator` | POST `/wp-json/wp/v2/settings` | REST permission check fails | HTTP 403 `rest_forbidden` | **PASS** |
| **SEC-05** | `ecomos_fulfillment` | POST `/wp-admin/post.php` (Edit Product) | Capability check fails | HTTP 403 Forbidden | **PASS** |
| **SEC-06** | `customer` | GET `/wp-admin/admin.php?page=ecomos-operations` | Gated by `edit_shop_orders` | HTTP 403 Forbidden | **PASS** |

---

## 3. Optional Addon Off-State Audit (RFQ Quotes)

| Test Case | Addon State | Actor Role | Action | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **ADDON-01** | Disabled (`no`) | `ecomos_operator` | View Operations landing | Zero RFQ quote cards or widgets rendered | **PASS** |
| **ADDON-02** | Disabled (`no`) | `ecomos_operator` | Request `ecomos_check_permission('quotes')` | Returns `false` server-side | **PASS** |
| **ADDON-03** | Disabled (`no`) | `customer` | Attempt storefront quote submission | Rejected at storefront boundary | **PASS** |
| **ADDON-04** | Enabled (`yes`) | `ecomos_operator` | View Operations landing | RFQ Quotes Queue card renders with counters | **PASS** |

---

## 4. Conclusion & Sign-Off
All tested merchant workflows execute through native WordPress/WooCommerce APIs without code modifications or exposure of technical secrets.
Technical settings and file editors are strictly restricted to Platform Administrators.
