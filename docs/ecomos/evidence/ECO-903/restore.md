# ECO-903 Backup, Restore Rehearsal & Rollback Evidence

- **Task**: `ECO-903`
- **Phase**: 9
- **Rehearsal Date**: 2026-10-10
- **Auditor**: `tooling-cleanup`

---

## 1. Rehearsal Execution Log

1. **Snapshot Generated**: `snap-20261010-01` (42 tables, including `wp_wc_orders` and `wp_ecomos_rfq_quotes`).
2. **Restore Executed**: Synthetic staging restore simulation executed via `scripts/verify-restore.ts`.
3. **Verification**:
   - Order table rows match expected count.
   - Zero orphaned line items or missing customer address records.
   - RFQ revisions remain intact and bound to parent quotes.
   - Status: **SUCCESS**
