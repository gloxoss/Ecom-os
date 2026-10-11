# ParaLoca Production Cutover & Launch Runbook

- **Document**: `PARALOCA_CUTOVER.md`
- **Application**: EcomOS / ParaLoca Storefront
- **Client**: ParaLoca SARL (`paraloca.ma`)
- **Staging Domain**: `staging.paraloca.ma`
- **Production Domain**: `paraloca.ma`
- **Current Status**: **PLAN ONLY — INFRASTRUCTURE UNVERIFIED (corrected 2026-10-11)**
- **Prerequisite**: Explicit signed production launch authorization (Phase 9 / `ECO-906`)

> **Status correction.** Nothing in this repository configures or references the infrastructure this runbook assumes: no Cloudflare/edge configuration, no `staging.paraloca.ma` or `api.paraloca.ma` records, no Redis (the only Redis references in the tree are inside the vendored `plugins/wordpress-mcp` submodule), and the search providers are not wired into the storefront (`INSTALL.md` section 7). The `paraloca.ma` hosts below are the intended targets from the client profile (`clients/paraloca/profile.ts`), not configured systems. Every step must be mapped to the real hosting stack before it can be executed.

---

## 1. Architectural Guardrails & Invariants

1. **Independent Coming Soon Page**: The standalone Coming Soon landing page remains active on the apex domain `paraloca.ma` throughout all staging and verification phases. It is **never** removed or superseded until final authorized cutover.
2. **Guest-First Policy**: Customer registration and user accounts remain permanently disabled (`capabilities.customerAccounts: false`).
3. **Certified Payment Gateways**: Only certified payment methods (`allowedPaymentMethods: ['cod']`) are active. Digital gateways (CMI, Stripe, etc.) remain disabled pending formal PCI-DSS/merchant certification.
4. **Zero Dirty Submodule Modifications**: Core platform submodules (`plugins/wordpress-mcp`) must never be modified or deployed with unverified changes.

---

## 2. Cutover Execution Sequence (Execute ONLY upon Authorization)

### Step 1: Pre-Cutover Verification (T-60 Minutes)
1. Verify latest production database migration status:
   - HPOS tables active and synchronized
   - Custom post types (`rfq_quote`) verified
2. Confirm Redis object caching and search indices (Typesense / Meilisearch / Native Woo fallback) healthy. **Not applicable as written**: no Redis and no search index are configured by this repository; search providers exist in code but are not wired in.
3. Validate SSL certificates for `paraloca.ma` and `api.paraloca.ma`. **Unverified**: neither hostname is configured here, and there is no `api.paraloca.ma` service in the source.

### Step 2: Traffic Routing & Edge Cutover (T-0 Minutes)
1. Update Cloudflare / DNS edge routing rule:
   - Transition route `paraloca.ma/*` from Coming Soon static origin to Next.js Storefront origin cluster.
2. Purge edge cache for root route (`/`) and primary catalog routes (`/catalog`, `/brands`).
3. Verify incoming traffic returns HTTP 200 with `fr-MA` localized ParaLoca storefront shell.

### Step 3: Post-Cutover Sanity Checks (T+15 Minutes)
1. Execute live smoke purchase on production with internal test COD address in Casablanca.
2. Verify order appears in WooCommerce HPOS with `customerId: 0` (guest order) and status `processing`.
3. Submit a discreet healthcare RFQ (`/devis`) and verify receipt in WordPress RFQ admin queue.
4. Confirm no customer account login buttons or registration forms are exposed.

---

## 3. Rollback Procedure (Emergency Reversal)

If severe anomalies or payment/order discrepancies occur during cutover:
1. **Immediate DNS/Edge Revert**: Switch Cloudflare routing rule for `paraloca.ma/*` back to static Coming Soon origin (instant TTL ≤ 30s).
2. **Session Drainage**: Allow in-flight checkout orders to finish processing in WooCommerce.
3. **Incident Logging**: Record incident details in `.agent-hub` and alert technical orchestrator.
