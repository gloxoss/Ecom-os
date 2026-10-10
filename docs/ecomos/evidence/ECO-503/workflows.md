# ECO-503 Evidence: Operations Landing Workflows & Verification

## Objective
Verify the operational workflows of the EcomOS Operations admin landing page (`admin.php?page=ecomos-operations`), demonstrating that real merchant jobs are streamlined through native WooCommerce CRUD without creating secondary backends or duplicate reporting databases.

---

## 1. Verified Merchant Workflows

### Workflow 1: Priority Order Fulfillment Triage
1. **Entry**: Merchant logs in as `ecomos_operator` or `ecomos_fulfillment` and navigates to `Operations` in the top-level admin menu.
2. **Dashboard Render**:
   - Status cards show real-time counts of processing orders and orders on hold.
   - Priority Order Queue lists up to 8 recent orders needing action.
3. **Execution**:
   - Operator clicks `#1042` or `Fulfill` button.
   - Navigates directly to native HPOS order screen (`/wp-admin/admin.php?page=wc-orders&action=edit&id=1042`).
   - Order status updated to `completed` via native WooCommerce order actions.
4. **Result**: Zero data discrepancy between operations triage and underlying HPOS order storage (`wp_wc_orders`).

### Workflow 2: Low-Stock Inventory Restock
1. **Trigger**: Inventory reaches or drops below low-stock threshold (configured in WooCommerce stock settings).
2. **Alert Display**:
   - KPI card highlights low stock count with alert border.
   - Low Stock Alerts table lists item name, SKU, and remaining stock quantity.
3. **Execution**:
   - Operator clicks `Restock` button.
   - Navigates directly to product edit screen (`/wp-admin/post.php?post=205&action=edit`).
   - Stock inventory updated via standard WooCommerce product data metabox.
4. **Result**: Stock is immediately updated and reflected on the storefront.

### Workflow 3: Dynamic Addon Slot Gating (RFQ Quotes)
1. **Scenario A: Quote Addon Disabled (`ecomos_addon_quotes_enabled === 'no'`)**:
   - Hook `ecomos_operations_addon_slots` executes.
   - `ecomos_render_quotes_addon_slot()` checks option and returns early.
   - DOM inspection confirms: zero RFQ quote cards or DOM nodes are rendered.
2. **Scenario B: Quote Addon Enabled (`ecomos_addon_quotes_enabled === 'yes'`)**:
   - Option toggled to `yes`.
   - Operations page renders RFQ Quotes Queue card displaying pending quote counter and direct link to `/wp-admin/admin.php?page=ecomos-quotes`.

### Workflow 4: Security Boundary & Unauthorized Access Trapping
1. **Request by Customer (`customer` role)**:
   - Request to `/wp-admin/admin.php?page=ecomos-operations`.
   - Trapped by `current_user_can('edit_shop_orders')`.
   - Output: `wp_die()` with HTTP 403 Forbidden.
2. **Settings Shortcut Scoping**:
   - Shortcuts menu checks `current_user_can('manage_options')`.
   - For `ecomos_operator` and `ecomos_fulfillment`, the "Store Configuration (Admin)" link is completely omitted.

---

## 2. Accessibility & Responsive Verification
- **Mobile Viewport (375px & 768px)**: Grid collapses via `@media (max-width: 960px)` into a single vertical column. Table scrolls cleanly without breaking layout width.
- **Keyboard Navigation**: Sequential `Tab` flow navigates from skip links, through KPI summary cards, to table row actions and sidebar shortcuts. Focus outlines remain visible.
