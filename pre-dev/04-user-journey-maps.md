# User Journey Maps — Ecom OS

One journey per persona. Each renders as a Mermaid flowchart with the **success state** (green) and the **failure / drop-off states** (red) called out.

---

## Journey 1 — Salma (end shopper) buys a product

**Entry point:** Instagram link to a product page.

```mermaid
flowchart TD
  Start(["📱 Salma taps Instagram link"]) --> Land["Lands on PDP<br/>/{ar}/products/abaya-noir"]
  Land --> Lang{"Locale correct?"}
  Lang -- "No (auto-detected wrong)" --> Switch["Taps locale switcher → AR"]
  Switch --> ReloadAR["Page reloads in Arabic + RTL"]
  Lang -- "Yes" --> Browse
  ReloadAR --> Browse["Reads description, sees price"]

  Browse --> Decide{"Add to cart?"}
  Decide -- "No, keep browsing" --> CatBrowse["Browses category"]
  CatBrowse --> Browse
  Decide -- "Yes" --> Add["Taps Add to Cart"]
  Add --> CartOpen["Cart drawer opens<br/>count badge updates"]

  CartOpen --> CheckoutQ{"Checkout now?"}
  CheckoutQ -- "No" --> Exit1(["🟡 Abandons<br/>cart persists in cookie"]):::warn
  CheckoutQ -- "Yes" --> Checkout["/checkout/address"]

  Checkout --> Address["Fills name + phone + address"]
  Address --> Validate{"Address valid?"}
  Validate -- "No" --> AddressErr["Inline error<br/>(missing required field)"]:::warn
  AddressErr --> Address
  Validate -- "Yes" --> Payment["/checkout/payment"]

  Payment --> SelectPay{"Selects gateway"}
  SelectPay -- "Cash on Delivery" --> CODConfirm["Confirms order<br/>(no redirect)"]
  SelectPay -- "CMI card" --> CMIRedirect["Redirected to CMI 3DS page"]
  CMIRedirect --> CardOK{"Payment OK?"}
  CardOK -- "No" --> CMIFail["Returns with error<br/>order not created"]:::error
  CMIFail --> Payment
  CardOK -- "Yes" --> CMICallback["CMI callback → verify HMAC"]
  CMICallback --> SigOK{"Signature valid?"}
  SigOK -- "No" --> SecAlert["🚨 Security event logged<br/>order NOT marked paid"]:::error
  SigOK -- "Yes" --> OrderPaid["Order marked paid"]

  CODConfirm --> CreateOrder["Order created<br/>status: pending_confirmation"]
  OrderPaid --> CreateOrder
  CreateOrder --> Confirmation(["✅ Confirmation page<br/>+ email within 60s"]):::ok

  classDef ok fill:#2d6a4f,color:#fff,stroke:#1b4332
  classDef warn fill:#f4a261,color:#000,stroke:#e76f51
  classDef error fill:#c1121f,color:#fff,stroke:#780000
```

**Critical drop-off points:** cart abandonment, address validation, payment failure. UX must keep these recoverable (cart persistence, inline errors, retry).

---

## Journey 2 — Yasmine (merchant) adds a product with Arabic translation

**Entry point:** WordPress admin login.

```mermaid
flowchart TD
  Login(["🔐 Logs into WP admin"]) --> Dashboard["WP dashboard"]
  Dashboard --> ProductsList["Products → Add New"]
  ProductsList --> FillFr["Fills French fields<br/>(title, description, price, images)"]
  FillFr --> I18nFields{"i18n addon enabled?"}
  I18nFields -- "No" --> SaveBare["Saves with FR only"]:::warn
  I18nFields -- "Yes" --> ArTab["Switches to Arabic tab<br/>(injected by EPIOSO WP plugin)"]
  ArTab --> FillAr["Fills Arabic title + description"]
  FillAr --> Save["Clicks Publish"]
  Save --> WPSaves["WP persists post + meta"]
  WPSaves --> Webhook["WC webhook fires:<br/>product.created"]
  Webhook --> Revalidate["POST /api/revalidate?path=..."]
  Revalidate --> ISR["Next.js ISR refreshes:<br/>catalog page + new PDP"]
  ISR --> LiveCheck["Yasmine opens storefront<br/>in both locales"]
  LiveCheck --> Verify{"Both languages live?"}
  Verify -- "Yes within 60s" --> Done(["✅ Product live in FR + AR"]):::ok
  Verify -- "Not appearing" --> Cache["Hard refresh / check ISR logs"]:::warn
  Cache --> LiveCheck

  classDef ok fill:#2d6a4f,color:#fff,stroke:#1b4332
  classDef warn fill:#f4a261,color:#000,stroke:#e76f51
```

**Critical UX requirement:** the AR tab MUST appear directly in the standard product editor, not as a separate page. Switching screens loses merchants.

---

## Journey 3 — Marc (agency partner) commissions a white-label deployment

**Entry point:** First call with EPIOSO sales lead.

```mermaid
flowchart TD
  Discover(["📩 Discovers EPIOSO via referral"]) --> Call["Discovery call"]
  Call --> NDA["NDA signed"]
  NDA --> Brief["Marc shares client brief"]
  Brief --> Quote["EPIOSO returns a fixed quote<br/>(WC engine path)"]
  Quote --> Approve{"Marc approves?"}
  Approve -- "No" --> Renegotiate["Scope revision"]:::warn
  Renegotiate --> Quote
  Approve -- "Yes" --> Kickoff["Kickoff: brand assets,<br/>API access, locale list"]

  Kickoff --> Scaffold["EPIOSO runs<br/>npx create-ecom-os marc-client --engine=woo"]
  Scaffold --> Brand["Fills brand.config.ts<br/>(logo, colors, fonts, hero)"]
  Brand --> Connect["Connects to Marc's<br/>WordPress instance via env vars"]
  Connect --> Addons["Enables ADDONS=i18n,multi-payment"]
  Addons --> Build["Local build + smoke test"]
  Build --> Staging["Deploy to staging URL"]
  Staging --> Review{"Marc + client review"}
  Review -- "Changes needed" --> Iterate["Adjust brand tokens / content"]:::warn
  Iterate --> Staging
  Review -- "Approved" --> Prod["Deploy to production"]
  Prod --> Handoff["Repo handoff<br/>(white-labeled commits + docs)"]
  Handoff --> SupportLoop["Optional support retainer"]
  SupportLoop --> Done(["✅ Marc owns a working stack<br/>EPIOSO is the engine room"]):::ok

  classDef ok fill:#2d6a4f,color:#fff,stroke:#1b4332
  classDef warn fill:#f4a261,color:#000,stroke:#e76f51
```

**Success metric:** end-to-end (kickoff → production) within 2 weeks. If iteration loops exceed 2 cycles, scope discipline failed at kickoff.

---

## Journey 4 — Karim (mid-market CTO) migrates from WC engine to Vendure engine (v1 → v1.1)

**Entry point:** Karim's brand has outgrown WC; wants more control + multi-branch routing.

```mermaid
flowchart TD
  Trigger(["📈 Brand outgrows<br/>WC capacity / features"]) --> Talk["Talks to EPIOSO"]
  Talk --> Audit["EPIOSO audits current WC store<br/>+ data export plan"]
  Audit --> Decision{"Migration vs. rebuild?"}
  Decision -- "Rebuild" --> Reject["Out of scope — different project"]:::error
  Decision -- "Migration" --> Plan["Plan: same Next.js storefront,<br/>swap ECOM_ENGINE=vendure"]

  Plan --> ProvisionVPS["Provision VPS<br/>(Docker Compose: Vendure + PG + Redis)"]
  ProvisionVPS --> ImportData["Import products + customers<br/>from WC via Vendure CLI"]
  ImportData --> ValidateData{"Data parity OK?"}
  ValidateData -- "No (gaps)" --> FixImport["Patch importer<br/>or accept gaps with client"]:::warn
  FixImport --> ImportData
  ValidateData -- "Yes" --> SwitchEnv["Change ECOM_ENGINE env<br/>+ point at Vendure URL"]
  SwitchEnv --> SmokeTest["E2E smoke tests<br/>(both engines passing same suite)"]

  SmokeTest --> AddonsCheck["Branch-routing addon (v1.1)<br/>enabled + configured"]
  AddonsCheck --> Cutover["DNS cutover during low-traffic window"]
  Cutover --> Monitor["48-hour monitoring window"]
  Monitor --> Live(["✅ Karim's brand on Vendure<br/>storefront UX unchanged"]):::ok

  classDef ok fill:#2d6a4f,color:#fff,stroke:#1b4332
  classDef warn fill:#f4a261,color:#000,stroke:#e76f51
  classDef error fill:#c1121f,color:#fff,stroke:#780000
```

**Key UX bet:** Salma-grade shoppers on Karim's storefront SHOULD NOT notice the engine swap. The visual regression suite gates the cutover.

---

## Cross-journey insights

| Insight | Implication for design |
|---|---|
| Locale must be sticky and visible | Persistent locale switcher in header; cookie + URL persist together |
| Cart abandonment is the biggest leak | Cart persists in cookie for 30 days; one-click resume from email |
| Address validation must be inline, not summary-page | Errors render under each field, in the active locale |
| COD is the default in MENA | COD always shown first when enabled; CMI/Stripe second |
| Merchant edits must reflect in ≤60s | Webhook → ISR contract is non-negotiable |
| Migration UX is invisible to shoppers | Visual regression suite is the only test that matters during cutover |
