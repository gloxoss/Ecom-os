# Ecom OS — Architecture Context

> Quick-reference for the engine adapter pattern, data flow, and deployment topology.

---

## Engine Adapter Pattern (ADR-004)

```
┌─ UI Layer (features/, components/) ──────────────────┐
│   Only imports from @ecom-os/engine                  │
│   Never imports engine-woocommerce or engine-vendure  │
└──────────────────────────┬───────────────────────────┘
                           │
                    EcomEngine interface
                           │
          ┌────────────────┼────────────────┐
          │                                 │
  WooCommerceEngine                  VendureEngine
  (WPGraphQL + REST)              (Vendure Shop API)
          │                                 │
  WordPress + WooCommerce          Vendure + PG + Redis
```

### The EcomEngine Interface

```typescript
interface EcomEngine {
  // Catalog
  getProducts(limit?: number): Promise<Product[]>;
  getProduct(idOrSlug: string): Promise<Product | null>;
  
  // Cart
  getCart(cartId: string): Promise<Cart | null>;
  addToCart(cartId: string, productId: string, quantity: number): Promise<Cart>;
  removeFromCart(cartId: string, lineItemId: string): Promise<Cart>;
  
  // Checkout & Orders
  placeOrder(cartId: string, customerDetails: Partial<Customer>): Promise<Order>;
  getOrder(orderId: string): Promise<Order | null>;
  
  // Customer
  getCustomer(token: string): Promise<Customer | null>;
}
```

### Engine Selection

Set `ECOM_ENGINE=woocommerce` or `ECOM_ENGINE=vendure` in `.env`.
The factory in `packages/ecom-engine/src/factory.ts` resolves the correct implementation.
The storefront's `lib/engine.ts` is the **only** file that imports an engine-specific package.

---

## Addon System (ADR-007)

Addons are toggled at build time via `ADDONS=i18n,multi-payment` in `.env`.

```
scripts/generate-addons.ts  →  apps/storefront/src/addons.generated.ts
```

Each addon package must export:
- `register(ctx: AddonContext): void` — mount the addon
- `disable(): void` — clean up

Disabled addons are tree-shaken from the production bundle.

---

## Data Flow — 3 Canonical Paths

### 1. Read Path (Catalog → PDP)
1. Shopper requests `/{locale}/catalog/shirts`
2. RSC calls `engine.getProducts({ category: 'shirts', locale })`
3. Adapter issues GraphQL query to WC or Vendure
4. Response cached via ISR (60s)
5. RSC renders server-side; client island handles add-to-cart

### 2. Write Path (Checkout → Order)
1. Shopper submits checkout form
2. Server action validates input (Zod)
3. `engine.placeOrder(...)` creates order in backend
4. PaymentGateway `initiate()` starts payment flow
5. Webhook callback → `confirm()` verifies signature → `markOrderPaid()`
6. Notifications fire (email + optional WhatsApp)

### 3. Content Update Path (Admin → Storefront)
1. Merchant edits product in WP admin or Vendure admin
2. Webhook hits `/api/revalidate?path=/products/{slug}`
3. On-demand ISR invalidates the page
4. Storefront reflects change within ≤60s

---

## Deployment Topology

### WC Engine (Hostinger)
- WordPress + WooCommerce + MySQL on Hostinger Business plan
- Next.js storefront on Hostinger Node app slot (PM2 + reverse proxy)

### Vendure Engine (VPS)
- Docker Compose: Vendure + PostgreSQL + Redis
- Next.js storefront: PM2 on the same VPS

---

## ADR Quick Reference

| ADR | Decision |
|-----|----------|
| ADR-001 | WPGraphQL for WC reads, REST for writes |
| ADR-002 | Vendure: plugin-only, never modify core |
| ADR-003 | One deployment per client, not multi-tenant |
| ADR-004 | Engine adapter pattern with typed interface |
| ADR-005 | Hostinger for WC, VPS for Vendure |
| ADR-006 | Auth delegated to engine (WC or Vendure manages users) |
| ADR-007 | Addons enabled/disabled via env var at build time |

Full ADRs: `pre-dev/03-ADRs/`

---

## Local Development & Routing Quirks

### 1. Next.js Proxy & `next-intl` Middleware Conflict
When proxying requests to external backends (e.g. `wp-admin` to LocalWP) via `next.config.ts` rewrites, the `next-intl` middleware can intercept the request first.
- **Problem**: `next-intl` intercepts `/wp-admin`, expects a locale prefix, and bypasses the proxy rewrites, resulting in a Next.js `404 This page could not be found`.
- **Solution**: Always exclude proxied backend paths from the middleware matcher in `apps/storefront/src/proxy.ts` (e.g., `wp-admin`, `wp-login.php`, `wp-content`, `wp-includes`).
- **Host Header**: Proxy destinations must use the exact domain (e.g., `http://cms-ecom-os.local`) rather than raw IP (`127.0.0.1:10004`) so the backend Nginx receives the correct Host header.

### 2. Turbopack `export type` Parsing Bug
Next.js 16+ Turbopack has a known issue parsing bare `export type { ... }` declarations in external workspace packages when no `tsconfig.json` explicitly forces typescript compilation or due to module resolution quirks.
- **Problem**: Turbopack crashes with `Expected '{', got 'ident'` and falls back to serving a stale, corrupted client bundle, causing phantom `ReferenceError`s in the browser.
- **Solution**: Always use `export interface Name { ... }` instead of `export type Name = { ... }` for object shapes in the `ecom-engine` package to ensure Turbopack parses the definitions correctly.
