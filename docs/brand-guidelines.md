# Ecom OS — Brand Identity Guidelines

**Version:** 1.0 · **Date:** 2026-07-03 · **Owner:** Oussama Zaki (zakio) — EPIOSO

> Scope note: this is the identity of **Ecom OS, the platform** — how EPIOSO presents the product to buyers (SMB founders, agency partners, CTOs). It is NOT the branding of any deployed storefront; each client store gets its own identity via `apps/storefront/brand.config.ts`. Never confuse the two.

---

## 1. Brand Logic — Why Ecom OS exists as a brand

### The one-line truth
**Productized delivery, bespoke result.** Ecom OS is the pre-built 80% of every e-commerce project, so EPIOSO can ship a client's store in 2 weeks instead of 12 — at custom-build quality, without SaaS lock-in.

### Positioning statement
> For MENA brands and agencies that have outgrown templated WooCommerce sites but can't justify a six-figure custom build, **Ecom OS** is EPIOSO's pre-built e-commerce platform that delivers the speed and quality of a custom build at the price and timeline of a templated one — because the hard 80% (engines, i18n with real RTL, CMI + COD payments, security) is already built, tested, and owned by the client on delivery.

### The three defensible claims (from competitive analysis — never invent others)
1. **Dual-engine, same delivery muscle** — WooCommerce for admin familiarity, Vendure/NestJS for scale, one delivery team.
2. **MENA-native by default** — AR/FR/EN with proper RTL, CMI + Cash-on-Delivery + Stripe, multi-branch fulfillment (v1.1). Not bolted on. Built in.
3. **You own the code** — full source handoff, no monthly platform tax, no lock-in.

### What we never claim
- Not faster-to-launch than Shopify for a merchant who needs a store tonight.
- Not an enterprise SAP/Salesforce alternative.
- Not (yet) a product sold to other agencies — v1 is EPIOSO-delivered only.
- Never claim a store is "live" or a number we haven't measured.

---

## 2. Audience

| Audience | Who | What they need to hear |
|---|---|---|
| **Primary — Yasmine** (Moroccan SMB founder, 30s, FR/Darija, low-med tech) | Owns the brand, decides alone, burned by freelancers and plugin sprawl | Plain language, fixed price, fixed date, FR/AR out of the box, CMI + COD without drama |
| **Secondary — Marc** (international agency partner, EU/MENA) | White-labels EPIOSO's engineering | Predictable delivery, clean docs, invisible branding, no IP surprises |
| **Tertiary — Karim** (mid-market CTO, 2–5 in-house devs) | Outgrew Shopify, refuses black-box SaaS | Architecture diagrams, ADRs, addon SDK, source-level control |
| **Indirect — Salma** (end shopper, mobile-first, FR/AR) | Never sees the brand — sees the promise kept | Sub-2s loads on 3G, language that never flips back, no hidden delivery fees |

**Rule:** every piece of marketing must pass the Yasmine test (would she understand it without a glossary?) without failing the Karim test (would he catch us hand-waving?).

---

## 3. Brand Personality & Voice

**Personality in five words:** engineered · plain-spoken · confident · MENA-proud · anti-hype.

Ecom OS talks like a senior engineer who quotes a date and hits it. Warm enough for Yasmine, precise enough for Karim.

### Voice rules
- **Say the number.** "2 weeks to staging", "under 2 seconds on 3G", "MAD 60,000–80,000". Numbers are the brand's proof language.
- **Plain language first, jargon in parentheses.** "One storefront, swappable backend (headless architecture)" — never the reverse.
- **French/Arabic parity is content, not decoration.** Anything public ships FR-ready; AR where the audience is Moroccan SMB.
- **Confidence without adjectives.** We don't say "blazing fast" — we say "loads in under 2 seconds on a 3G connection in Casablanca."
- **Own the trade-off.** Openly say when Shopify is the better choice. It buys trust for the deals we should win.

### Do / Don't
| Do | Don't |
|---|---|
| "Live in 2 weeks. Here's why that's not a marketing number." | "Revolutionary next-gen commerce solution 🚀" |
| "You get the source code. All of it." | "Enterprise-grade synergies" |
| "CMI, cash on delivery, and Stripe — pre-wired." | "Unlimited payment integrations possible" |
| "Arabic that stays Arabic on every page." | "Multilingual support available" |
| Short sentences. Concrete verbs. | Exclamation marks, emoji in body copy, superlative stacking |

---

## 4. Logo

### Concept — "The modular grid"
The mark is a **2×2 grid of rounded tiles with one tile accented and slightly offset** — the visual of the product truth: a stable core with one swappable module (engine or addon). It reads at 16px favicon size and scales to signage.

- **Wordmark:** `ecomOS` set in Space Grotesk Medium, lowercase `ecom` + capital `OS`, tight tracking (-2%). The capital "OS" is the only emphasis — no italics, no gradients.
- **Icon:** four rounded squares (radius = 25% of tile), three in Noir, top-right tile in Ember, offset 10% outward from the grid.
- **Lockups:** horizontal (icon left of wordmark, gap = 1 tile width) and stacked (icon above, centered). Icon-only allowed at ≤ 32px contexts (favicon, avatar).

### Rules
- **Clearspace:** minimum padding on all sides = height of one grid tile.
- **Minimum size:** 24px height for lockups, 16px for icon alone.
- **Color variants:** Noir-on-light (default), White-on-Noir (dark), single-color Noir (fax/engraving cases). The Ember tile stays Ember in the two main variants; in single-color it becomes solid.
- **Never:** rotate, add drop shadows, recolor tiles per campaign, place on busy photography without the scrim (§5).
- **Files:** produce as `logo-light.svg`, `logo-dark.svg`, `icon.svg` — matching the slots `brand.config.ts` already expects.

---

## 5. Color

> **Superseded by [DESIGN.md](../DESIGN.md) §2 (v2.0, 2026-07-03)** — the five locked colors. Summary:

| Token | Name | Hex | Role |
|---|---|---|---|
| `ember` | **Ember** | `#FA7400` | Brand primary: CTAs, the swappable tile, proof numbers |
| `cacao` | **Cacao** | `#763B00` | Deep support: hovers, small accent text, depth |
| `noir` | **Noir** | `#000000` | Ink: text, dark surfaces, logo tiles |
| `blanc` | **Warm White** | `#FFFBFA` | Page/canvas background |
| `white` | **White** | `#FFFFFF` | Cards, elevated surfaces |

Key rules (full logic in DESIGN.md): Ember ≤10% of any layout; small accent text uses Cacao (Ember fails AA below display size); buttons are Ember fill + **Noir** text; Ember `#FA7400` is not EPIOSO's `#FF6B2D`; no gradients between brand colors.

---

## 6. Typography

| Role | Typeface | Weights | Why |
|---|---|---|---|
| **Display / headlines** | **Space Grotesk** | 500, 700 | Geometric, technical, distinctive — the engineered voice |
| **Body / UI** | **Inter** | 400, 500, 600 | Workhorse legibility; already the platform's default font |
| **Code / numbers-as-proof** | **JetBrains Mono** | 400, 500 | Dev credibility; used for stats, CLI snippets, KPI callouts |
| **Arabic** | **IBM Plex Sans Arabic** | 400, 500, 700 | Full weight range, excellent RTL, pairs cleanly with Inter |

All four are free Google/open-source fonts — no licensing friction for any deliverable.

### Type rules
- Headlines: Space Grotesk 700, tracking -1%, sentence case (never ALL CAPS beyond 3 words).
- Body: Inter 400, 1.6 line-height, max ~70ch measure.
- **The "proof number" pattern:** hero stats ("2 weeks", "≤ 2s", "80% reused") set in JetBrains Mono 500, Ember (Cacao at small sizes) — this is the brand's signature typographic move.
- Arabic layouts: mirror fully (true RTL), IBM Plex Sans Arabic, never mix Latin-font Arabic glyphs.

---

## 7. Visual Language & Imagery

- **Motifs:** rounded-square modular grids (from the logo), thin connector lines between tiles (the adapter pattern made visible), terminal/CLI frames for technical content.
- **Illustration over stock photography.** When photos are needed: real Moroccan urban context (Casablanca, Rabat), phones in hands, natural light — never generic laptop-and-latte stock.
- **Diagrams are brand assets.** Architecture diagrams follow the palette: Noir boxes, Ember for the storefront/core, Cacao for the swappable element. A clean diagram is our version of a glamour shot.
- **Radii:** 8px default, 12px for cards — matching the platform's own `radii` tokens.
- **Motion (GSAP contexts):** tiles that slot into place; fast in (0.3s), settled out. Nothing bounces.

---

## 8. Messaging Bank

**Tagline (primary):** `The 80% is done.`
**Tagline (secondary):** `Custom-build quality. Template timeline.`

| Context | Message |
|---|---|
| Hero, FR | « Votre boutique en ligne, livrée en 2 semaines. Code source inclus. » |
| Hero, EN | "Your store, live in 2 weeks. Source code included." |
| MENA angle | "Arabic with real RTL. CMI and cash on delivery, pre-wired. Built for how Morocco actually buys." |
| Agency (Marc) | "White-label engineering that hits the date. Your brand, our platform, clean handoff." |
| CTO (Karim) | "Headless, documented, ADR-backed. Your team extends it after we hand it over." |
| Anti-pitch | "If you need a store live tonight, use Shopify. If you need one you'll still own in five years, talk to us." |

**Boilerplate (one paragraph):**
> Ecom OS is EPIOSO's pre-built e-commerce platform: a modern Next.js storefront with swappable backend engines (WooCommerce or Vendure), built-in Arabic/French/English localization with true RTL, and payments wired for the MENA market — CMI, cash on delivery, and Stripe. Clients get a fully branded store in about two weeks and keep the complete source code. No SaaS lock-in, no monthly platform tax.

---

## 9. Application Checklist

Before any Ecom OS asset ships, verify:
- [ ] Passes the Yasmine test (plain language) AND the Karim test (technically honest)
- [ ] At least one proof number, set in the mono/Ember pattern
- [ ] Ember ≤ 10% of the layout; small accent text in Cacao
- [ ] Claims map to §1 (the three defensible claims) — nothing invented
- [ ] FR version exists if the audience is Moroccan SMB; AR mirrored RTL if AR
- [ ] Logo has clearspace and the correct light/dark variant
- [ ] No emoji in body copy, no superlatives without a number attached
