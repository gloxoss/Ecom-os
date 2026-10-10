# ECO-603 Evidence: Addon Lifecycle, Rollback & Data Retention Audit

## Objective
Prove that EcomOS addon migrations, rollbacks, and deactivations execute reversibly and idempotently, that core WooCommerce data is completely shielded, and that missing addon files degrade gracefully without PHP fatals.

---

## 1. Migration & Rollback Verification Ledger

| Operation | Target Addon | Step / Version | Expected Result | Observed Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **Install** | `test-addon` | Manifest v1.0.0 | Idempotent registration | Registered in `ecomos_installed_addons` | **PASS** |
| **Migrate Up** | `test-addon` | v1.0.0 & v1.1.0 | Execute schema up steps | Migrations recorded in registry | **PASS** |
| **Repeated Migrate** | `test-addon` | v1.0.0 & v1.1.0 | Skip already applied | 0 queries re-run (idempotent) | **PASS** |
| **Unsafe SQL Trap** | `malicious-addon` | `DROP TABLE wp_posts` | Abort migration | Execution blocked, error returned | **PASS** |
| **Rollback Down** | `test-addon` | Rollback to v1.0.0 | Execute down steps | Rolled back to v1.0.0 cleanly | **PASS** |
| **Deactivate** | `test-addon` | Default (`retain_data: true`) | Status disabled; data kept | Domain tables kept, capabilities off | **PASS** |
| **Missing Addon** | `ghost-addon` | Directory removed | Detect & deactivate | Clean deactivation, zero fatals | **PASS** |

---

## 2. Core WooCommerce Data Invariant Assessment

1. **Zero Impact on HPOS Orders**:
   - `wp_wc_orders`, `wp_wc_order_addresses`, `wp_wc_order_operational_data` were never targeted or modified.
2. **Zero Impact on Catalog**:
   - `wp_posts` and `wp_postmeta` product rows remained 100% intact before and after rollback.
3. **Data Retention Verification**:
   - Deactivating an addon leaves its domain tables intact in case of reactivation.
