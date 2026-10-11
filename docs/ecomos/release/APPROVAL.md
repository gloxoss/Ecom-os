# ParaLoca Launch Approval & Authorization Record

- **Document**: `APPROVAL.md`
- **Application**: EcomOS / ParaLoca Storefront
- **Release Version**: `v1.0.0`
- **Target Domain**: `paraloca.ma`
- **Date**: 2026-10-10
- **Status**: **NOT VERIFIED — claims corrected 2026-10-11**

---

## 0. Status correction (2026-10-11)

See the authoritative withdrawal record `release/CORRECTION_2026-10-11.md` (task `ECO-1001`), which supersedes this document's completion language.

An earlier revision of this record marked the checklist below as passed and described the release as "PRE-LAUNCH VERIFIED". A source audit plus this documentation pass found several of those items unsupported:

- Rollback and restore runbooks were **never rehearsed**. `ROLLBACK.md` is an unexercised plan and `RESTORE.md`'s integrity script is a hard-coded simulator. The "Emergency Rollback Tested" item is therefore unchecked.
- The CI matrix claim was broader than the workflow. `.github/workflows/ci.yml` runs a single job and single build with `ADDONS=""`; see the rewritten `CI_MATRIX.md`.
- HPOS compatibility is **not declared** in the shipped plugins; the previous claim rested on test fixtures. See `BACKEND_MATRIX.md`.
- Client provisioning has no runnable command. See `operations/PROVISION.md`.
- Independent verification provenance for the earlier hub acceptances was itself flagged as not established by the 2026-10-10 audit (`AUDIT_2026-10-10.md`, finding `A-02`).

Do not treat this document as evidence of launch readiness.

---

## 1. Launch Prerequisite Checklist

- [ ] **Phase Gates 0 through 8 Passed** — recorded as accepted on the hub, but the 2026-10-10 audit (`A-02`) found the independent execution provenance insufficient to substantiate it.
- [ ] **Phase 9 Tasks ECO-901 through ECO-905 Passed** — partially overstated: the CI matrix, HPOS, and provisioning claims in those tasks do not match the source (see section 0).
- [x] **Design Invariants present in code**:
  - `customerAccounts = false` in the active client profile
  - `allowedPaymentMethods = ['cod']` in the active client profile
- [ ] **Emergency Rollback Tested** — not executed; `ROLLBACK.md` and `RESTORE.md` are unrehearsed.
- [x] **Coming Soon Invariant**: this record distinguishes staging approval from production launch and holds cutover behind operator authorization.


---

## 2. Authorization Sign-Off Boundary

Production launch execution (DNS cutover and traffic switch to `paraloca.ma`) will not be performed autonomously by any AI agent. It is held behind this explicit authorization record pending final human operator trigger.
