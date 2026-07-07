# Section 12: Pilot Client — Angelina Paris Casablanca

## Overview
First real website shipped on Ecom OS. Angelina Paris franchise branch (Casablanca) — patisserie e-commerce: WooCommerce as CMS/backend, Ecom OS Next.js storefront as the client-facing site. French-only at launch, COD payment, order-status notifications to the customer. This is the "Gate A pilot-client check" the kit plan was waiting for.

**Commercial scope:** `docs/clients/angelina/devis-angelina-casablanca-ecommerce.html` (Pack Essentiel 6 900 MAD — devis pending signature). Options sold separately: CMI (+3 500), realtime tracking page (+4 000), Arabic version (+2 500).

## Risk: [yellow] — depends on kit sections 01–07 being done; franchisor brand authorization is an external blocker

## Dependencies
- Depends on: 01 (engine interface), 02 (brand config), 05 (home/catalog/PDP), 06 (cart/checkout COD), 10 (deploy) — partially
- Blocks: nothing in the kit; blocks Angelina go-live
- External blockers: franchisor written authorization, brand kit, product photos, signed devis + deposit
- Deferred with the client's options: 08 (i18n/AR), 09 (multi-payment/CMI)

## Delivery mapping — kit section → Angelina deliverable

| Kit section | Angelina deliverable |
|---|---|
| 02 Brand config | `brand.config.ts` + tokens from Angelina charte (fonts, gold/cream palette per official kit) |
| 05 Home·Catalog·PDP | Editorial home, patisserie catalog (~30 products), PDP with allergens field |
| 06 Cart·Checkout·COD | COD checkout, Casablanca delivery zones + fees, min order amount |
| 07 Account·Auth | Order history = customer-facing order status (v1 "tracking") |
| 10 Deploy | ADR-008 co-hosting on Hostinger: `angelina-domain` → storefront, `cms.` → WordPress |

## Angelina-specific tasks

<task type="auto" id="12-01">
  <name>WordPress + WooCommerce backend setup</name>
  <files>infra only (no repo code); docs/clients/angelina/setup-notes.md</files>
  <action>Provision WP + WooCommerce + WPGraphQL on Hostinger (cms subdomain). Configure: FR locale, MAD currency, COD gateway, Casablanca shipping zones/fees, order statuses (received → preparing → out-for-delivery → delivered). Create product categories per client answers.</action>
  <verify>WPGraphQL products query + REST order creation both succeed from storefront .env</verify>
  <done>Storefront runs against real Angelina WC instance instead of FakeEngine</done>
</task>

<task type="auto" id="12-02">
  <name>Angelina brand.config.ts + content integration</name>
  <files>apps/storefront/brand.config.ts, src/styles/brand.tokens.css (generated)</files>
  <action>Apply official Angelina charte (blocked on brand kit from franchisor). Integrate up to 30 products with photos, descriptions, prices, allergens. French copy for home, boutique page (address, hours, map), legal pages (CGV, mentions légales with ICE).</action>
  <verify>pnpm verify passes; visual pass vs charte on mobile + desktop</verify>
  <done>Site is unmistakably Angelina, zero placeholder content</done>
</task>

<task type="auto" id="12-03">
  <name>Order-status notifications (v1 "tracking")</name>
  <files>WP side: mail templates / WhatsApp notification plugin config; docs/clients/angelina/setup-notes.md</files>
  <action>On each WC order-status change, notify the customer (email + WhatsApp link/template) and alert staff on new orders. ponytail: WC-native status emails + a WhatsApp notification plugin — the custom realtime tracking page is the paid +4 000 MAD option, not v1.</action>
  <verify>Place a test order, walk it through all 4 statuses, confirm customer + staff notifications fire</verify>
  <done>Client can track order progress without calling the shop</done>
</task>

<task type="auto" id="12-04">
  <name>Go-live: domain, hosting, training</name>
  <files>ecosystem.config.js / deploy scripts per section 10</files>
  <action>Register domain (pending client answer .ma/.com), deploy per ADR-008 Mode A (Node/PM2) or Mode B (static) depending on Hostinger plan. SSL, backups, Google Business link. 1h training session + one-page FR admin guide for daily order management.</action>
  <verify>Real order placed on production domain end-to-end; Lighthouse mobile ≥ 90</verify>
  <done>Live, client autonomous, maintenance retainer starts</done>
</task>

## Gate A checklist (pilot-client check)
- [ ] Devis signed + 50% deposit received
- [ ] Franchisor authorization + brand kit received
- [ ] Cadrage questionnaire (devis page 3) completed
- [ ] Kit sections 01, 02, 05, 06 accepted before starting 12-02
