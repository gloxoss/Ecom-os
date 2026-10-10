# EcomOS approved execution plan

Owner approved the local-development order on **2026-10-10**. Planning is complete; application completion remains evidence-driven. [Approval scope](APPROVAL.md).

## What we are building

A reusable guest-first WooCommerce platform, proved on two independent clients. ParaLoca is the French/MAD/Morocco client, with an optional separate guest RFQ workflow.

## Execution order

1. Reconcile rescue evidence and complete accurate catalog mapping/query/UI/brands.
2. Prove real guest sessions, authoritative cart, shipping/tax, COD and owned order access.
3. Deliver shared search, reusable themes/content/SEO and native WordPress merchant operations.
4. Prove addon compatibility/on-off behavior, then the separate guest quote workflow.
5. Configure ParaLoca, approve actual content/policy and pass French mobile/desktop UAT.
6. Prove two independent clients, CI/security/restore/rollback and a reviewable release packet.

Full phase outcomes, decisions and concurrency rules: [ROADMAP.md](ROADMAP.md).

## Boundaries that travel with the plan

- Woo owns prices, currency, stock, shipping, tax, orders and payment state.
- Customer accounts and uncertified Stripe/CMI stay off; COD-only is valid.
- Quotes never overwrite the normal cart. Client branding stays outside generic commerce.
- Missing browser proof withholds runtime/release certification. An exposed P0 blocks activation.
- Open decisions D-01..D-08 are scoped; production cutover requires its own explicit approval.

## Plan and evidence

- **51 active sections, 170 steps, 58 original ECO units, 59 mapped requirements.**
- [Active index](sections/index.md), [machine-readable manifest](active-plan.json), [traceability](VALIDATE.md).
- [Run audit](../docs/ecomos/AUDIT_2026-10-10.md): recorded Phase 0 gate is real; production-browser and exact-SHA execution evidence have gaps.
- Structural/DAG/file-bound checks passed; a separate reviewer parsed all 170 task blocks.
- Historical plans are preserved and superseded, including mandatory accounts, Vendure and Angelina assumptions.

## Follow progress

Run from **Ecom-os**:

```powershell
node .ultraplan/scripts/status.mjs
node .ultraplan/scripts/validate.mjs
```

[Tracking instructions](TRACKING.md) define exact-SHA evidence, slice IDs and independent verification. The hub is the only live task board; accepted counts are not production-readiness percentages.

Latest observed at 12:20 UTC: **Core 11/44, RFQ 0/7, ParaLoca 0/7** accepted units. ECO-103 is accepted, ECO-105 is already assigned/in progress, Phase 1 remains ungated. Run status for newer changes.

## Next handoff

Coordinate the existing catalog owner. Check residual ECO-102 completeness and live fixture proof alongside current brand/query work before Phase 1 acceptance. Use bounded claims and independent exact-SHA checks; do not assign competing work to held files.
