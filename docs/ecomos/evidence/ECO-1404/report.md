# ECO-1404 Evidence Report: Application Rollback Verification & Migration Guard Constraints

**Task ID:** `ECO-1404`  
**Executor:** `sprint-recovery-1`  
**Base Commit:** `a34578a95b7c3a9c8879d963ada79ef01acf238d`  
**Date:** 2026-10-11  

---

## 1. Scope & Objective

Satisfy Next Execution Directive Section 4 ("Application rollback verification & migration guard constraints"):
1. Verify safely executed application/plugin/config rollback and recovered application reads without destructive database operations against live services.
2. Verify restore isolation and restricted restore credentials (port 3309 isolation, fail-closed boundaries, non-interference).
3. Fix and explicitly constrain the addon core-table guard migration contract in `plugins/wp-ecomos-addons/lifecycle.php` before claiming data preservation.

---

## 2. Implementation Summary

1. **Enhanced Migration Core-Table Guard (`plugins/wp-ecomos-addons/lifecycle.php`)**:
   - Upgraded `ecomos_sql_targets_core_table($sql)`:
     - **Database-Level Protection**: Explicitly blocks `DROP DATABASE` and `DROP SCHEMA`.
     - **Destructive DDL/DML Guard**: Blocks `DROP TABLE`, `ALTER TABLE`, `TRUNCATE TABLE`, `RENAME TABLE`, and `DELETE FROM` targeting core WordPress and WooCommerce entities.
     - **Comprehensive Protected Entities**:
       - WordPress Core: `posts`, `postmeta`, `options`, `users`, `usermeta`, `terms`, `term_taxonomy`, `term_relationships`, `comments`, `commentmeta`.
       - WooCommerce Core: `wc_orders`, `wc_orders_meta`, `wc_order_product_lookup`, `wc_order_stats`, `wc_customer_lookup`, `woocommerce_order_items`, `woocommerce_order_itemmeta`.
     - **Dynamic Prefix & Schema Qualified Matching**: Resolves `$wpdb->prefix` (e.g. `wpt_`) with fallback to `wp_` and tolerates schema qualification (`` `other_db`.`wpt_posts` ``).
     - **Safe Addon Scope**: Permits creating, altering, and dropping addon-owned tables (`wp_ecomos_*`).
2. **Documented Rollback & Migration Guard Contract (`docs/ecomos/operations/rollback.md`)**:
   - Added Section 6 ("Addon Migration Guard Contract & Core Table Constraints") specifying exact protected tables, prohibited DDL/DML operations, and data retention guarantees (`$retain_data = true`).
3. **Automated Verification Harness (`plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs`)**:
   - Added automated regex and contract tests asserting that all prohibited operations against core tables are blocked while permitted addon operations succeed.

---

## 3. Verification & Checks

- `node scripts/verify-restore.test.mjs`:
  - **23 passed, 0 failed (PASS)** across all restore isolation, fail-closed boundaries, and non-interference checks.
- `node --test plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs`:
  - **5 passed, 0 failed (PASS)** validating the core WordPress and WooCommerce migration guard contract.
- Full Vitest suite (`npm test`):
  - **602 passed across 67 test files (0 failures, PASS)**.
- Storefront Typecheck (`npm --prefix apps/storefront run typecheck`):
  - **0 errors (PASS)**.
- Engine Typecheck (`npm --prefix packages/ecom-engine run typecheck`):
  - **0 errors (PASS)**.
