# EcomOS Platform Administrator Runbook

## Overview
This runbook defines technical responsibilities, secrets management, server administration, and security boundaries reserved exclusively for Platform Administrators (`administrator` role).
Store operators and fulfillment staff are strictly quarantined from these procedures by server-enforced capability checks.

---

## 1. Technical Boundary & Least Privilege Architecture

The EcomOS platform enforces strict role separation:
- **Merchant Staff (`ecomos_operator`, `ecomos_fulfillment`)**: Manage commerce data (orders, stock, catalog, promotions). Cannot access plugin code, theme files, or platform secrets.
- **Platform Administrator (`administrator`)**: Manages hosting infrastructure, database maintenance, PHP runtimes, security updates, and external API credentials.

Direct URL requests to technical pages (`options.php`, `options-general.php`, `plugins.php`, `theme-editor.php`) by non-admins are intercepted at `admin_init` and terminated with HTTP 403.

---

## 2. Secrets & Payment Gateway Credentials Management

### Sensitive Credentials Checklist:
- WooCommerce REST API Keys (Consumer Key & Consumer Secret)
- Order Access HMAC Secret (`ORDER_ACCESS_SECRET`)
- Payment Provider Credentials (Stripe API Keys, Webhook Secret, CMI merchant keys)
- Database Connection Strings (`DB_PASSWORD`, `DB_USER`)

### Management Rules:
1. **Zero Hardcoded Secrets**: Secrets must never be stored in source code or committed to git.
2. **Environment Variable Injection**: All production secrets are provided via `.env` or system environment variables.
3. **Restricted Admin Screen**: Gateway settings at `/wp-admin/admin.php?page=wc-settings&tab=checkout` are accessible only to `administrator`.

---

## 3. Plugin Lifecycle & Upgrade Management

### Invariant:
No plugin may be installed, activated, or deleted directly in production by store operators.
All plugin changes must undergo staging verification.

### Staging Procedure:
1. Test plugin compatibility with WooCommerce HPOS (`Automattic\WooCommerce\Internal\DataStores\Orders\OrdersTableDataStore`).
2. Run automated regression checks:
   ```bash
   node --test plugins/wp-ecomos-operations/tests/*.spec.mjs
   ```
3. Verify that new plugins do not stack competing admin shells (conforming to `SHELL_DECISION.md`).
4. Commit deployment manifest.

---

## 4. Emergency Triage & Server Restoration

### Incident Response:
1. **Server 500 / Fatal Error**:
   - Inspect PHP error logs (`wp-content/debug.log`).
   - If an operational plugin misbehaves, deactivate via WP-CLI:
     `wp plugin deactivate <plugin-slug>`
2. **Database Cache Invalidation**:
   - Flush Redis / Object cache:
     `wp cache flush`
   - Clear WooCommerce transients:
     `wp transient delete --all`
3. **Database Health Verification**:
   - Verify HPOS custom tables: `wp_wc_orders`, `wp_wc_order_addresses`, `wp_wc_order_operational_data`.
   - Ensure table indexes are healthy:
     `wp db check`
