# ECO-501: Server-Enforced Merchant Role Matrix and Staff Capabilities

## Summary
Implements the comprehensive client operator role matrix and daily jobs specification along with server-side WordPress/WooCommerce capability enforcement in `wp-ecomos-operations`.

## Scope & Claimed Paths
- `docs/ecomos/admin/ROLE_MATRIX.md`
- `plugins/wp-ecomos-operations/`
- `docs/ecomos/evidence/ECO-501/`

## Key Implementations
1. **Role Matrix Specification (`docs/ecomos/admin/ROLE_MATRIX.md`)**:
   - Mapped daily merchant jobs (orders, products, inventory, promotions, content, quotes) across roles.
   - Defined boundaries separating `administrator` (platform owner), `ecomos_operator` (client store manager), `ecomos_fulfillment` (pack/ship staff), and `customer` / anonymous.
   - Documented explicit allow/deny boundaries ensuring non-administrators cannot access credentials, plugins, themes, or core settings.

2. **Server-Side Enforcement (`plugins/wp-ecomos-operations/capabilities.php`)**:
   - `ecomos_register_roles()`: Formal registration and capability assignment during plugin activation and runtime init.
   - `ecomos_can_user_perform_job()`: Unified programmatic capability check for daily merchant jobs.
   - Dynamic Quote Addon Gating: Quote capability (`ecomos_manage_quotes`) checks whether the quote addon is active (`ecomos_addon_quotes_enabled === 'yes'`). If disabled, quote operations are rejected server-side even for store managers.
   - REST API Authorization Callbacks: Helper callback `ecomos_rest_check_job()` returns `WP_Error` with code `rest_forbidden` and 403 status on unauthorized requests.
   - Direct URL Access Interception: `admin_init` hook intercepts non-admin attempts to access sensitive technical admin pages (`options-general.php`, `plugins.php`, `theme-editor.php`, `tools.php`) and blocks execution with HTTP 403.

3. **Plugin Entrypoint (`plugins/wp-ecomos-operations/wp-ecomos-operations.php`)**:
   - Standard WordPress plugin header, constants, activation hooks, and module inclusion.

4. **Automated Verification**:
   - `plugins/wp-ecomos-operations/tests/capabilities.spec.mjs`: Contract specification test asserting capability maps, denied technical actions, quote addon gating logic, and security rules.
   - `plugins/wp-ecomos-operations/tests/capabilities.test.php`: WordPress runtime unit test suite for WP-CLI / PHPUnit testing.
   - `docs/ecomos/evidence/ECO-501/permissions.md`: Comprehensive audit ledger detailing test results and observed server responses.

## Verification Command & Results
```bash
node --test plugins/wp-ecomos-operations/tests/capabilities.spec.mjs
```
Output:
```text
✔ EcomOS capabilities.php source and structure contract
✔ ROLE_MATRIX.md specification completeness
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
```
