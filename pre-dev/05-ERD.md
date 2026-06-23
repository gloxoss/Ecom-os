# Entity Relationship Diagram — Ecom OS

This ERD is **engine-agnostic**. It models the conceptual entities the Universal Storefront sees through the `EcomEngine` interface, plus the Ecom-OS-owned tables that addons add on top of either backend. The raw WooCommerce / Vendure schemas are owned by their respective projects and not duplicated here.

---

## 1. Conceptual entity model

```mermaid
erDiagram
  CUSTOMER ||--o{ ORDER : "places"
  CUSTOMER ||--o{ ADDRESS : "has"
  CUSTOMER ||--o{ CART : "owns (active)"

  CART ||--o{ CART_ITEM : "contains"
  CART_ITEM }o--|| PRODUCT_VARIANT : "references"

  PRODUCT ||--|{ PRODUCT_VARIANT : "has"
  PRODUCT }o--o{ CATEGORY : "belongs to"
  PRODUCT ||--o{ PRODUCT_TRANSLATION : "has"

  PRODUCT_VARIANT ||--o{ PRICE : "has"
  PRODUCT_VARIANT ||--o{ STOCK_LEVEL : "has"

  ORDER ||--|{ ORDER_LINE : "contains"
  ORDER_LINE }o--|| PRODUCT_VARIANT : "references"
  ORDER ||--|| ADDRESS : "ships to"
  ORDER ||--o| PAYMENT_EVENT : "settled by"

  PAYMENT_EVENT }o--|| PAYMENT_PROVIDER : "via"

  CATEGORY ||--o{ CATEGORY_TRANSLATION : "has"

  CUSTOMER {
    string id PK
    string email
    string phone
    string locale
    timestamp created_at
  }
  ADDRESS {
    string id PK
    string customer_id FK
    string country
    string city
    string postal_code
    string street
    boolean is_default
  }
  CART {
    string id PK
    string customer_id FK "nullable for guest"
    string locale
    timestamp expires_at
  }
  CART_ITEM {
    string id PK
    string cart_id FK
    string variant_id FK
    int quantity
    int unit_price_minor
    string currency
  }
  PRODUCT {
    string id PK
    string slug
    string brand_id
    string status "draft|published"
    timestamp created_at
  }
  PRODUCT_TRANSLATION {
    string id PK
    string product_id FK
    string locale PK
    string title
    text description
  }
  PRODUCT_VARIANT {
    string id PK
    string product_id FK
    string sku
    json attributes "size|color|etc"
  }
  PRICE {
    string id PK
    string variant_id FK
    string currency
    int amount_minor
  }
  STOCK_LEVEL {
    string id PK
    string variant_id FK
    string branch_id "FK in v1.1 only"
    int available
    string status "in_stock|out_of_stock|on_backorder"
  }
  CATEGORY {
    string id PK
    string slug
    string parent_id FK "nullable"
  }
  CATEGORY_TRANSLATION {
    string id PK
    string category_id FK
    string locale PK
    string name
  }
  ORDER {
    string id PK
    string customer_id FK
    string status "pending|paid|pending_confirmation|fulfilled|cancelled|refunded"
    int subtotal_minor
    int shipping_minor
    int total_minor
    string currency
    string locale
    string assigned_branch_id "FK in v1.1 only"
    timestamp created_at
  }
  ORDER_LINE {
    string id PK
    string order_id FK
    string variant_id FK
    int quantity
    int unit_price_minor
  }
  PAYMENT_EVENT {
    string id PK
    string order_id FK
    string provider_id FK
    string external_ref "CMI tx_id, Stripe pi_id, etc."
    string status "initiated|succeeded|failed|refunded"
    json raw_callback
    timestamp received_at
  }
  PAYMENT_PROVIDER {
    string id PK "cmi|stripe|cod"
    string display_name
    boolean enabled
  }
```

### Notes on this model
- All money is stored as **minor units** (e.g., centimes) — never floats.
- `locale` is a composite-key participant on every `*_TRANSLATION` table.
- `assigned_branch_id` on `ORDER` and `branch_id` on `STOCK_LEVEL` are **v1.1** only (multi-branch routing addon). v1 leaves them null.
- `CART` has a TTL via `expires_at` so abandoned carts can be cleaned up by a scheduled job.
- The Universal Storefront never queries this model directly — it goes through `EcomEngine`. The engine adapter is responsible for mapping these concepts onto WC's / Vendure's actual storage.

---

## 2. Ecom-OS-owned addon tables

These tables live in the engine's database (created by WC plugins or Vendure migrations) but are **owned by Ecom OS addons**.

```mermaid
erDiagram
  I18N_DICTIONARY {
    string id PK
    string addon_namespace "i18n|loyalty|etc"
    string key
    string locale
    string value
    timestamp updated_at
    string updated_by
  }
  PAYMENT_GATEWAY_CONFIG {
    string id PK
    string provider_id "cmi|stripe|cod"
    boolean enabled
    json config_encrypted
    timestamp updated_at
  }
  WEBHOOK_DELIVERY_LOG {
    string id PK
    string source "cmi|stripe|woo|vendure"
    string event_type
    string external_ref
    string signature_status "valid|invalid|missing"
    json payload
    int response_status
    timestamp received_at
  }
  BRANCH {
    string id PK
    string name
    json address
    boolean is_default
  }
  BRANCH_POSTAL_MAPPING {
    string id PK
    string branch_id FK
    string country
    string postal_prefix
    int priority
  }

  BRANCH ||--o{ BRANCH_POSTAL_MAPPING : "maps to"
```

### v1 vs v1.1

| Table | v1 | v1.1 |
|---|---|---|
| `I18N_DICTIONARY` | ✅ shipped with i18n addon | — |
| `PAYMENT_GATEWAY_CONFIG` | ✅ shipped with multi-payment addon | — |
| `WEBHOOK_DELIVERY_LOG` | ✅ shipped with multi-payment addon | extended for all webhooks |
| `BRANCH` | — | ✅ shipped with multi-branch addon |
| `BRANCH_POSTAL_MAPPING` | — | ✅ shipped with multi-branch addon |

---

## 3. Identity & multi-tenancy

There is **no tenant-id** column anywhere. Per ADR-003 (one app per client), each deployment owns its database; cross-tenant isolation is enforced at the infrastructure boundary, not at the data layer.

If multi-tenancy is ever introduced (v2+), a `tenant_id` would be added to every row and every query plus RLS policies. **Not in v1.**
