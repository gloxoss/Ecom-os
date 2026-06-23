# ADR-004: Engine adapter pattern (`EcomEngine` interface + per-engine implementations)

**Status:** Accepted
**Date:** 2026-06-23

---

## Context

The Universal Storefront must serve two backend engines (WooCommerce and Vendure) and possibly more later. UI code must not know which engine is behind a request.

## Decision

A single TypeScript interface `EcomEngine` defines every data operation the storefront needs:

```ts
// packages/ecom-engine/src/types.ts
export interface EcomEngine {
  listProducts(query: ProductListQuery): Promise<ProductListResult>;
  getProduct(slug: string, locale: Locale): Promise<Product | null>;
  listCategories(locale: Locale): Promise<Category[]>;
  getCart(cartId: string): Promise<Cart>;
  addToCart(cartId: string, input: AddToCartInput): Promise<Cart>;
  initCheckout(cartId: string, input: CheckoutInput): Promise<CheckoutSession>;
  placeOrder(session: CheckoutSession): Promise<Order>;
  markOrderPaid(orderId: string, paymentRef: string): Promise<void>;
  getOrder(orderId: string, customerId: string): Promise<Order | null>;
  listCustomerOrders(customerId: string): Promise<Order[]>;
}
```

Two implementations live as separate packages: `engine-woocommerce` and `engine-vendure`. The storefront imports only from `packages/ecom-engine` and calls `getEngine()` which returns the impl chosen by `ECOM_ENGINE` env var.

## Rationale

- **One contract, many backends.** Adding a future engine = adding a new package, not touching UI.
- **Typing prevents leakage.** No `any` returns from the engine; UI components can rely on the shape.
- **Per-engine optimization stays hidden.** WC's batching, Vendure's caching, etc., are implementation details.
- **Testability.** A `FakeEngine` implementation for tests is trivial.

## Alternatives considered

- **Conditional logic inside components (`if (engine === 'woo') ...`).** Rejected: spreads coupling everywhere; violates `nextjs-app-structure` server-first + feature-first rules.
- **Two separate Next.js apps, one per engine.** Rejected: doubles maintenance for shared UI; defeats the "universal frontend" goal in the charter.
- **GraphQL federation in front of both engines.** Rejected: massive complexity premium for v1; only justifiable at multi-engine-per-deployment scale, which we explicitly excluded.

## Consequences

- **Easier:** Adding engines, swapping engines, testing UI with fakes.
- **Harder:** The interface becomes a coordination point — adding a method requires updating both implementations. Acceptable; this is the point.
- **Hard constraint:** A CI rule forbids imports from `engine-woocommerce` or `engine-vendure` anywhere outside the engine adapter wiring (`lib/engine.ts`).
