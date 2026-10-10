# EcomOS Database & State Restoration Runbook

- **Document**: `RESTORE.md`
- **Application**: EcomOS Disaster Recovery & Rollback
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Objectives & Recovery Point Targets

- **Recovery Point Objective (RPO)**: $< 1\text{ hour}$
- **Recovery Time Objective (RTO)**: $< 15\text{ minutes}$
- **Target Systems**: MySQL Database (HPOS orders, catalog, RFQ custom tables), Redis cache, static assets.

---

## 2. Restoration Procedure

1. **Safety Halt**: Put Next.js Storefront in maintenance mode by serving static maintenance page at CDN edge.
2. **Snapshot Extraction**: Locate latest validated snapshot archive in encrypted off-site S3/MinIO bucket.
3. **Database Restore**:
   ```bash
   mysql -u ecom_user -p ecom_db < backup_snapshot.sql
   ```
4. **Integrity Validation**:
   - Run `npx tsx scripts/verify-restore.ts`.
   - Verify HPOS orders table count matches pre-disaster record.
   - Confirm guest orders (`customer_id = 0`) preserve order keys and line items.
5. **Flush Object Cache**:
   ```bash
   wp cache flush
   ```
6. **Resume Traffic**: Switch CDN routing rule back to normal storefront origin.
