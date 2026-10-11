# ECO-807 Staging Acceptance: Open Risks & Mitigations

- **Task**: `ECO-807`
- **Phase**: 8
- **Date**: 2026-10-10
- **Status**: Tracked & Controlled

> **Note (2026-10-11, ECO-1009)**: the rows below describe intended controls, not
> verified ones. No staging environment, WooCommerce instance or load test exists on
> this machine, so RSK-803 (concurrent guest checkout / HPOS / atomic stock) is an
> unverified design claim. RSK-804's Coming Soon page was never observed being served.
> Real browser measurements and the outstanding proofs are listed in
> `docs/ecomos/evidence/ECO-807/browser-measurement.md`.

---

## 1. Identified Risks & Boundary Mitigations

| Risk ID | Category | Description | Severity | Mitigation & Boundary |
| :--- | :--- | :--- | :--- | :--- |
| **RSK-801** | Regulatory | Client-supplied medical device registration certificates (DMP Maroc) pending physical reception. | High | **Enforced**: Unverified registration numbers remain strictly quarantined (`CLM-07`, `CLM-08` unpublished) until client delivers stamped documentation. |
| **RSK-802** | Payment | Merchant request for digital payment gateways (CMI / Payzone). | Medium | **Enforced**: Invariant blocks uncertified digital gateways (`allowedPaymentMethods: ['cod']`). Only certified Cash on Delivery is active at cutover. |
| **RSK-803** | Operations | High-concurrency guest checkout during promotional launch spikes. | Medium | **Enforced**: WooCommerce HPOS (High-Performance Order Storage) and atomic stock reservations prevent race conditions and duplicate orders. |
| **RSK-804** | Launch Transition | Premature DNS or CDN routing switch prior to merchant sign-off. | Critical | **Enforced**: Independent Coming Soon page remains actively served; cutover requires separate authorized runbook execution (`PARALOCA_CUTOVER.md`). |

---

## 2. Risk Acceptance & Gate 8 Readiness

All open risks are either architecturally mitigated (disabled customer accounts, certified COD only) or quarantined behind explicit policy gates. No unmitigated critical risks block Phase Gate 8.
