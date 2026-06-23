# C4 Diagrams — Ecom OS

Three levels: **Context** (the whole system + its external actors), **Container** (the deployable units), **Component** (internals of the Universal Storefront). All rendered in Mermaid.

---

## Level 1 — System Context

```mermaid
graph TB
  subgraph EXT[" "]
    Shopper["👤 Shopper<br/>(Salma)"]
    Merchant["👤 Merchant<br/>(Yasmine)"]
    Agency["👤 Agency partner<br/>(Marc)"]
    CTO["👤 Mid-market CTO<br/>(Karim)"]
    Engineer["👤 EPIOSO engineer"]
  end

  EcomOS["🧱 Ecom OS deployment<br/>(per client)<br/>Universal Next.js storefront<br/>+ chosen engine + addons"]

  CMI["💳 CMI<br/>(Moroccan card payments)"]
  Stripe["💳 Stripe"]
  Email["✉️ SMTP / Email provider"]
  WhatsApp["💬 WhatsApp webhook<br/>(optional)"]
  Hostinger["☁️ Hostinger<br/>(WC engine host)"]
  VPS["🖥️ VPS<br/>(Vendure engine host)"]

  Shopper -->|"Browses, buys"| EcomOS
  Merchant -->|"Manages products,<br/>orders, translations"| EcomOS
  Agency -->|"Commissions a white-label build"| EcomOS
  CTO -->|"Operates a Vendure-engine deployment"| EcomOS
  Engineer -->|"Scaffolds, configures,<br/>deploys, maintains"| EcomOS

  EcomOS -->|"Card payment redirect + signed callback"| CMI
  EcomOS -->|"Payment Intents + signed webhook"| Stripe
  EcomOS -->|"Transactional emails"| Email
  EcomOS -->|"COD order notifications"| WhatsApp
  EcomOS -.->|"Runs on (WC variant)"| Hostinger
  EcomOS -.->|"Runs on (Vendure variant)"| VPS

  classDef person fill:#FF6B2D,stroke:#000,color:#fff
  classDef system fill:#111,stroke:#FF6B2D,color:#fff
  classDef external fill:#f4f4f4,stroke:#999,color:#000
  class Shopper,Merchant,Agency,CTO,Engineer person
  class EcomOS system
  class CMI,Stripe,Email,WhatsApp,Hostinger,VPS external
```

---

## Level 2 — Container (one client deployment)

```mermaid
graph TB
  Shopper["👤 Shopper"]
  Merchant["👤 Merchant"]

  subgraph DEPLOY["🧱 One Ecom OS deployment"]
    Storefront["🖥️ Universal Storefront<br/>[Container]<br/>Next.js 16 (App Router, RSC)<br/>+ enabled addons"]

    subgraph ENGINE["⚙️ Backend engine (one or the other)"]
      WC["🛒 WooCommerce<br/>[Container]<br/>WordPress + WC + MySQL<br/>+ EPIOSO i18n WP plugin"]
      Vendure["🛒 Vendure<br/>[Container]<br/>NestJS + GraphQL<br/>+ EPIOSO plugins"]
      Postgres["🗄️ PostgreSQL<br/>[Container]<br/>(Vendure only)"]
      Redis["🗄️ Redis<br/>[Container]<br/>(Vendure only)"]
    end
  end

  CMI["💳 CMI"]
  Stripe["💳 Stripe"]
  Email["✉️ Email provider"]

  Shopper -->|"HTTPS"| Storefront
  Merchant -->|"WP admin / Vendure admin"| WC
  Merchant -->|" "| Vendure

  Storefront -->|"WPGraphQL reads<br/>WC REST writes"| WC
  Storefront -->|"Vendure Shop API<br/>(GraphQL)"| Vendure
  WC -->|"ISR revalidation webhooks"| Storefront
  Vendure -->|"ISR revalidation webhooks"| Storefront

  Vendure -->|"reads/writes"| Postgres
  Vendure -->|"job queues"| Redis

  Storefront -->|"redirect + verify callback"| CMI
  Storefront -->|"Payment Intents + webhook"| Stripe
  Storefront -->|"transactional"| Email

  classDef person fill:#FF6B2D,stroke:#000,color:#fff
  classDef container fill:#1a1a1a,stroke:#FF6B2D,color:#fff
  classDef datastore fill:#333,stroke:#888,color:#fff
  classDef external fill:#f4f4f4,stroke:#999,color:#000
  class Shopper,Merchant person
  class Storefront,WC,Vendure container
  class Postgres,Redis datastore
  class CMI,Stripe,Email external
```

---

## Level 3 — Component (inside the Universal Storefront)

```mermaid
graph TB
  subgraph STOREFRONT["🖥️ Universal Storefront [Container — Next.js 16]"]
    direction TB

    subgraph APP["app/ — routing & RSC pages"]
      Routes["📄 Routes<br/>(catalog, PDP, cart,<br/>checkout, account)"]
      ServerActions["⚙️ Server actions<br/>(add to cart, place order)"]
      APIRoutes["🌐 API routes<br/>(/api/revalidate,<br/>/api/webhooks/*)"]
    end

    subgraph FEATURES["features/ — per-area UI + logic"]
      CatalogUI["🎨 Catalog UI"]
      CartUI["🎨 Cart UI"]
      CheckoutUI["🎨 Checkout UI"]
    end

    subgraph ENGINE_LAYER["packages/ecom-engine — adapter layer"]
      Interface["📜 EcomEngine interface<br/>(typed contract)"]
      WCAdapter["🔌 WooCommerceEngine<br/>(WPGraphQL + REST)"]
      VendureAdapter["🔌 VendureEngine<br/>(Shop API GraphQL)"]
    end

    subgraph ADDONS["addons/ — enabled per deployment"]
      I18n["🌍 i18n addon<br/>(JSON dictionaries,<br/>locale routing, RTL)"]
      MultiPay["💳 multi-payment addon<br/>(PaymentGateway interface)"]
      CMIProv["  ↳ CMI provider"]
      StripeProv["  ↳ Stripe provider"]
      CODProv["  ↳ COD provider"]
    end

    BrandConfig["🎛️ brand.config.ts<br/>(per-client tokens)"]
    AddonLoader["🧩 Addon loader<br/>(env-driven, tree-shaken)"]
  end

  WCBackend["🛒 WooCommerce backend"]
  VendureBackend["🛒 Vendure backend"]
  CMIExt["💳 CMI"]
  StripeExt["💳 Stripe"]

  Routes --> CatalogUI
  Routes --> CartUI
  Routes --> CheckoutUI
  CatalogUI --> Interface
  CartUI --> Interface
  CheckoutUI --> Interface
  ServerActions --> Interface
  APIRoutes -.->|"ISR trigger"| Routes

  Interface -.implements.-> WCAdapter
  Interface -.implements.-> VendureAdapter
  WCAdapter -->|"GraphQL + REST"| WCBackend
  VendureAdapter -->|"GraphQL"| VendureBackend

  CheckoutUI --> MultiPay
  MultiPay -.implements.-> CMIProv
  MultiPay -.implements.-> StripeProv
  MultiPay -.implements.-> CODProv
  CMIProv -->|"redirect + callback"| CMIExt
  StripeProv -->|"Payment Intents + webhook"| StripeExt

  CatalogUI --> I18n
  CartUI --> I18n
  CheckoutUI --> I18n

  AddonLoader -.toggles.-> I18n
  AddonLoader -.toggles.-> MultiPay
  BrandConfig -.themes.-> CatalogUI
  BrandConfig -.themes.-> CartUI
  BrandConfig -.themes.-> CheckoutUI

  classDef container fill:#1a1a1a,stroke:#FF6B2D,color:#fff
  classDef component fill:#222,stroke:#888,color:#fff
  classDef interface fill:#FF6B2D,stroke:#000,color:#fff
  classDef config fill:#444,stroke:#FF6B2D,color:#fff
  classDef external fill:#f4f4f4,stroke:#999,color:#000
  class Routes,ServerActions,APIRoutes,CatalogUI,CartUI,CheckoutUI,WCAdapter,VendureAdapter,I18n,MultiPay,CMIProv,StripeProv,CODProv component
  class Interface interface
  class BrandConfig,AddonLoader config
  class WCBackend,VendureBackend,CMIExt,StripeExt external
```

---

## How to read these diagrams

- **Solid arrows** = synchronous request/call
- **Dotted arrows** = asynchronous or "implements" / "toggles" / "themes"
- **Orange** = persona or interface (the "contracts" of the system)
- **Black/dark** = first-party Ecom OS containers/components
- **Grey** = external services (third party or infra)

Update these diagrams whenever a new addon, engine, or external service is introduced. They are the source of truth for the system shape.
