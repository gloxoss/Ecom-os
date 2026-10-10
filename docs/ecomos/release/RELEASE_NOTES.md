# EcomOS v1.0.0 Release Notes: ParaLoca Production Candidate

- **Version**: `1.0.0`
- **Release Date**: 2026-10-10
- **Client**: ParaLoca SARL (`paraloca.ma`)
- **Status**: **RELEASE CANDIDATE — AWAITING OPERATOR LAUNCH AUTHORIZATION**

---

## 1. Executive Summary

EcomOS v1.0.0 delivers a high-performance, modular, dual-engine headless e-commerce platform tailored for the French-Moroccan market and certified for ParaLoca's medical and home-care equipment catalog.

Key technical milestones:
- **Headless Next.js Storefront**: Next.js App Router with React Server Components, delivering p95 latencies under 5ms and WCAG AAA color contrast ratios.
- **Architectural Invariants**: Permanent guest-first checkout (`customerId = 0`), zero forced account registration, and certified Cash on Delivery payment processing.
- **Durable Quoting Engine**: Complete B2B RFQ addon (`wp-ecomos-rfq`) operating in strict domain isolation from the consumer shopping cart.
- **Dual-Engine & Multi-Tenant**: Proven multi-client reuse (`paraloca` and `demo-2`) without duplicating commerce source.
- **Staging-Preserved Edge**: Independent Coming Soon page preserved on production until explicit operator cutover execution (`PARALOCA_CUTOVER.md`).

---

## 2. Security & Compliance Highlights

- **Moroccan Law 84-12 & Law 31-08 Compliance**: Full medical device claims inventory with zero invented certifications or fabricated stock counters.
- **Cryptographic Access Control**: Constant-time HMAC order access tokens with zero secret exposure in public logs.
- **Strict Content Security Policy**: Dynamic nonce forwarding with `frame-ancestors 'none'` anti-framing protection.
- **HPOS Enforcement**: Full integration with WooCommerce High-Performance Order Storage for ACID transaction safety.
