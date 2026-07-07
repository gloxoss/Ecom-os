# Section 01 — Engine Interface Hardening

> **Batch 1 · Risk: yellow · Deps: none · Tasks: 5 · Blueprint: Step 3 (+ fix stubs from Steps 1–4)**

## Why this section exists
The shipped `packages/ecom-engine/src/interface.ts` is a **stub that predates ADR-004**. It drifts from the canonical contract in method names, missing verbs, and money representation. Every subsequent section depends on the corrected interface — this must run first.

## Requirements covered
- **FR-010** single typed `EcomEngine` covering: list products, get product, list categories, get category, cart CRUD, checkout init, place order, get order, list user orders
- **FR-011** two implementations exist (WC done here-as-contract; Vendure in Sprint D)
- **FR-012** no UI imports engine-specific modules
- **FR-013** engine selection via `ECOM_ENGINE` env var
- **FR-014** engine swap needs no changes under `app/`, `features/*/ui/`, `components/`

## Tasks
1. **Rewrite `types.ts`** to ADR-004 + ERD §1 shape: `Product`, `ProductVariant`, `Category`, `Cart`, `CartItem`, `Order`, `OrderLine`, `Customer`, `CheckoutSession`, `PaymentRef`, `Locale`, query/result types (`ProductListQuery`, `ProductListResult`). **Money as `amount_minor: number` + `currency: string`** — no floats (ERD §1, Cahier §8.14).
2. **Rewrite `interface.ts`** to the canonical contract:
   ```ts
   listProducts(query): Promise<ProductListResult>
   getProduct(slug, locale): Promise<Product | null>
   listCategories(locale): Promise<Category[]>
   getCart(cartId): Promise<Cart>
   addToCart(cartId, input): Promise<Cart>
   initCheckout(cartId, input): Promise<CheckoutSession>
   placeOrder(session): Promise<Order>
   markOrderPaid(orderId, paymentRef): Promise<void>
   getOrder(orderId, customerId): Promise<Order | null>
   listCustomerOrders(customerId): Promise<Order[]>
   ```
3. **Rewrite `factory.ts`** — `getEngine()` reads `ECOM_ENGINE` env var, lazy-imports the chosen impl, memoizes. Throw a clear startup error if unset/unknown (Cahier §5: missing required values fail startup). Add a `FakeEngine` for tests (ADR-004 consequence).
4. **Update `engine-woocommerce`** to satisfy the new interface (stub methods that throw `Not implemented` are fine here; full impl is Section 05's dependency — but signatures must compile).
5. **Add engine-import guard** `scripts/check-engine-imports.sh` + wire to `precommit` + CI (Cahier §10, FR-012). Fails if `engine-woocommerce`/`engine-vendure` imported outside `apps/storefront/src/lib/engine.ts`.

## Inputs
- ADR-004, ADR-001, ERD §1, SRS FR-010..014, Cahier §8

## Outputs
- Corrected `packages/ecom-engine/src/{types.ts,interface.ts,factory.ts,index.ts}`
- Updated `packages/engine-woocommerce/src/client.ts` (signatures)
- `apps/storefront/src/lib/engine.ts` (single engine wiring point)
- `scripts/check-engine-imports.sh`
- `packages/ecom-engine/src/fake-engine.ts` (test fake)

## Acceptance Criteria
- [ ] `pnpm --filter @ecom-os/engine typecheck` passes with zero runtime deps in `ecom-engine`
- [ ] No `any` in the interface; all money is `amount_minor: number`
- [ ] `getEngine()` throws a helpful error when `ECOM_ENGINE` is unset
- [ ] Import guard fails if `engine-woocommerce` is imported anywhere but `lib/engine.ts`
- [ ] `FakeEngine` satisfies `EcomEngine` (compile-checked)

## Skills to load
`api-design-principles`, `nextjs-best-practices` (server-only env), `architecture-patterns` (adapter pattern)

## Risks / notes
- Changing the interface breaks the existing `WooCommerceEngine` stub signatures — that's expected and fixed in task 4.
- Vendure impl deferred to Sprint D (Step 24) — the contract is written to support it but no impl here.
