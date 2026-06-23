# Data Flow — Ecom OS

Five canonical flows that cover every data movement in v1. Each as a Mermaid sequence/flow diagram with the trust boundary called out.

---

## Flow 1 — Catalog read (RSC → engine → cache → HTML)

```mermaid
sequenceDiagram
  autonumber
  participant Shopper
  participant Edge as Next.js (RSC)
  participant Cache as fetch cache (ISR)
  participant Engine as EcomEngine adapter
  participant Backend as WC / Vendure
  participant I18n as i18n addon

  Shopper->>Edge: GET /fr/catalog/shirts
  Edge->>Cache: lookup key=catalog:shirts:fr
  alt cache HIT
    Cache-->>Edge: cached products
  else cache MISS
    Edge->>Engine: listProducts({category:'shirts', locale:'fr'})
    Engine->>Backend: GraphQL query (WC: WPGraphQL / Vendure: Shop API)
    Backend-->>Engine: raw response
    Engine->>Engine: map to EcomEngine.Product[]
    Engine-->>Edge: typed products
    Edge->>Cache: store key=catalog:shirts:fr, ttl=60s
  end
  Edge->>I18n: translate UI strings (fr)
  I18n-->>Edge: localized strings
  Edge-->>Shopper: streamed HTML (RSC)
```

**Trust boundary:** Shopper → Edge is untrusted (NFR-032 input validation applies to query params). Edge → Engine → Backend is server-side, credentialed.

---

## Flow 2 — Add to cart (client island → server action → engine)

```mermaid
sequenceDiagram
  autonumber
  participant Shopper
  participant ClientUI as Client island
  participant Action as Server action
  participant Validator as Zod schema
  participant Engine as EcomEngine
  participant Backend as WC / Vendure
  participant Cookie as Cart cookie

  Shopper->>ClientUI: Clicks "Add to cart"
  ClientUI->>Action: addToCart({variantId, qty})
  Action->>Validator: validate input
  Validator-->>Action: ok | error
  alt invalid
    Action-->>ClientUI: 400 + zod error
    ClientUI-->>Shopper: inline error
  else valid
    Action->>Cookie: read cartId (or create)
    Action->>Engine: addToCart(cartId, {variantId, qty})
    Engine->>Backend: API call
    Backend-->>Engine: updated cart
    Engine-->>Action: Cart
    Action->>Cookie: set cartId cookie (HttpOnly, Secure, SameSite=Lax)
    Action-->>ClientUI: { cart, ok }
    ClientUI-->>Shopper: optimistic UI + drawer opens
  end
```

**Trust boundary:** Client → Server action via Next.js's signed payload; server-side validation is the source of truth.

---

## Flow 3 — Checkout + CMI payment (with HMAC verification)

```mermaid
sequenceDiagram
  autonumber
  participant Shopper
  participant Edge as Storefront (server actions)
  participant Engine as EcomEngine
  participant MultiPay as Multi-payment addon
  participant CMI as CMI hosted page
  participant CMIAPI as CMI callback endpoint (/api/webhooks/cmi)
  participant Log as ecom_webhook_delivery_log

  Shopper->>Edge: POST checkout (address, items)
  Edge->>Engine: initCheckout(cart, address)
  Engine-->>Edge: CheckoutSession{orderDraftId, totalMinor, currency}
  Shopper->>Edge: select CMI + confirm
  Edge->>MultiPay: gateway('cmi').initiate(session)
  MultiPay->>MultiPay: build signed form payload (HMAC with merchant key)
  MultiPay-->>Edge: redirect URL + form fields
  Edge-->>Shopper: redirect to CMI hosted page

  Shopper->>CMI: enters card, 3DS
  CMI->>CMIAPI: POST callback (signed)
  CMIAPI->>MultiPay: gateway('cmi').verify(callback)
  MultiPay->>MultiPay: recompute HMAC, compare
  alt signature INVALID
    MultiPay->>Log: write signature_status=invalid
    MultiPay-->>CMIAPI: 400
    Note over MultiPay,Log: 🚨 security alert
  else signature VALID
    MultiPay->>Log: write signature_status=valid
    MultiPay->>Engine: markOrderPaid(orderId, paymentRef)
    Engine->>Engine: notify (email + optional WhatsApp)
    MultiPay-->>CMIAPI: 200
    CMI-->>Shopper: redirect to /checkout/confirmation/{orderId}
  end
```

**Trust boundary:** CMI → callback endpoint is untrusted until HMAC verification succeeds. Order state changes are blocked behind successful verification (NFR-033).

---

## Flow 4 — Merchant updates a product → storefront updates (ISR webhook)

```mermaid
sequenceDiagram
  autonumber
  participant Merchant
  participant Engine as WC admin / Vendure admin
  participant DB as Engine DB
  participant Hook as Engine webhook
  participant Storefront as Next.js /api/revalidate
  participant Cache as ISR cache

  Merchant->>Engine: edit product, save
  Engine->>DB: persist
  Engine->>Hook: fire product.updated webhook
  Hook->>Storefront: POST /api/revalidate?path=/products/{slug}&secret=...
  Storefront->>Storefront: verify shared secret
  alt secret invalid
    Storefront-->>Hook: 401
    Note over Storefront: log + alert
  else secret valid
    Storefront->>Cache: revalidate path(s)
    Note over Cache: catalog index + category page<br/>+ PDP itself
    Storefront-->>Hook: 200
  end
```

**Trust boundary:** Engine → `/api/revalidate` is untrusted; protected by a shared secret in env var (`REVALIDATE_SECRET`).

---

## Flow 5 — Cash-on-delivery order (no external payment hop)

```mermaid
sequenceDiagram
  autonumber
  participant Shopper
  participant Edge as Server action
  participant Engine as EcomEngine
  participant Email as SMTP / provider
  participant WhatsApp as Optional webhook

  Shopper->>Edge: confirm COD checkout
  Edge->>Engine: placeOrder(session, {paymentMethod:'cod'})
  Engine-->>Edge: Order{status:'pending_confirmation'}
  Edge->>Email: send confirmation to customer (best effort)
  Edge->>Email: send notification to merchant
  alt WHATSAPP_WEBHOOK_URL set
    Edge->>WhatsApp: POST order summary (best effort, non-blocking)
  end
  Edge-->>Shopper: redirect to /checkout/confirmation/{orderId}
```

**Trust boundary:** None to external services for COD itself — order is local. Notifications are best-effort; failure does not block order creation (FR-076).

---

## Cross-cutting data rules

| Rule | Where enforced | Source requirement |
|---|---|---|
| All money stored as minor units (no floats) | Adapter mapping + addon tables | NFR + ERD §1 |
| Webhook signatures verified before any state change | Each webhook handler | NFR-033, FR-074, FR-075 |
| Input from shoppers validated via Zod at server boundary | Server actions + API routes | NFR-032 |
| Locale on every persisted user-facing string | Translation tables + order header | FR-060, ERD §1 |
| No PII in client-side bundles | Build-time check on `apps/storefront/` | NFR-031 |
| Append-only webhook log | `ecom_webhook_delivery_log` table | Schema §2 |
| Cart cookies: HttpOnly, Secure, SameSite=Lax | Server action set-cookie | ADR-006 |

---

## What no flow does in v1

- No flow writes directly to engine-native tables — always via the engine's API.
- No flow keeps state in the Next.js process across requests (no in-memory sessions). Cache is the only in-process state.
- No flow propagates customer-side data to third-party analytics in v1.
