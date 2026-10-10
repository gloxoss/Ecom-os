# ECO-504: Merchant Task Runbook, QA Sample Workflows, and Permissions Tests

## Summary
Published the comprehensive merchant task runbook, platform operator technical runbook, and automated test suites verifying routine merchant jobs, negative permission gates, and addon off-state behavior.

## Scope & Claimed Paths
- `docs/ecomos/admin/` (including `MERCHANT_RUNBOOK.md`, `PLATFORM_RUNBOOK.md`)
- `plugins/wp-ecomos-operations/` (including `capabilities.php`, `tests/workflows.test.php`, `tests/workflows.spec.mjs`)
- `docs/ecomos/evidence/ECO-504/` (including `uat.md`, `report.md`)

## Key Implementations & Invariants
1. **Merchant Task Runbook (`docs/ecomos/admin/MERCHANT_RUNBOOK.md`)**:
   - Step-by-step instructions for routine order fulfillment, product catalog updates, stock inventory adjustments, promotions, and content editing.
   - Explains optional addon off-state behavior (storefront runs in direct purchase mode, quote cards suppressed).
   - Defines escalation paths for payment disputes, carrier issues, and server technical failures.
2. **Platform Administrator Runbook (`docs/ecomos/admin/PLATFORM_RUNBOOK.md`)**:
   - Defines system administration duties: plugin updates, payment gateway credentials, webhook secrets, database maintenance, and emergency deactivation/restore.
   - Enforces least privilege: technical secrets and PHP/theme file editors remain strictly restricted from store managers.
3. **Automated Workflow & Negative Permission Tests**:
   - `plugins/wp-ecomos-operations/tests/workflows.test.php`: PHP standalone test runner verifying positive workflows and negative security gates.
   - `plugins/wp-ecomos-operations/tests/workflows.spec.mjs`: Node.js contract test runner asserting runbook structure, least privilege mappings, and negative permissions (`manage_options`, `activate_plugins`, `edit_plugins`, `edit_themes`, `edit_files`).
4. **UAT & Permission Audit Ledger (`docs/ecomos/evidence/ECO-504/uat.md`)**:
   - Documents 7 accepted merchant workflows, 6 negative security boundary checks, and 4 addon off/on state audits.

## Executed Verification Commands
```bash
node --test plugins/wp-ecomos-operations/tests/workflows.spec.mjs
```
Output:
```text
✔ MERCHANT_RUNBOOK.md completeness and workflow guidance
✔ PLATFORM_RUNBOOK.md technical boundaries and secrets containment
✔ Role capability and negative permission matrices
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
```
