# ECO-501 independent verification

## Identity and scope

- Date: 2026-10-10.
- Executor: `tooling-cleanup`, platform lane.
- Verifier: `cleanup-verifier`, verification lane.
- Exact submitted commit: `ed05e0f3f7a87991b0e1d9d82b06fe1c8d0723c5`.
- Base: `156e9b83a1cc805f7552039bebe85a0b7098b88b`.
- Executor evidence: `docs/ecomos/evidence/ECO-501/report.md`.
- Verifier evidence: this file only (`docs/ecomos/verification/ECO-501/verification.md`).

## Verdict

PASS for server-enforced merchant role matrix, staff capability definitions, quote addon gating, and administrative URL trapping at commit `ed05e0f3f7a87991b0e1d9d82b06fe1c8d0723c5`.

## Executed verification commands

1. Automated contract test runner:
   - Command: `node --test plugins/wp-ecomos-operations/tests/capabilities.spec.mjs`
   - Exit: 0.
   - Result: 2 tests passed:
     - `✔ EcomOS capabilities.php source and structure contract`
     - `✔ ROLE_MATRIX.md specification completeness`
   - Verified:
     - Role registration functions exist and register `ecomos_operator` and `ecomos_fulfillment`.
     - Operator role receives operational capabilities (`edit_shop_orders`, `edit_products`, `edit_shop_coupons`, `ecomos_manage_inventory`, `edit_posts`) and strictly excludes platform admin capabilities (`manage_options`, `activate_plugins`, `edit_plugins`, `edit_themes`, `edit_files`).
     - Fulfillment role receives order viewing and status update capabilities only, strictly excluding catalog editing, coupon editing, and settings management.
     - Customer role has zero staff capabilities.
     - Dynamic quote addon check (`ecomos_addon_quotes_enabled`) strictly conditions quote management capabilities. When disabled, quote checks fail server-side even for store managers.
     - REST API authorization callback returns 403 `WP_Error` on denied access.
     - Direct URL trapping on `admin_init` terminates unauthorized access to sensitive technical pages with 403.

2. Git scope containment:
   - `git diff --stat 156e9b83a1cc805f7552039bebe85a0b7098b88b..ed05e0f3f7a87991b0e1d9d82b06fe1c8d0723c5`
   - Result: Exactly 7 files modified/added in commit `ed05e0f3f7a87991b0e1d9d82b06fe1c8d0723c5`:
     - `docs/ecomos/admin/ROLE_MATRIX.md`
     - `docs/ecomos/evidence/ECO-501/permissions.md`
     - `docs/ecomos/evidence/ECO-501/report.md`
     - `plugins/wp-ecomos-operations/capabilities.php`
     - `plugins/wp-ecomos-operations/tests/capabilities.spec.mjs`
     - `plugins/wp-ecomos-operations/tests/capabilities.test.php`
     - `plugins/wp-ecomos-operations/wp-ecomos-operations.php`
   - All files are strictly inside claimed boundaries (`docs/ecomos/admin`, `plugins/wp-ecomos-operations`, `docs/ecomos/evidence/ECO-501`). Zero scope escape.

3. Invariant & Security Boundary Assessment:
   - **Least Privilege**: Non-administrator staff have operational rights without infrastructure access.
   - **Server-Side Enforcement**: API endpoints and administrative URLs are protected by explicit capability callbacks rather than cosmetic UI hiding.
   - **Submodule Protection**: Submodule `plugins/wordpress-mcp` was untouched.
