# EcomOS Admin Shell Operational Runbook & Rollback Procedures

## Overview
This runbook defines the operational procedures for managing, auditing, and rolling back the administrative interface in EcomOS. It establishes verified fail-safes so that store operations (order processing, fulfillment, and inventory adjustments) never experience downtime due to admin customizations.

---

## 1. Pre-Deployment Staging Verification Checklist

Before activating or updating any administrative interface enhancement:
1. **Database Snapshot**: Verify that the database backup is current (`wp db export` or staging snapshot).
2. **HPOS Sanity Check**:
   - Navigate to `/wp-admin/admin.php?page=wc-orders`.
   - Verify that order lists, status badges, and single-order detail modals render properly.
   - Confirm order status transitions (`processing` -> `completed`) execute without JavaScript errors in console.
3. **Role Boundary Audit**:
   - Log in as synthetic `ecomos_operator` user.
   - Confirm access to Orders, Products, Coupons, and EcomOS Operations landing.
   - Verify direct attempt to navigate to `/wp-admin/options-general.php` returns HTTP 403.
4. **Mobile & Keyboard Test**:
   - Confirm viewport responsiveness at 375px (mobile portrait) and 768px (tablet).
   - Test full keyboard tab flow through the primary navigation menu and action buttons.

---

## 2. Competing Shell Prevention Invariant

> [!CRITICAL]
> Only **one** administrative shell pattern may be active at any time. Under no circumstances may third-party suites (e.g. WP Adminify, uiXpress, White Label CMS) be activated concurrently with `wp-ecomos-operations`.
> Stacking competing shells triggers conflicting CSS resets, broken React state in WooCommerce Admin, and ambiguous menu hook orders.

To enforce this:
- The system automatically detects and flags foreign admin plugins during audit.
- Plugin activation hooks in `wp-ecomos-operations` verify that conflicting admin skins are inactive.

---

## 3. Rollback & Disaster Recovery Procedure

If any issue, styling conflict, or upstream incompatibility occurs:

### Step 1: Immediate Deactivation
Deactivate the customization plugin via WP-CLI:
```bash
wp plugin deactivate wp-ecomos-operations
```
Or via database emergency flag:
```sql
UPDATE wp_options 
SET option_value = REPLACE(option_value, 's:47:"wp-ecomos-operations/wp-ecomos-operations.php";', '')
WHERE option_name = 'active_plugins';
```

### Step 2: Clear Admin Caches
Flush object cache and browser transient caches:
```bash
wp cache flush
wp transient delete --all
```

### Step 3: Verify Core Fallback Integrity
Confirm the native WordPress & WooCommerce administrative dashboard operates normally:
1. Access `/wp-admin/admin.php?page=wc-orders` -> HTTP 200, HPOS functional.
2. Access `/wp-admin/edit.php?post_type=product` -> HTTP 200, product list functional.
3. Verify capability tables: Roles created by EcomOS remain in WordPress `wp_user_roles` without corrupting standard administrator access.

---

## 4. Verification Evidence & Post-Rollback Sign-off
After deactivation or rollback:
- Run the automated test suite:
  `node --test docs/ecomos/admin/tests/admin-shell.spec.mjs`
- Confirm that database state contains no orphaned tables and no mutated core options.
