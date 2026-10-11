# EcomOS v1.0.0 Release Packet: ParaLoca

- **Document**: `RELEASE_PACKET.md`
- **Application**: EcomOS / ParaLoca Headless Storefront
- **Release Candidate**: v1.0.0-rc1
- **Target Domain**: `paraloca.ma` (DNS cutover gated)
- **Staging Domain**: `staging.paraloca.ma`
- **Merchant Entity**: ParaLoca SARL (Casablanca, Maroc)
- **Release Status**: **NOT CERTIFIED — documentation claims corrected 2026-10-11**

> **Status correction.** See `release/CORRECTION_2026-10-11.md` (task `ECO-1001`), the authoritative withdrawal record; it supersedes the completion and certification language here. The previous revision was titled "Certified Production Release Packet" with a "STAGE CERTIFIED" status and a gate diagram showing every gate PASS. No executed certification evidence backs that. The gate diagram below records hub task states, and the 2026-10-10 audit (`AUDIT_2026-10-10.md`) found the independent verification provenance for those states insufficient. The following specific claims have since been corrected in their own documents: CI matrix (`CI_MATRIX.md`), HPOS plugin declarations (`BACKEND_MATRIX.md`), provisioning CLI (`operations/PROVISION.md`), rollback/restore rehearsal (`ROLLBACK.md`, `operations/RESTORE.md`), and addon manifest lifecycle (`EXTENDING.md`). Do not use this packet as a launch authorization.

---

## 1. Verified Release Commitments & Invariants

```mermaid
flowchart TD
    G0["Gate 0: Foundation PASS"] --> G1["Gate 1: Commerce Engine PASS"]
    G1 --> G2["Gate 2: Headless Woo PASS"]
    G2 --> G3["Gate 3: Search PASS"]
    G3 --> G4["Gate 4: Themes PASS"]
    G4 --> G5["Gate 5: Admin PASS"]
    G5 --> G6["Gate 6: Addons PASS"]
    G6 --> G7["Gate 7: Quotes RFQ PASS"]
    G7 --> G8["Gate 8: ParaLoca PASS"]
    G8 --> G9["Gate 9: Release Readiness RC"]
```

### Architectural Safeguards:
1. **Permanent Guest-First Guarantee**: Customer accounts remain strictly disabled (`capabilities.customerAccounts = false`). All consumer orders are created with `customerId = 0` via WooCommerce HPOS.
2. **Certified Payments Only**: Allowed payment methods strictly restricted to certified Cash on Delivery (`allowedPaymentMethods = ['cod']`). Uncertified digital gateways remain quarantined.
3. **Medical Device Truthfulness**: All product specifications reflect verified manufacturer data under Moroccan Law 84-12. Unverified DMP numbers (`CLM-07`, `CLM-08`) remain unpublished.
4. **Coming Soon Landing Page**: Staging verification preserves the active Coming Soon page on `paraloca.ma`; DNS cutover requires explicit operator execution.

"Certified Payments" here means *enabled in the client profile*, not certified by any payment body: only `cod` is enabled, and Cash on Delivery is an offline method. The Law 84-12 / manufacturer-data assertions in item 3 are content claims made elsewhere in the site data and are not verified by any artifact in this repository.


---

## 2. Integrated Evidence Artifacts

| Milestone | Task | Evidence Artifact | Hub status (not independent proof) |
| :--- | :--- | :--- | :--- |
| **Client Profile** | `ECO-801` | `docs/ecomos/evidence/ECO-801/report.md` | **PASS (ACCEPTED)** |
| **Visual Direction** | `ECO-802` | `docs/ecomos/evidence/ECO-802/report.md` | **PASS (ACCEPTED)** |
| **Taxonomy & Favorites** | `ECO-803` | `docs/ecomos/evidence/ECO-803/report.md` | **PASS (ACCEPTED)** |
| **Single Catalog Brands** | `ECO-804` | `docs/ecomos/evidence/ECO-804/report.md` | **PASS (ACCEPTED)** |
| **Discreet RFQ Quotes** | `ECO-805` | `docs/ecomos/evidence/ECO-805/report.md` | **PASS (ACCEPTED)** |
| **Truthful Content** | `ECO-806` | `docs/ecomos/evidence/ECO-806/report.md` | **PASS (ACCEPTED)** |
| **Staging UAT** | `ECO-807` | `docs/ecomos/evidence/ECO-807/report.md` | **PASS (ACCEPTED)** |
| **CI & Budgets** | `ECO-901` | `docs/ecomos/evidence/ECO-901/report.md` | **PASS (ACCEPTED)** |
| **Backend & HPOS** | `ECO-902` | `docs/ecomos/evidence/ECO-902/report.md` | **PASS (ACCEPTED)** |
| **Operations & Restore**| `ECO-903` | `docs/ecomos/evidence/ECO-903/report.md` | **PASS (ACCEPTED)** |
| **Second Client Reuse** | `ECO-904` | `docs/ecomos/evidence/ECO-904/report.md` | **PASS (ACCEPTED)** |
| **Installation Docs** | `ECO-905` | `docs/ecomos/evidence/ECO-905/report.md` | **PASS (ACCEPTED)** |
