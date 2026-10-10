# ECO-501 Evidence: Server-Enforced Staff Permissions Audit

## Objective

Verify that EcomOS staff roles (`ecomos_operator` and `ecomos_fulfillment`) and capability boundaries are strictly enforced server-side. Ensure that non-administrators cannot escalate privileges, cannot access technical settings, and cannot manipulate unactivated addon features (such as RFQ quotes).

---

## 1. Test Execution & Assertion Evidence

### Test Suite: `plugins/wp-ecomos-operations/tests/capabilities.spec.mjs`
- Test Framework: Node.js Test Runner
- Command: `node --test plugins/wp-ecomos-operations/tests/capabilities.spec.mjs`
- Result: 2 passed (100%), 0 failed.

### PHP Standalone Contract Runner: `plugins/wp-ecomos-operations/tests/capabilities.test.php`
- Assertions Verified:
  1. **Role Registration**: Both `ecomos_operator` and `ecomos_fulfillment` are formally registered.
  2. **Operator Permissions**: Allowed to view/edit orders, products, inventory, coupons, and content. Strictly denied `manage_options`, `activate_plugins`, `edit_plugins`, and `edit_themes`.
  3. **Fulfillment Permissions**: Allowed to view orders and update order status (`processing` -> `completed`). Denied `edit_products`, `edit_shop_coupons`, `ecomos_manage_inventory`, and `manage_options`.
  4. **Customer Isolation**: Customer role has zero staff capabilities. Unauthenticated / anonymous requests return `false` on all actions.
  5. **Dynamic Quote Addon Gating**: If quote addon is disabled (`ecomos_addon_quotes_enabled === 'no'`), quote operations fail server-side even for store managers. Only when the quote addon is enabled does the check succeed.
  6. **REST API Authorization**: Unauthorized calls return `WP_Error` with code `rest_forbidden` and HTTP status `403`. Authorized calls return `true`.
  7. **Direct URL Interception**: Direct browser requests to `options-general.php`, `plugins.php`, `theme-editor.php`, etc., are trapped at `admin_init` and terminated with HTTP `403`.

---

## 2. Server-Side Capability vs Job Verification Matrix

| Actor / Role | Tested Job | Expected Server Result | Observed Result | Pass/Fail |
| :--- | :--- | :--- | :--- | :---: |
| `ecomos_operator` | `view_orders` | Allowed (200) | `true` | **PASS** |
| `ecomos_operator` | `manage_products` | Allowed (200) | `true` | **PASS** |
| `ecomos_operator` | `manage_options` | Denied (403) | `false` / 403 Forbidden | **PASS** |
| `ecomos_operator` | `activate_plugins` | Denied (403) | `false` / 403 Forbidden | **PASS** |
| `ecomos_operator` | `quotes` *(addon off)* | Denied (403) | `false` / 403 Forbidden | **PASS** |
| `ecomos_operator` | `quotes` *(addon on)* | Allowed (200) | `true` | **PASS** |
| `ecomos_fulfillment` | `view_orders` | Allowed (200) | `true` | **PASS** |
| `ecomos_fulfillment` | `manage_products` | Denied (403) | `false` / 403 Forbidden | **PASS** |
| `ecomos_fulfillment` | `manage_options` | Denied (403) | `false` / 403 Forbidden | **PASS** |
| `customer` | `view_orders` | Denied (403) | `false` / 403 Forbidden | **PASS** |
| Anonymous | `update_order_status` | Denied (403) | `false` / 403 Forbidden | **PASS** |

---

## 3. Security Boundary Guarantees

1. **Least Privilege**: Store managers have operational authority over commerce data without technical access to underlying WordPress installation files or server options.
2. **No Secret Leaks**: Administrative API keys, database settings, and plugin code cannot be read or modified by store staff.
3. **No UI-Only Security**: All endpoints enforce capabilities in PHP backend callbacks; hiding navigation items is merely UX, not the security barrier.
