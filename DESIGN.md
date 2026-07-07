# DESIGN.md — Ecom OS Design & Brand Identity System

**Version:** 2.0 · **Date:** 2026-07-03 · **Owner:** Oussama Zaki (zakio) — EPIOSO
**Supersedes:** the v1 Majorelle/terracotta palette in docs/brand-guidelines.md §5. This file is the single source of truth for all Ecom OS styling; the brand guide holds voice/messaging.

> Scope: the identity of **Ecom OS, the platform** (how EPIOSO presents the product). Deployed client storefronts get their own identity via `apps/storefront/brand.config.ts` — never confuse the two.

---

## 1. Brand Logic (unchanged foundation)

- **One-line truth:** Productized delivery, bespoke result. The pre-built 80% of every e-commerce project.
- **Three claims, never more:** dual-engine delivery (WooCommerce ↔ Vendure) · MENA-native by default (AR/FR/EN + real RTL, CMI + COD + Stripe) · the client owns the source code.
- **Recurring visual protagonist:** the **modular grid** — rounded-square tiles, one accented tile slightly offset: a stable core with one swappable module.
- **Personality:** engineered · plain-spoken · confident · MENA-proud · anti-hype.

---

## 2. Color System — the five locked colors

| Token | Name | Hex | Role |
|---|---|---|---|
| `noir` | **Noir** | `#000000` | Ink: headlines, body text, dark surfaces/canvases, logo tiles |
| `cacao` | **Cacao** | `#763B00` | Deep support: hover/active on Ember, text-safe accent, borders on warm surfaces, depth |
| `ember` | **Ember** | `#FA7400` | Brand primary: CTAs, links, the swappable tile, proof numbers, highlights |
| `blanc` | **Warm White** | `#FFFBFA` | Default page/canvas background — warm, never clinical |
| `white` | **White** | `#FFFFFF` | Elevated surfaces: cards, modals, input fields |

**Derived neutral (the only allowed addition):** `muted` `#F6EFE9` — a Cacao-tinted light neutral for dividers, disabled states, subtle fills. Derived, not a sixth brand color.

### Color logic — how the five relate
- **Ember is the voice, Noir is the body.** Ember appears wherever the brand "speaks": one CTA, one accented tile, one proof number. Noir carries everything structural.
- **Cacao is Ember's shadow.** Every interactive Ember element darkens to Cacao on hover/press. Cacao also replaces Ember wherever small text needs an accent (accessibility, below).
- **Warm White is the room, White is the furniture.** Pages sit on `#FFFBFA`; cards and inputs sit on `#FFFFFF` — the 1-step warmth difference IS the elevation system. No shadows needed.

### Ratios (any layout, any asset)
~60% Warm White/White · ~25% Noir · ~10% Ember · ≤5% Cacao.
Ember is a signal, not a paint bucket — if two Ember elements compete in one view, demote one.

### Accessibility (WCAG, measured)
- **Noir on Warm White / White:** 20+:1 — body text default, AAA.
- **Cacao on White:** ~8.9:1 — passes AA/AAA. **Use Cacao, never Ember, for small accent text on light backgrounds.**
- **Ember on White:** ~2.8:1 — **fails** for small text. Ember text only at display sizes (≥24px bold) or as graphic elements.
- **Noir on Ember:** ~5.5:1 — the button formula: **Ember fill + Noir text** (never white text on Ember, ~2.9:1 fails).
- **Ember on Noir:** ~5.5:1 — passes for large text/UI; the dark-mode accent formula.

### Dark mode / dark canvases
Background Noir `#000000` · text Warm White `#FFFBFA` · accents Ember · hover Cacao · hairline borders `#1F1F1F` (derived). The logo inverts: white tiles + one Ember tile (see §4).

### Hard no's
No gradients between brand colors · no opacity-faded Ember (use Cacao or muted instead) · no additional hues (success/error states in UI may use functional colors, but never in brand/marketing assets) · **do not confuse Ember `#FA7400` with EPIOSO's platform orange `#FF6B2D`** — they are different brands; check the hex, not the vibe.

---

## 3. Typography

| Role | Typeface | Weights | Usage |
|---|---|---|---|
| Display / headlines | **Space Grotesk** | 500, 700 | Sentence case, tracking −1%, never ALL-CAPS beyond 3 words |
| Body / UI | **Inter** | 400, 500, 600 | 1.6 line-height, max ~70ch measure |
| Code / proof numbers | **JetBrains Mono** | 400, 500 | Stats, CLI snippets, KPI callouts |
| Arabic | **IBM Plex Sans Arabic** | 400, 500, 700 | True RTL mirroring, never Latin-font Arabic glyphs |

**The signature move — the proof number:** hero stats ("2 weeks", "≤ 2s", "80%") set in JetBrains Mono 500, **Ember** at display size (or **Cacao** at small sizes, per §2 accessibility). This is the brand's most recognizable typographic pattern.

Type scale (marketing + docs): 48/40/32/24/18/15/13px. UI follows Tailwind defaults.

---

## 4. Logo

**Concept — the modular grid:** a 2×2 grid of rounded tiles (corner radius = 25% of tile width), **three tiles Noir, top-right tile Ember**, offset ~10% outward — the swappable module. Adjacent tiles may fuse with smooth concave metaball fillet necks (see logo-prompts style references).

- **Wordmark:** `ecomOS` — Space Grotesk Medium, lowercase `ecom` + capital `OS`, tracking −2%. No italics, no gradients.
- **Lockups:** horizontal (icon left, gap = 1 tile width) · stacked · icon-only at ≤32px.
- **Variants:** Noir tiles + Ember tile on light (default) · White tiles + Ember tile on Noir (dark) · single-color Noir (engraving/fax). Ember tile stays Ember in both main variants.
- **Clearspace:** 1 tile width all sides. **Min sizes:** 24px lockup, 16px icon.
- **Files:** `logo-light.svg`, `logo-dark.svg`, `icon.svg` — matching `brand.config.ts` slots.
- **Never:** rotate, shadow, recolor tiles per campaign, place on photography without a Noir scrim (40–60%).

---

## 5. UI Tokens — `brand.config.ts` mapping

When the Ecom OS demo/marketing storefront uses this identity:

```typescript
colors: {
  primary:    '#FA7400',  // Ember — CTAs, links (pair with Noir text on fills)
  secondary:  '#763B00',  // Cacao — prices, secondary emphasis, hover states
  accent:     '#FA7400',  // Ember — badges, highlights
  background: '#FFFBFA',  // Warm White — page canvas
  foreground: '#000000',  // Noir — body text
  muted:      '#F6EFE9',  // derived Cacao tint — dividers, disabled
},
fonts: { sans: 'Inter', mono: 'JetBrains Mono' },
radii: { sm: '4px', md: '8px', lg: '12px' },
```

**Component formulas:**
- Primary button: Ember fill · Noir text · radius `md` · hover → Cacao fill, Warm White text.
- Secondary button: transparent · Noir text · 1px Noir border · hover → muted fill.
- Links: Cacao, underline on hover (Ember only for display-size link text).
- Cards: White on Warm White, 1px muted border, radius `lg`, **no drop shadows** — the two-white elevation system does the work.
- Focus rings: 2px Ember, 2px offset.

---

## 6. Spacing, Layout & Radii

- **Grid:** strict left-aligned Swiss grid; 8px base unit; section spacing 64/96px marketing, 24/32px UI.
- **Negative space:** ≥40% of any marketing canvas. Density is for docs, not posters.
- **Radii:** 4/8/12px (matching platform tokens); logo tiles 25% of tile width.
- **Borders over shadows:** 1px muted/`#1F1F1F` hairlines. Shadows only as faint soft tile-shadows in brand illustrations.

---

## 7. Imagery & Illustration

- **Illustration over stock.** The modular grid motif, thin Cacao connector lines (the adapter pattern made visible), terminal/CLI frames.
- **Photography (when needed):** real Moroccan urban context, phones in hands, natural light. Noir scrim 40–60% before overlaying type/logo.
- **Diagrams are brand assets:** Noir boxes · Ember for the storefront/core element · Cacao for the swappable/adapter element · Warm White canvas.
- **Generated assets (Kie):** follow content/ecom-os-launch/02-identity-sheet.md — locked hexes, exact tile counts, metaball fusion style, no gradients.

---

## 8. Motion

Tiles slot into place: fast in (0.3s, ease-out), settled stop. Nothing bounces, nothing floats, no parallax excess. GSAP for storefront islands per the codebase's server/client rules.

---

## 9. Voice (pointer)

Voice, messaging bank, taglines and the Yasmine/Karim tests live in **docs/brand-guidelines.md** (§3, §8). Colors and styling there are superseded by this file. Taglines unchanged: **"The 80% is done."** / "Custom-build quality. Template timeline."

---

## 10. Pre-ship Checklist

- [ ] Only the five locked colors + derived muted — no new hues, no gradients
- [ ] Ember ≤10% of layout; small accent text uses Cacao, not Ember
- [ ] Buttons: Ember fill + Noir text (never white-on-Ember)
- [ ] Hex check: `#FA7400`, not EPIOSO's `#FF6B2D`
- [ ] Proof number present, JetBrains Mono, Ember/Cacao per size rule
- [ ] Logo: exactly 4 tiles, one Ember, correct variant for the background
- [ ] Passes Yasmine test + Karim test (brand-guidelines §2)
