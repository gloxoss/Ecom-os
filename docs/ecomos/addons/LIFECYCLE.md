# EcomOS Addon Lifecycle & Reversible Migrations

## 1. Overview & Principles

EcomOS addons follow a strict, deterministic lifecycle designed for high reliability, operational safety, and reversible deployments.

### Core Architectural Invariants:
1. **Idempotence**: Installing or migrating an addon multiple times produces identical, safe database states.
2. **Reversibility**: Every schema change (`up`) must provide an explicit, tested rollback step (`down`).
3. **Core Data Protection**: No addon migration is ever permitted to `DROP`, `ALTER`, or mutate core WooCommerce or WordPress tables (`wp_posts`, `wp_postmeta`, `wp_wc_orders`).
4. **Data Retention on Deactivation**: By default, deactivating an addon preserves its domain tables and configuration so that store history is not lost upon toggling off.
5. **Billing Decoupling**: Paid license tier status is purely commercial metadata and does not bypass local engine capability verification.
6. **Graceful Degradation**: If an active addon directory is removed from the filesystem, EcomOS detects the missing module, disables its registration, and prevents fatal PHP runtime crashes.

---

## 2. Lifecycle States & Transitions

```text
       +------------------+
       |   UNINSTALLED    |
       +------------------+
                 |
                 | ecomos_addon_install()
                 v
       +------------------+
       |    INSTALLED     | <-------------------------+
       +------------------+                           |
                 |                                    |
                 | ecomos_addon_migrate_up()          | ecomos_addon_rollback_down()
                 v                                    |
       +------------------+                           |
       |     MIGRATED     | --------------------------+
       +------------------+
                 |
                 | enable (via registry)
                 v
       +------------------+       disable        +------------------+
       |      ACTIVE      | -------------------> |     DISABLED     |
       +------------------+                      +------------------+
                 ^                                        |
                 +----------------- re-enable ------------+
                               (retained data preserved)
```

---

## 3. Migration Safety & Sandboxing

### SQL Validation Rules:
The lifecycle runner executes safety regex scans on all migration queries:
- Rejects any query matching `\b(DROP|ALTER)\s+TABLE\s+(wp_)?(posts|postmeta|wc_orders)\b`.
- Violations immediately abort migration execution and return an explicit error.

---

## 4. Disaster Recovery & Rollback Procedure

If an addon deployment causes operational issues:
1. **Deactivate Addon**:
   ```bash
   wp eval "ecomos_addon_deactivate('target-addon');"
   ```
2. **Rollback Migrations**:
   ```bash
   wp eval "ecomos_addon_rollback_down('target-addon', $migrations, '0.0.0');"
   ```
3. **Verify Core Integrity**:
   - Access WooCommerce HPOS order screen (`/wp-admin/admin.php?page=wc-orders`).
   - Confirm order count, items, and billing data remain intact.
