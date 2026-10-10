# EcomOS Merchant Task Runbook

## Overview
This runbook provides step-by-step instructions for store operators (`ecomos_operator`) and fulfillment personnel (`ecomos_fulfillment`).
It covers day-to-day store administration without requiring code edits or access to server-level technical secrets.

---

## 1. Daily Operations & Morning Routine

1. **Access the Operations Hub**:
   - Log into `/wp-admin` with your assigned merchant credentials.
   - Navigate to **Operations** in the left sidebar menu (`admin.php?page=ecomos-operations`).
2. **Review Key Indicators**:
   - Check **Orders to Process**: Count of paid customer orders waiting for packaging.
   - Check **Orders On Hold**: Orders awaiting wire transfer / manual payment confirmation.
   - Check **Low Stock Warnings**: Products that require warehouse replenishment.

---

## 2. Order Fulfillment Workflow

### Step-by-Step Order Triage:
1. Under **Priority Order Queue** on the Operations page, click the order number (e.g. `#1042`) or **Fulfill**.
2. This opens the native WooCommerce HPOS order screen (`admin.php?page=wc-orders&action=edit&id=1042`).
3. **Verify Order Items & Customer Details**:
   - Confirm purchased variations, quantities, and shipping address.
   - For COD (Cash on Delivery) orders, verify telephone number if order notes require dispatch confirmation.
4. **Pack and Dispatch**:
   - Prepare package according to shipping method selected.
   - Add tracking notes in the **Order notes** box (set type to "Note to customer" if notification should be emailed).
5. **Update Order Status**:
   - Change Status dropdown from `Processing` to `Completed`.
   - Click the blue **Update** button on the right.
   - An automated dispatch confirmation email is triggered to the customer.

---

## 3. Product Catalog & Inventory Management

### Updating Stock Quantities:
1. On the Operations page, click **Restock** next to any product in the **Low Stock Alerts** list, or navigate to **Products > All Products**.
2. Locate the product and click **Edit**.
3. Scroll down to the **Product Data** metabox:
   - For simple products: click **Inventory** tab, adjust **Stock quantity**, and set **Stock status** to "In stock".
   - For variable products: click **Variations** tab, expand the specific variation, and update its individual stock count.
4. Click **Update** in the Publish box.

### Creating a New Product:
1. Click **Products > Add New** from the sidebar or Operations shortcuts.
2. Enter Product Title and Long Description.
3. Select Categories and Brands in the right sidebar.
4. Set Featured Product Image (minimum 1000x1000px JPG/WebP recommended).
5. In **Product Data**, set Regular Price and SKU.
6. Click **Publish**.

---

## 4. Promotions & Discount Coupons

1. Navigate to **Marketing > Coupons** (or sidebar shortcut **Discount Coupons**).
2. Click **Add Coupon**.
3. Specify:
   - **Coupon code**: e.g., `SUMMER10`
   - **Discount type**: Percentage discount or Fixed cart discount.
   - **Coupon amount**: e.g., `10`
   - **Expiry date**: Set expiration date if time-limited.
4. Click **Publish**.

---

## 5. Content Management (Pages & Policies)

1. Navigate to **Pages > All Pages**.
2. To edit terms of service, shipping policy, or about page, click **Edit** under the relevant page.
3. Use the WordPress Block Editor to update text, headings, and images.
4. Click **Update** to save live changes.

---

## 6. Optional Addon Off-State Behavior (e.g., RFQ Quotes)

- When an optional addon is deactivated (such as Request For Quote):
  - No RFQ quote badges or menus appear on the Operations dashboard.
  - The storefront operates in pure direct-purchase mode.
  - Quotes cannot be created or viewed.
- When an optional addon is activated:
  - An **RFQ Quotes Queue** card appears automatically in the Operations dashboard.
  - Review pending quotes and emit customer offers via **Operations > Quotes**.

---

## 7. Escalation Paths & Troubleshooting

| Issue / Scenario | Role Responsible | Escalation Action |
| :--- | :--- | :--- |
| Customer billing dispute / chargeback | Merchant Operator | Inspect gateway transaction ID on HPOS order screen; contact merchant payment portal. |
| Missing carrier tracking code | Fulfillment Staff | Contact logistics / courier liaison. |
| Server error 500 / fatal crash | Technical Operator | Escalate to Platform Administrator (see `PLATFORM_RUNBOOK.md`). |
| New payment gateway activation | Technical Operator | Requires Platform Administrator; store staff cannot alter API keys. |
