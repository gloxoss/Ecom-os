# ECO-603: Reversible Addon Lifecycle, Migrations, and Data Retention

## Summary
Implemented the WordPress addon lifecycle manager (`plugins/wp-ecomos-addons/lifecycle.php`), supporting idempotent installation, versioned up/down migrations, safe rollback, core WooCommerce table protection, data retention on deactivation, and graceful handling of missing addon files.

## Scope & Claimed Paths
- `plugins/wp-ecomos-addons/` (including `lifecycle.php`, `wp-ecomos-addons.php`, `tests/lifecycle.test.php`, `tests/lifecycle.spec.mjs`)
- `docs/ecomos/addons/LIFECYCLE.md`
- `docs/ecomos/evidence/ECO-603/` (including `restore.md`, `report.md`)

## Key Implementations & Invariants
1. **Idempotent Installation & Migration (`lifecycle.php`)**:
   - `ecomos_addon_install()` safely records addon manifests in `ecomos_installed_addons`.
   - `ecomos_addon_migrate_up()` tracks applied migrations and skips previously executed versions on repeated runs.
2. **Reversible Rollback (`ecomos_addon_rollback_down`)**:
   - Rolls back applied migrations in reverse version order down to the requested target version.
3. **Core Data Protection Guard**:
   - Analyzes all SQL migration queries and rejects any statements attempting to `DROP` or `ALTER` core WooCommerce or WordPress tables (`wp_posts`, `wp_postmeta`, `wp_wc_orders`).
4. **Data Retention on Deactivation (`ecomos_addon_deactivate`)**:
   - Defaults to `retain_data = true`, preserving custom tables and options for future reactivation while revoking active capabilities and routes.
5. **Missing-Addon Graceful Degradation (`ecomos_addon_verify_integrity`)**:
   - Scans active addons against the local filesystem. If an addon directory is deleted, automatically deactivates registration to prevent fatal PHP crashes.
6. **Billing Decoupling**:
   - Separates commercial licensing fields from local capability enablement.

## Executed Verification Commands
```bash
node --test plugins/wp-ecomos-addons/tests/lifecycle.spec.mjs
```
Output:
```text
✔ lifecycle.php functions and contracts
✔ Core WooCommerce data protection invariant
✔ Data retention on deactivation contract
✔ wp-ecomos-addons.php entrypoint includes lifecycle.php
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
```
