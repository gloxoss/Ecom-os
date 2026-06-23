# User & Buyer Personas — Ecom OS

Ecom OS has **two audience layers**: the buyers who commission EPIOSO to build a store on it, and the end shoppers who actually use the deployed storefront. Both must be served by v1.

---

## Buyer Personas (commission EPIOSO to build on Ecom OS)

### Persona 1 — Yasmine, the Moroccan SMB founder

**Demographics**
- 32, Casablanca, runs a fashion / cosmetics / specialty-food brand
- 5–15 employees, MAD 2–10M annual revenue
- French + Darija primarily; some English

**Job & context**
- Owns the brand, makes every important decision herself
- Currently sells via Instagram DMs + a slow WooCommerce site built by a freelancer 2 years ago
- Wants to professionalize: faster site, real checkout, proper invoicing, multiple delivery zones inside Morocco

**Goals**
- Reduce DM-based order chaos
- Look as polished as international competitors when a customer compares
- Add CMI + cash-on-delivery without months of dev work
- Bilingual storefront (FR/AR) without paying separately per language

**Frustrations**
- Freelancers ghost mid-project
- WooCommerce plugin sprawl ("every fix breaks something else")
- No one explains tech trade-offs in plain language
- Price quotes that triple after kickoff

**Tech comfort:** Low–medium. Comfortable in a WooCommerce-style admin once shown. Will not touch code or YAML.

**How she finds & uses Ecom OS**
- Hears about EPIOSO via a referral or LinkedIn case study
- Buys a "starter storefront" package; EPIOSO deploys Ecom OS (WC engine), skins it to her brand, enables FR/AR + CMI addons
- Logs into WordPress admin daily to manage products, sees the polished Next.js storefront as the customer-facing result

---

### Persona 2 — Marc, the international agency partner

**Demographics**
- 41, Paris / Berlin / Dubai-based digital agency, mid-size (10–30 people)
- Account director / production lead
- English + French; works across EU + MENA clients

**Job & context**
- Wins e-commerce projects, then has to find someone to actually build them
- Has burned trust with two prior offshore dev shops; needs a reliable engineering partner
- Margins squeezed; can't afford to lose 4 weeks of his designer's time waiting for a backend
- Already brand-owns the client relationship — needs EPIOSO to be white-label invisible

**Goals**
- Predictable delivery: "give me a date, hit the date"
- A reusable backend layer so his agency's *next* client is faster too
- Clean handoff docs his junior front-end devs can extend
- No client-facing EPIOSO branding unless he says so

**Frustrations**
- Vendors who over-promise the bleeding edge then fail to ship
- Code dumps with no documentation
- Surprise license/IP problems on client deliveries
- Time-zone friction killing daily standups

**Tech comfort:** Medium. Can read a system diagram, understand "headless," won't write code. Trusts well-structured architecture docs.

**How he finds & uses Ecom OS**
- Discovers EPIOSO via portfolio, LinkedIn, or referral from another agency
- Engages on a per-project basis: NDA, white-label commits, EPIOSO ships using Ecom OS
- Over time, Ecom OS becomes "Marc's preferred stack" — multiple clients deployed on it, each customized per brand

---

### Persona 3 — Karim, the mid-market regional brand CTO

**Demographics**
- 38, Casablanca / Dubai / Riyadh — regional retail or DTC brand
- 50–200 employees, multi-country, multi-warehouse
- Technical background, oversees a small in-house dev team (2–5 devs)

**Job & context**
- Brand has outgrown Shopify but is not ready for a million-dollar SAP Commerce build
- Needs multi-branch fulfillment routing, multiple currencies, multiple languages, advanced B2B features down the road
- Will not accept a black-box SaaS lock-in; needs source-code-level control

**Goals**
- A modern, headless, owned-stack platform
- Customization without forking from zero
- His in-house team must be able to extend it after EPIOSO finishes the initial build
- Performance + uptime SLAs that match a "real" e-commerce platform

**Frustrations**
- Shopify Plus pricing + 1.5% revenue tax
- Magento bloat
- "Custom" agency builds that leave him with unmaintainable spaghetti code
- Vendors who disappear after launch

**Tech comfort:** High. Reads architecture diagrams, demands ADRs, reviews PRs on first delivery.

**How he finds & uses Ecom OS**
- Comes in via referral or via the Vendure community (he was already evaluating Vendure)
- EPIOSO deploys the **custom Vendure-based engine** for him with multi-branch routing addon (v1.1)
- His in-house team takes over maintenance + adds business-specific plugins using the addon SDK Ecom OS exposes

---

## End-Shopper Persona (uses the deployed storefront)

### Persona 4 — Salma, the Moroccan online shopper

**Demographics**
- 26, Rabat, smartphone-first, mid-income
- Bilingual FR/AR, occasional English
- Shops on Instagram, jumia.ma, fashion brand sites

**Job & context**
- Discovers products via Instagram and TikTok
- Comparison-shops across 3–5 sites before buying anything over MAD 300
- Prefers cash-on-delivery but increasingly comfortable with CMI card payments
- Lives in a city — fast delivery matters

**Goals**
- See the price + total cost (including delivery) before checkout
- Read product info in the language she chose, not auto-translated nonsense
- Trust the site enough to enter card details
- Get the order in 24–72h

**Frustrations**
- Slow, image-heavy storefronts that hang on 3G
- Sites that switch back to French after she picked Arabic
- Hidden delivery fees revealed only at the last checkout step
- Payment failures with no explanation

**Tech comfort:** High on mobile UX, zero on technology underneath. Doesn't care if the site is on WooCommerce or Vendure — she cares that it loads in under 2 seconds and doesn't lie about delivery cost.

**How she experiences Ecom OS**
- Lands from an Instagram link on a Next.js storefront built on Ecom OS
- The i18n addon serves her chosen language consistently across every page
- Checkout offers CMI + COD via the multi-payment addon
- Site feels fast and modern — that's the only signal that matters to her

---

## Persona-to-Engine mapping

| Persona | Primary engine | Critical addons |
|---|---|---|
| Yasmine (SMB) | **WooCommerce engine** | i18n (FR/AR), multi-payment (CMI + COD) |
| Marc (Agency partner) | **Either** — depends on his client | Both addons + white-label config |
| Karim (Mid-market CTO) | **Custom Vendure engine** | i18n, multi-payment, **multi-branch routing (v1.1)** |
| Salma (Shopper) | Engine-agnostic — she sees only the Next.js storefront | i18n must be flawless |

Yasmine + Salma define the v1 success bar. Marc validates Ecom OS as a productized partnership offering. Karim is the v1.1 anchor user.
