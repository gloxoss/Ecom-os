# EcomOS Database & State Restoration Runbook

- **Document**: `RESTORE.md`
- **Application**: EcomOS Disaster Recovery & Rollback
- **Version**: 1.1.0
- **Status**: UNREHEARSED PLAN — no restore has been executed or rehearsed. The recovery targets below are objectives, not measured results. The one script referenced here is a simulator, not an integrity check (section 3). See `release/CORRECTION_2026-10-11.md` for the withdrawal record.

---

## 1. Objectives (targets, not measurements)

- **Recovery Point Objective**: `< 1 hour`
- **Recovery Time Objective**: `< 15 minutes`
- **Systems in scope**: MySQL (HPOS orders, catalog, RFQ custom tables), object cache, static assets.

These numbers have not been validated by a drill. `STAGING_SETUP.md` records explicitly that "Restore has not been rehearsed."

---

## 2. Restoration procedure

1. **Safety halt**: stop traffic to the storefront (maintenance page at the edge or by taking the deployment offline). No maintenance-mode feature exists in the application source; this must be done at the hosting/CDN layer.
2. **Locate snapshot**: identify the latest validated database dump (e.g. the WP-CLI export described in `STAGING_SETUP.md`, stored outside the repository).
3. **Restore the database**:
   ```bash
   mysql -u <user> -p <database> < backup_snapshot.sql
   ```
   Replace the placeholders with the target site's real values; there is no `ecom_user`/`ecom_db` account defined by this repository.
4. **Verify integrity manually** (see section 3 for why the shipped script does not do this):
   - Confirm HPOS order table count matches the pre-restore count.
   - Confirm guest orders (`customer_id = 0`) retain order keys and line items.
   - Spot-check one known order through WP-CLI (`scripts/verify-local-order.php <order-id>` on the Local baseline site).
5. **Flush the cache**:
   ```bash
   wp cache flush
   ```
6. **Resume traffic**: restore normal routing.

---

## 3. The `verify-restore.ts` script is a simulator

`scripts/verify-restore.ts` exports `simulateRestoreRehearsal()` and, when run, feeds it a **hard-coded** `sampleSnapshot` (42 tables, `hposOrdersVerified: true`) and prints a JSON result. It reads no dump, queries no database, and compares nothing against pre-disaster state.

```bash
npx tsx scripts/verify-restore.ts   # prints a fabricated PASS for a sample object
```

Do not cite its output as proof that a restore preserved orders. A real check must query the restored database (table counts, order rows, line items) and compare against a recorded baseline.

---

## 4. Handling secrets

Backups and environment files contain credentials and customer data. `STAGING_SETUP.md` records the baseline backups as private, non-committable artifacts. Never commit or attach a dump, `.env.local`, or `wp-config.php` to a report. If a restore reverts the database to before a connector user was created, the existing storefront `WC_REST_KEY`/`WC_REST_SECRET` and `ECOM_OS_ENCRYPTION_KEY` in `.env.local` will no longer match the restored WordPress state; reissue them and update the environment file.
