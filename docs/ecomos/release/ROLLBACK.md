# EcomOS Rollback Runbook

- **Document**: `ROLLBACK.md`
- **Application**: EcomOS / ParaLoca Storefront
- **Version**: 1.1.0
- **Status**: UNEXERCISED PLAN — no deployment has been performed from this repository, and none of the edge/hosting infrastructure named below is configured by repository code. Treat every step as a checklist to adapt to the real hosting environment, not as verified procedure. See `release/CORRECTION_2026-10-11.md` for the withdrawal record.

---

## 0. Prerequisites that do not exist yet

This repository contains no deployment target, no CDN configuration, no DNS record and no "coming soon" origin. The earlier revision of this runbook named a specific production domain and origin host as if they were configured. Nothing in the source or CI sets those up: the CI workflow only builds the storefront with placeholder backend URLs, and no workflow deploys.

Before this runbook is usable, the operator must supply and record: the hosting platform, the DNS/edge provider, the previous-known-good deployment identifier, and how traffic is switched. Fill those in; do not read the example values below as real.

---

## 1. Trigger conditions

Consider rollback when any of the following is observed in the deployed environment:

1. Cash-on-Delivery orders failing to record in WooCommerce.
2. Exposure of backend credentials, encryption keys, or customer data.
3. Improper exposure of account login/registration surfaces (these are disabled by design; exposure is a defect).
4. Sustained severe latency or error rate beyond the operator's SLO.

---

## 2. Rollback sequence (skeleton)

Times are objectives, not measured.

1. **Revert traffic (T+0)**: point the edge/DNS routing rule for the production hostname back to the previous-known-good origin, then purge the edge cache for affected URLs. (`Cloudflare`/"Coming Soon origin" were used as filler examples in a previous revision; substitute the real provider and origin.)
2. **Confirm**: request the production URL and confirm it serves the reverted origin before declaring the revert complete.
3. **Drain**: let in-flight checkouts finish. On the backend, `wp db check` only validates the MySQL tables; it does not confirm order correctness.
4. **Capture**: collect Next.js server logs and WooCommerce logs (`wp-content/uploads/wc-logs/`) for the incident.
5. **Record**: write the postmortem under `docs/ecomos/` (or the hub incident path) and notify the orchestrator.

---

## 3. Database and plugin rollback

Traffic reversion does not undo data changes. If a plugin activation or migration caused the incident, follow `docs/ecomos/operations/RESTORE.md` (unrehearsed) and `docs/ecomos/addons/LIFECYCLE.md` for reversible addon migrations. Deactivating a plugin does not roll back the WooCommerce database changes it made.

---

## 4. What is not proven

- No rollback drill has been executed.
- No production deployment has occurred, so no rollback of one has occurred.
- The latency/error thresholds and the five-minute target are unvalidated objectives.
