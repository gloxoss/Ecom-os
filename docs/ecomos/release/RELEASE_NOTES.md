# EcomOS v1.0.0 Release Notes: ParaLoca Candidate

- **Version**: `1.0.0`
- **Release Date**: 2026-10-10
- **Client**: ParaLoca SARL (`paraloca.ma`)
- **Status**: **CANDIDATE — CLAIMS QUALIFIED 2026-10-11; NOT LAUNCH-AUTHORIZED**

> **Status correction.** See `release/CORRECTION_2026-10-11.md` (task `ECO-1001`), the authoritative withdrawal record. The previous revision asserted certifications and measured performance that no artifact in this repository supports; the specific claims are qualified inline below. For the corrected CI, HPOS, provisioning and rollback positions see `CI_MATRIX.md`, `BACKEND_MATRIX.md`, `operations/PROVISION.md`, `ROLLBACK.md` and `operations/RESTORE.md`.

---

## 1. Executive Summary

EcomOS v1.0.0 is a modular, dual-engine (WooCommerce | Vendure | Fake) headless e-commerce starter, configured here for ParaLoca's medical and home-care equipment catalog. It has not been certified for that catalog.

Milestones, stated as implemented features rather than measured outcomes:

- **Headless Next.js storefront**: Next.js App Router with React Server Components. The p95-under-5ms and WCAG AAA figures asserted by earlier revisions are **unmeasured** and have been removed; no browser or lighthouse pass is retained.
- **Architectural invariants**: guest-first checkout (`customer_id = 0`), no forced account registration, and only `cod` enabled as a payment method — all present in `clients/paraloca/profile.ts`.
- **RFQ / quoting**: a TypeScript domain package (`packages/addons-rfq`) and a WordPress plugin (`plugins/wp-ecomos-rfq`). The TypeScript package does **not** yet ship the `manifest.json` the build generator requires, so it cannot currently be enabled as an addon (`EXTENDING.md` section 3.5).
- **Multi-client profiles**: `paraloca` and `demo-2` profiles and themes exist and are unit-tested. "Proven" in the previous revision overstated this — no browser pass across both clients is retained.
- **Coming Soon gate**: production cutover is held behind operator authorization (`PARALOCA_CUTOVER.md`, now marked plan-only).

---

## 2. Security & Compliance Highlights

- **Moroccan Law 84-12 & Law 31-08**: content-level claims held in site data. No compliance dossier in this repository certifies them.
- **Cryptographic access control**: constant-time HMAC guest order-grant tokens via `ORDER_ACCESS_SECRET`, failing closed in production (`apps/storefront/src/lib/commerce/order-access.ts`). Secret redaction in logs is implemented.
- **Content Security Policy**: nonce-based CSP with `frame-ancestors 'none'` is implemented in source; it has not been verified against a running production server or browser (see the 2026-10-10 audit, finding `A-01`).
- **HPOS**: designed for WooCommerce High-Performance Order Storage. The shipped plugins do **not** declare `custom_order_tables` compatibility — that claim was withdrawn (`BACKEND_MATRIX.md` section 2).

