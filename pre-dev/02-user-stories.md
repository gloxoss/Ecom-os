# User Stories — Ecom OS

Stories follow Gherkin acceptance criteria. Grouped by feature area. Each persona name links back to `01-user-personas.md`.

---

## Storefront — Browse & Purchase (Salma, the shopper)

### Story 1.1 — Browse the catalog
**As an** end shopper, **I want to** browse products by category **so that** I can quickly find what I'm looking for.

**Acceptance criteria:**
- **Given** the catalog page is requested, **when** the page loads on emulated mobile 3G, **then** LCP is ≤ 2.0s.
- **Given** a category exists in the backend, **when** I click its menu item, **then** the URL becomes `/{locale}/catalog/{category-slug}` and the page shows only products in that category.
- **Given** a product has no image, **when** it renders in the grid, **then** a deterministic fallback placeholder is shown (no broken `<img>` icon).

### Story 1.2 — Switch language (with i18n addon)
**As a** Moroccan shopper, **I want to** switch the site to Arabic **so that** I can shop in my preferred language.

**Acceptance criteria:**
- **Given** the i18n addon is enabled and Arabic is in the deployment's locales list, **when** I click the AR locale switcher, **then** the URL prefix changes to `/ar`, the page reloads in Arabic, and `dir="rtl"` is applied to `<html>`.
- **Given** I have selected Arabic, **when** I navigate to any other page, **then** the locale persists (no fallback to default).
- **Given** a translation key is missing in `ar.json`, **when** the page renders, **then** it falls back to the default locale's value (no broken `{{key}}` shown to users) and a dev-mode console warning is emitted.

### Story 1.3 — Add to cart and checkout
**As an** end shopper, **I want to** add products to my cart and complete a purchase **so that** I receive my order.

**Acceptance criteria:**
- **Given** a product is in stock, **when** I click "Add to cart", **then** the cart count updates within 200ms (optimistic UI), and the cart sidebar shows the new item.
- **Given** I have items in my cart, **when** I proceed to checkout and submit a valid address, **then** the next step shows only the payment providers enabled for that deployment.
- **Given** I select "Cash on Delivery" and confirm, **when** the order is placed, **then** I see a confirmation page with the order number within 2 seconds and receive a confirmation email within 60 seconds.

### Story 1.4 — Pay with CMI (Morocco)
**As a** Moroccan shopper, **I want to** pay with my CMI bank card **so that** I don't need cash on delivery.

**Acceptance criteria:**
- **Given** CMI is enabled for this deployment, **when** I select CMI at checkout, **then** I am redirected to CMI's hosted 3DS-secure page.
- **Given** my payment succeeds on CMI, **when** CMI calls back to our endpoint with a signed hash, **then** the system verifies the hash, marks the order as paid, and redirects me to the confirmation page.
- **Given** the CMI signature is invalid, **when** the callback arrives, **then** the order is NOT marked paid, a security event is logged, and an alert is sent.

---

## Merchant Admin (Yasmine, the SMB founder)

### Story 2.1 — Add a product with translated content
**As a** merchant, **I want to** create a product once and add its Arabic translation in the same admin **so that** I don't manage two parallel catalogs.

**Acceptance criteria:**
- **Given** the i18n addon is enabled on a WC-engine deployment, **when** I open the product editor in WordPress admin, **then** I see additional fields for Arabic title and description provided by the EPIOSO companion WP plugin.
- **Given** I save a product with French and Arabic content, **when** I visit the storefront in each language, **then** the correct localized content appears within 60 seconds (ISR revalidation).

### Story 2.2 — Edit translation strings without redeploying
**As a** merchant, **I want to** fix a typo on the "Add to cart" button **so that** I don't have to email my developer for a one-character change.

**Acceptance criteria:**
- **Given** I open the EPIOSO i18n admin page, **when** I edit a string and click save, **then** the change appears on the storefront within 60 seconds without a code deployment.
- **Given** I attempt to save an empty string for a required key, **when** I click save, **then** an inline validation error is shown and the previous value is preserved.

### Story 2.3 — See an incoming COD order
**As a** merchant, **I want to** be notified instantly when a COD order arrives **so that** I can dispatch it quickly.

**Acceptance criteria:**
- **Given** the COD provider is enabled and a customer places a COD order, **when** the order is created, **then** I receive an email within 60 seconds.
- **Given** `WHATSAPP_WEBHOOK_URL` is configured, **when** the order is created, **then** a POST is sent to that URL with the order summary; failure to reach WhatsApp SHALL NOT block the order from being created.

---

## Agency Partner (Marc, the white-label buyer)

### Story 3.1 — Deploy a branded storefront for a client
**As an** agency partner, **I want to** receive a fully branded EPIOSO-built store **so that** I can hand it to my client as my own work.

**Acceptance criteria:**
- **Given** EPIOSO has filled `brand.config.ts` for my client, **when** I review the staging deployment, **then** there is zero EPIOSO branding visible in the storefront, source HTML, or meta tags.
- **Given** I receive the handoff repo, **when** I check git log, **then** commits are authored under the white-label email I specified (e.g., `dev@my-agency.com`).

### Story 3.2 — Add a custom addon for my client
**As an** agency partner, **I want to** add a custom feature (e.g., a loyalty-points display) **so that** my client's store has the differentiator they paid for.

**Acceptance criteria:**
- **Given** the addon authoring docs and the SDK, **when** my developer creates a new addon under `addons/loyalty/`, **then** enabling it via `ADDONS=...,loyalty` adds it to the build with no changes to other addons or core code.
- **Given** the new addon is disabled, **when** I rebuild the project, **then** none of its code ships in the production bundle.

---

## Mid-market CTO (Karim, Vendure engine — v1 and v1.1)

### Story 4.1 — Switch from WC engine to Vendure engine
**As a** technical buyer, **I want to** start on the WC engine and migrate to the Vendure engine later **so that** I can grow without changing agency or storefront UX.

**Acceptance criteria:**
- **Given** an existing Ecom OS deployment running on WC engine, **when** I change `ECOM_ENGINE=vendure` and point env vars at a Vendure instance with the same product catalog, **then** the storefront renders correctly with zero changes to `app/`, `features/*/ui/`, or `components/`.
- **Given** the same deployment, **when** I run the visual regression suite, **then** no UI component snapshot diff exceeds the engine-agnostic tolerance.

### Story 4.2 — Route an Agadir order to the Agadir branch (v1.1)
**As a** multi-branch operator, **I want** orders placed from Agadir to be assigned to my Agadir warehouse **so that** delivery is faster and I don't ship cross-country unnecessarily.

**Acceptance criteria:**
- **Given** the multi-branch addon is enabled and I have mapped Agadir postal codes to the "agadir" branch, **when** a shopper checks out with an Agadir address, **then** the order's `assigned_branch_id` field is set to "agadir" before persistence.
- **Given** no branch matches the customer's address, **when** the order is placed, **then** it falls back to the deployment's default branch and the fallback is logged.

---

## Developer / Maintainer (EPIOSO engineer)

### Story 5.1 — Scaffold a new client deployment
**As an** EPIOSO engineer, **I want to** scaffold a new client repo in one command **so that** I don't spend the first day setting up boilerplate.

**Acceptance criteria:**
- **Given** I run `npx create-ecom-os my-client --engine=woocommerce`, **when** the command completes, **then** a working repo exists with brand config placeholders, env-var template, and `pnpm install && pnpm dev` runs successfully without errors.
- **Given** I fill in the env vars pointing at a real WC instance, **when** I open `localhost:3000`, **then** the storefront shows that instance's products within 30 seconds.

### Story 5.2 — Enable/disable addons per deployment
**As an** engineer, **I want to** toggle addons via a single env var **so that** I don't ship features the client didn't buy.

**Acceptance criteria:**
- **Given** `ADDONS=i18n` in `.env`, **when** the app builds for production, **then** the multi-payment addon's code is tree-shaken out of the bundle (verified via bundle analyzer ≤ baseline + 5%).
- **Given** I add `multi-payment` to `ADDONS`, **when** I redeploy, **then** payment options appear in checkout without further code changes.

### Story 5.3 — Deploy to Hostinger
**As an** EPIOSO engineer, **I want to** deploy a finished build to Hostinger in one command **so that** I don't fumble SSH or PM2 configs manually.

**Acceptance criteria:**
- **Given** the deploy script is configured with the client's SSH credentials and target path, **when** I run `pnpm deploy:hostinger`, **then** the build is rsynced and the Node process is restarted automatically via PM2 with zero downtime.
- **Given** the deploy fails partway, **when** I rerun, **then** the previous version remains live (atomic deploy).

---

## Story coverage map (sanity check)

| Feature | Stories |
|---|---|
| F-01 Universal storefront | 1.1, 1.3 |
| F-02/03 Engine adapter + WC | 1.1, 1.3, 4.1, 5.1 |
| F-04 Theme config | 3.1 |
| F-05 Addon flags | 3.2, 5.2 |
| F-06 Starter template | 5.1 |
| F-09 Vendure adapter | 4.1 |
| F-10–12 i18n | 1.2, 2.1, 2.2 |
| F-13–16 Multi-payment | 1.3, 1.4, 2.3 |
| F-17 Multi-branch (v1.1) | 4.2 |
| Deploy tooling | 5.3 |

Every must-ship v1 feature has at least one acceptance-criteria-backed story.
