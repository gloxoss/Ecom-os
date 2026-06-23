# Milestones — Ecom OS v1

Calendar-driven view of the 16-week build. Dates are relative to project start (Day 0 = first commit). Sign-off is internal to EPIOSO except where a paying client is involved.

**Project start (Day 0):** TBD — anchor on first commit to `ecom-os` repo.

| # | Milestone | Target | Deliverables | Sign-off |
|---|---|---|---|---|
| M1 | Repo + Storefront baseline online | **End of Week 2** | Monorepo, Next.js 16 app serving "Hello Ecom OS", brand-config skeleton, CI green | Self (zakio) |
| M2 | `EcomEngine` + WC adapter feature-complete | **End of Week 4** | All adapter methods implemented + integration-tested against a sandbox WC instance | Self |
| M3 | Storefront baseline screens (S-01, S-10, S-11, S-12, S-20) live with real WC data | **End of Week 6** | Lighthouse ≥ 90 on `/`, LCP < 2.0s on simulated 3G | Self |
| M4 | i18n addon shipped (FR + AR + EN) | **End of Week 7** | Locale switcher works; AR is RTL; missing-key fallback verified | Self |
| M5 | **Internal staging deployment live** | **End of Week 8** | Full WC-engine flow on Hostinger staging URL, COD checkout working, AR locale working | Self · **GATE A (pilot client signal check)** |
| M6 | Multi-payment addon: COD + Stripe + CMI | **End of Week 11** | All three providers end-to-end on staging; security checklist passed for each | Self |
| M7 | Security hardening + v1 docs complete | **End of Week 12** | SR-* checklist passing; `setup.md`, `addon-authoring.md`, `deploy-runbook.md`, `security.md` written | Self |
| M8 | **First paying-client deployment** (or polished public demo if no client yet) | **End of Week 12** | Live URL, real or representative branding, end-to-end order placed | Self (+ Client if applicable) |
| M9 | Vendure server scaffold + adapter | **End of Week 14** | `docker compose up` brings up working Vendure; `EcomEngine` integration tests pass against both engines | Self |
| M10 | Vendure plugins for i18n + multi-payment | **End of Week 15** | Translation editing and CMI/Stripe/COD all working on a Vendure-engine staging | Self |
| M11 | Vendure-engine production-ready + visual regression parity | **End of Week 16** | Same storefront UX on both engines; visual diff suite shows zero engine-dependent deltas | Self |
| M12 | **v1.0.0 release** | **End of Week 16** | Git tag, CHANGELOG, EPIOSO portfolio entry, marketing material refreshed | Self |

---

## Gates

Two explicit decision gates from `01-business-case.md` §5:

### Gate A — End of Sprint B (Week 8)
**Question:** Is there a paying client signed, OR a credible warm pipeline (≥ 2 interested leads with confirmed budget)?
- **Yes** → proceed to Sprint C, ship multi-payment, deploy first client.
- **No** → defer Sprint D (Vendure engine). Spend Sprint C on (a) finishing multi-payment for a credible demo, (b) lead generation using the staging URL as proof. Reassess at Week 12.

### Gate B — End of Sprint C (Week 12)
**Question:** Has Milestone M8 (first paying-client deployment OR polished demo) succeeded AND is a Vendure-engine client realistically in pipeline?
- **Yes** → proceed to Sprint D as planned.
- **No** → pause Sprint D. Continue refining WC engine, building portfolio. Defer Vendure engine until a real client need exists.

This protects the second MAD 80K of investment from being sunk before the first engine has proven commercial demand.

---

## Calendar (illustrative — anchor when Day 0 is set)

```
Wk 1-2  : Sprint A start          → M1
Wk 3-4  : WC adapter             → M2
Wk 5-6  : Storefront baseline    → M3
Wk 7    : i18n addon             → M4
Wk 8    : Staging deploy + i18n  → M5    ★ GATE A
Wk 9-11 : Multi-payment build    → M6
Wk 12   : Security + docs        → M7
Wk 12   : First deployment       → M8    ★ GATE B
Wk 13-14: Vendure scaffold       → M9
Wk 15   : Vendure plugins        → M10
Wk 16   : Vendure parity + v1.0  → M11, M12
```

---

## Dependencies

- M1 → M2 → M3 → (M4, M5) → M6 → M7 → M8
- M5 unlocks Gate A
- M8 unlocks Gate B
- M9 → M10 → M11 → M12
- M3 unblocks parallel design / marketing work
- M5 (staging) unblocks early demo + pitching for pilot client

---

## Risk buffers

- Each sprint includes ~20% unallocated buffer (1 week in 4) for unexpected issues. Buffer is consumed in priority order: bug fixes → docs polish → next-step prep.
- If a sprint slips by > 1 week, escalate to Gate A/B early and reassess scope (drop, not delay).
