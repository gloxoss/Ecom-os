# Section 09 — Multi-Payment Addon (CMI · Stripe · COD)

> **Batch 6 · Risk: RED · Deps: 03, 06 · Tasks: 6 · Blueprint: Steps 16, 17, 18, 19 · Highest-risk component per threat model §3**

## Why this section exists
FR-070..076 + pre-dev PRD F-13/14/15/16: the multi-payment addon is **core v1**, not "soon after launch." It ships the `PaymentGateway` interface and three providers (COD already minimal in §06; this section formalizes it + adds Stripe + CMI). CMI is the single highest-risk component in the project (HMAC verification, replay protection, 3DS redirect).

## Requirements covered
- **FR-070** `PaymentGateway` interface: `initiate(order)`, `confirm(callback)`, `refund(orderId, amount)`
- **FR-071** three reference providers: `CmiGateway`, `StripeGateway`, `CashOnDeliveryGateway`
- **FR-072** providers enable-able via `PAYMENT_PROVIDERS=cmi,stripe,cod`
- **FR-073** checkout shows only enabled providers
- **FR-074** CMI: 3DS redirect + signed callback hash verification before marking paid
- **FR-075** Stripe: Payment Intents + webhook signature verification
- **FR-076** COD: `pending_confirmation` + merchant notification (built in §06, formalized here)
- **SR-VAL-005 / NFR-033** webhook signature mandatory before any state change

## Tasks
1. **Addon scaffold + interface** — `packages/addons-multi-payment/{register.ts,disable.ts,interface.ts,registry.ts}`. `PaymentGateway` interface. Registry reads `PAYMENT_PROVIDERS`, exposes only enabled gateways. Satisfies §03 addon contract. Checkout `PaymentProviderList` (from §06) reads this registry.
2. **COD provider (formalize)** — `providers/cod/`: promote the §06 COD logic into the addon. `initiate` → returns "pay on delivery"; `confirm` → marks `pending_confirmation`; notifications (email + WhatsApp) already built. Idempotent order creation (Discovery Q: duplicate webhook → no dup order).
3. **Stripe provider** — `providers/stripe/`: Stripe Elements + Payment Intents. `initiate` creates PI (amount from server-authoritative order total, idempotency key). Webhook handler `apps/storefront/src/app/api/webhooks/stripe/route.ts` verifies `Stripe-Signature` via official SDK (`constructEvent`) → `markOrderPaid`. Invalid signature → 400 + `signature_status=invalid` log (FR-075, threat model §3-S).
4. **CMI provider** — `providers/cmi/`: 3DS-secure form POST → CMI hosted page → signed callback. `hash.ts` computes HMAC with `CMI_STORE_KEY`; `callback.ts` recomputes + compares to `HASH` field. Mismatch → 400 + security event, **order NOT marked paid** (FR-074, threat model §3-S/T). Amount signed server-side; callback amount mismatch → reject. Route `app/api/webhooks/cmi/route.ts`.
5. **Replay protection + audit log** — every webhook (Stripe + CMI) appends to `ecom_webhook_delivery_log` (ERD §2, SR-LOG-003) with `signature_status` + raw payload. Dedupe: Stripe by event id, CMI by `oid + TransId` (threat model §3-T). Retain 12 months (SR-LOG audit).
6. **Provider health + end-to-end tests** — per-provider health check; if a gateway is unreachable, hide its option at checkout (don't block the page — NFR-011). E2E: test card succeeds for Stripe; CMI test transaction succeeds; tampered CMI HASH → 400 + order not paid; replayed callback → deduped.

## Inputs
- Section 03 (addon loader), Section 06 (checkout flow, `PaymentProviderList`, `markOrderPaid` on interface)
- Data-flow Flow 3 (CMI HMAC), threat model §3, security reqs SR-VAL-005/SR-CRYPT-004

## Outputs
- `packages/addons-multi-payment/{register,disable,interface,registry}.ts`
- `packages/addons-multi-payment/providers/{cod,stripe,cmi}/...`
- `apps/storefront/src/app/api/webhooks/{stripe,cmi}/route.ts`
- Webhook delivery log migration (WC plugin or storefront-owned table)
- E2E tests per provider

## Acceptance Criteria
- [ ] Checkout lists only providers in `PAYMENT_PROVIDERS`
- [ ] Stripe test card succeeds end-to-end; order marked paid only after verified webhook
- [ ] CMI test transaction succeeds; tampered HASH → 400 + `signature_status=invalid` + order NOT paid
- [ ] Replayed webhook (Stripe + CMI) deduped — no double mark, no dup orders
- [ ] Every webhook appends to `ecom_webhook_delivery_log` with signature status
- [ ] Down provider hidden from checkout; checkout still works with remaining providers
- [ ] No card data ever touches Ecom OS code (CMI hosted page, Stripe Elements) — static analysis rule passes
- [ ] All money in minor units throughout (no floats)

## Skills to load
`api-design-principles` (gateway interface), `api-security-best-practices` (webhook verification, HMAC), `owasp-top-10`, `woocommerce` (WC order creation), `threat-modeling-expert`, `stride-analysis-patterns`

## Risks / notes
- **🔴 CMI is poorly documented and needs a real merchant account for end-to-end testing** (charter §8, Risk R-03). Start CMI credential outreach **now** (Cahier §13 Q1). If no test creds by execution time, build + unit-test the HMAC logic against published CMI specs, mark E2E as blocked-on-creds.
- **🔴 Signature verification before ANY state change** is the non-negotiable security property (NFR-033, FR-074/075). The webhook handler must verify-then-act; never act-then-verify.
- **Card data:** architecture guarantee — CMI hosted page + Stripe Elements mean card numbers never reach our servers (SR-CRYPT-004). Add a CI rule banning card-handling libs.
- `refund()` is in the interface but v1 implementations may throw `Not implemented` for CMI/Stripe refund (refund is an admin operation; document as v1.1 if scope-bound).
