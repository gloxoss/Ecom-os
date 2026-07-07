# Section 06 — Cart · Checkout · COD

> **Batch 5 · Risk: RED · Deps: 05 · Tasks: 5 · Blueprint: Step 10 · Screens: S-20, S-21, S-22, S-23, S-24**

## Why this section exists
The cart + 3-step guest checkout is the highest-stakes flow (PRD Risk #2 — cart sync, #3 — state). It establishes the server-action price-integrity pattern (SR-VAL-002) that every payment provider (§09) depends on. COD (highest-RICE feature F-16) ships here as the first working checkout; CMI/Stripe are layered on in §09.

## Requirements covered
- **FR-001** cart + checkout as RSC by default
- Discovery Q: persistent cart (cookies/localStorage, 30 days), guest checkout w/ optional account creation, COD first
- **SR-VAL-002** server recomputes prices — client-supplied prices ignored
- **SR-AUTH-003** cart cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, max-age 30 days
- **SR-SESS-002** cart contents re-validated against engine on every read (stock, price changes)

## Tasks
1. **Cart state (Zustand + cookie)** — `features/cart/{model,ui,hooks}`. Client cart store (Zustand) mirrors server state; server is source of truth. Server action `addToCart` / `updateQty` / `removeFromCart` call `engine.addToCart`; cart id stored in an HttpOnly cookie (`cartId`). State machine for S-20 (success, empty, loading, stale — item out of stock since added, error). Cart drawer overlay (S-21).
2. **WC adapter cart verbs** — implement `engine.getCart`, `addToCart`, `initCheckout` against WC REST (write path per ADR-001). Map WC cart → `EcomEngine.Cart`. Stock reconciliation on every cart read (SR-SESS-002): if a line went out-of-stock since add, surface "stale" state.
3. **Checkout flow (S-22 → S-23 → S-24)** — `features/checkout/{address,payment,confirmation}`. Server actions `initCheckout(cartId, addressInput)` + `placeOrder(session)`. **StepNav** (1 of 3, 2 of 3, 3 of 3). Address form (React Hook Form + Zod). Order summary sidebar.
4. **COD provider (minimal)** — `placeOrder` with `paymentMethod: 'cod'` → `engine.placeOrder` → `Order{status:'pending_confirmation'}` (FR-076). Best-effort merchant email + optional WhatsApp webhook (`WHATSAPP_WEBHOOK_URL`). Email failure must NOT block order creation (Data-flow Flow 5, threat model §3).
5. **Confirmation + price-integrity test** — S-24 order confirmation. **Integration test** that tampers a client-supplied price and asserts the server recomputes from the engine's authoritative price (SR-VAL-002). Playwright E2E: Home → PDP → Add to Cart → COD checkout → confirmation.

## Inputs
- Section 01 (interface, esp. `initCheckout`/`placeOrder`/`markOrderPaid`), Section 05 (PDP add-to-cart entry)
- Data-flow Flow 2 (add to cart) + Flow 5 (COD), threat model §3

## Outputs
- `apps/storefront/src/features/{cart,checkout}/...`
- `apps/storefront/src/app/(marketing)/{cart,checkout/{address,payment,confirmation/[orderId]}}/page.tsx`
- `packages/engine-woocommerce/src/{cart.ts,orders.ts}` (WC REST cart/order verbs)
- Server actions under `features/cart/server/` + `features/checkout/server/`
- COD notification helper (email + WhatsApp)

## Acceptance Criteria
- [ ] Cart persists across browser restart for 30 days (cookie); restored on return
- [ ] Cart re-validates stock on read; stale item flagged
- [ ] Guest can complete COD checkout end-to-end; real order created in WC sandbox
- [ ] Tampered client price is overwritten by server-recomputed price (integration test passes)
- [ ] Email failure does not block order creation
- [ ] Cart cookie has `HttpOnly`, `Secure`, `SameSite=Lax`, max-age 30d
- [ ] Playwright E2E (Home → PDP → Cart → COD → Confirmation) green

## Skills to load
`next-best-practices` (server actions, cookies, `revalidatePath`), `nextjs-shadcn` (forms, steppers), `woocommerce` (WC REST cart/orders), `api-security-best-practices` (input validation, price integrity), `webapp-testing` (E2E)

## Risks / notes
- **🔴 Price integrity is the critical security property.** Never trust client-supplied prices/totals — always recompute from `engine` at order creation (SR-VAL-002, threat model §1-T). The integration test in task 5 is mandatory.
- **🔴 Cart sync without bundle bloat** — Zustand store mirrors server state; don't duplicate logic client-side. This is PRD Risk #2.
- Stripe/CMI payment selection UI (S-23 provider list) is wired here minimally (COD only) and extended in §09. Build `PaymentProviderList` to read from the addon registry so §09 just registers providers.
