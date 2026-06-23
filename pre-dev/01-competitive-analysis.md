# Competitive Analysis — Ecom OS

Ecom OS is **not a product sold to merchants**. It is an **internal accelerator** that EPIOSO uses to win e-commerce projects. So "competitors" fall in two layers:

1. **Stack-level competitors** — the open-source headless engines and templates EPIOSO could have used instead of building Ecom OS. (These are also partly *inputs*: we fork Vendure and use Next.js.)
2. **Market-level competitors** — agencies and platforms that compete for the same client budgets EPIOSO is chasing.

---

## 1. Stack-Level Competitors (engines & templates)

| Solution | Stack | License | Strengths | Weaknesses | Why we don't fully rely on it |
|---|---|---|---|---|---|
| **Vendure** | TypeScript / NestJS / GraphQL | GPLv3 + commercial | Clean modular architecture, plugin license exception, strong typing, B2B/multi-channel/marketplace fit | GPLv3 friction if core is forked & redistributed; smaller ecosystem than Medusa | **Use as the v2 engine** — wrap, don't fork core |
| **Medusa.js** | Node, REST-first | MIT | Largest JS mind-share, fast plugin velocity, DTC-friendly | Less structured for enterprise; cloud still maturing | Considered; Vendure wins on architecture rigor and B2B fit |
| **Saleor** | Python / Django / GraphQL | BSD-3 + cloud | Mature i18n, multi-channel out of the box, enterprise-grade GraphQL | Python stack alienates EPIOSO's TS/JS skillset | Rejected — would force a stack EPIOSO doesn't deploy elsewhere |
| **Next.js Commerce 2.0** | Next.js + Shopify | Free template | Fastest path to a polished Shopify storefront; great DX | **Shopify-only**; not a product, just a reference | Use as inspiration for the universal frontend |
| **Shopify Hydrogen + Oxygen** | React/Remix + Shopify edge | Bundled w/ Shopify Plus (~USD 2,300+/mo) | Tight integration, edge perf, AI-commerce ready | Vendor lock-in; Plus pricing; non-portable | Not competitive on cost or sovereignty for our segment |

**Decision:** Universal Next.js frontend + WooCommerce REST/GraphQL adapter (engine 1) + Vendure with custom plugins (engine 2). All Ecom OS-specific logic lives in plugins/addons, never in forked core.

---

## 2. Market-Level Competitors (who EPIOSO's clients also evaluate)

| Competitor | What they sell to the same buyer | Strengths | Weaknesses | Where EPIOSO wins |
|---|---|---|---|---|
| **Custom WooCommerce builds** (most Moroccan agencies) | Per-project templated WP/Woo at MAD 15K–60K | Cheapest; familiar admin; ubiquitous local talent | Performance ceiling, plugin sprawl, dated DX, no headless | EPIOSO's WC engine delivers the same admin Yasmine knows + a Next.js storefront that's visibly faster |
| **Boutique Moroccan agencies** (Web Success, Twice Box, MarketMedia, ~100 others) | Full-service web/digital + e-commerce | Local presence, FR/AR fluency, established books | Mostly templated WP/Woo; no headless capability; no productized accelerator | EPIOSO ships in 2 weeks what they ship in 8, with better stack |
| **Shopify (standard plans)** | SaaS storefront at USD 29–399/mo + apps | Fastest setup, biggest app ecosystem, AI-ready | Monthly fees stack fast; 2% transaction fee on non-Shopify Payments; weak MENA payment defaults; lock-in | EPIOSO owns the code; CMI/COD pre-wired; no per-order tax |
| **Shopify Plus + Hydrogen** | Enterprise headless on Shopify | Edge performance, AI commerce, robust | USD 2,300+/mo floor; still locked to Shopify; complex to escape | EPIOSO's Vendure engine offers comparable headless at no SaaS floor, with source-code ownership |
| **WordPress.com / Woo SaaS** | Hosted Woo at USD 25–70/mo | One-click setup | Limited customization; same Woo limits | Same Yasmine wins as above |
| **Other regional starter kits** | None productized in MENA today | — | — | Window is open for ~12–18 months |
| **International dev shops** (EU/US) | Custom headless builds at USD 50K–250K | Top-tier engineering | 3–5x EPIOSO's cost; no MENA payment/localization expertise | EPIOSO wins on price + MENA fluency for agency partners (Marc persona) |

---

## 3. Positioning Gaps — Where EPIOSO Wins

Three defensible angles where Ecom OS has clear daylight:

### Gap 1 — "Dual-engine, same delivery muscle"
No competitor (local or international) offers both a **WC-based path for SMB familiarity** and a **headless Vendure path for scale** under one delivery org. Boutique agencies do one or the other. International OSS players champion only their own stack. EPIOSO can match the client to the right engine without re-skilling.

### Gap 2 — "MENA-native addons"
Pre-built **i18n with AR/FR/EN + RTL**, **CMI + COD + Stripe routing**, and (in v1.1) **multi-branch fulfillment**. Generic templates (Next.js Commerce, Hydrogen, Medusa starters) assume Stripe + LTR English. This is a concrete moat that compounds: every Moroccan/MENA client we ship makes the next one cheaper.

### Gap 3 — "Agency accelerator, not a SaaS"
EPIOSO doesn't sell software seats. Ecom OS exists so EPIOSO can underbid on delivery time and overbid on engineering quality. Competitors are either SaaS (Shopify) charging monthly forever, or boutique agencies hand-rolling each site from scratch. Ecom OS occupies the unclaimed middle: **productized delivery, bespoke result.**

---

## 4. What we are NOT competing on

- **Not competing with Shopify on out-of-the-box speed.** Shopify wins for a merchant who needs a store live tonight.
- **Not competing with SAP/Salesforce Commerce.** Different budget bracket, different decision-makers.
- **Not selling Ecom OS as a product to other agencies in v1.** That's a v2+ conversation; v1 is internal-only.

---

## 5. Defensibility over time

The competitive position will hold for 12–18 months without major investment. After that, defensibility comes from:

- **Addon library depth** — every new client adds one new addon that the next client gets for free.
- **MENA-specific integrations** (CMI, regional shipping APIs, COD aggregators) that international competitors won't bother building.
- **Operational track record** — case studies of 5+ live Ecom OS deployments matter more than the codebase itself.
