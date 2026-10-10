# EcomOS Production Rollback Runbook

- **Document**: `ROLLBACK.md`
- **Application**: EcomOS / ParaLoca Storefront
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Emergency Trigger Conditions

An emergency rollback must be initiated immediately if any of the following occur during or after launch:
1. **Critical Payment Defect**: Failure of Cash on Delivery order recording in WooCommerce HPOS.
2. **Security Vulnerability**: Exposure of internal backend credentials, encryption keys, or customer PII.
3. **Session or Account Collision**: Exposure of customer account login or registration prompts.
4. **Catastrophic Latency**: p95 storefront response latency $> 2000\text{ ms}$ or error rate $> 1\%$.

---

## 2. Rapid Rollback Sequence ($\le 5$ Minutes)

### Phase 1: Edge Traffic Reversion (T+0 to T+60 Seconds)
1. In Cloudflare / Edge DNS dashboard, switch the routing rule for `paraloca.ma/*` back to the static Coming Soon origin:
   - Origin target: `coming-soon.internal`
   - Cache purge: Purge edge cache for all URLs (`*`).
2. Immediate verification:
   ```bash
   curl -I https://paraloca.ma
   ```
   Confirm HTTP 200 serving static Coming Soon page.

### Phase 2: Session & Transaction Drainage (T+60 to T+180 Seconds)
1. Allow existing in-flight checkout orders in WooCommerce to complete.
2. Verify WooCommerce database lock status:
   ```bash
   wp db check
   ```

### Phase 3: Root Cause Logging & Incident Escalation (T+180 to T+300 Seconds)
1. Capture Next.js server error logs and WooCommerce error logs (`wp-content/uploads/wc-logs/`).
2. Log postmortem incident report in `.agent-hub/` and notify technical orchestrator.
