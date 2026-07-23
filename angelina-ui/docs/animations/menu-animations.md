# Menu Page Animations — Webflow → GSAP Conversion Guide

Companion files:
- **`menu-animations.json`** — machine-readable spec (this doc narrates it).
- **`webflow-ix2-menu.raw.json`** — decoded IX2 data for the menu page (38 events, 10 action lists), filtered from the same site-wide registry documented in `webflow-ix2-home.raw.json`.

The menu page reuses most of the home page's motion language — the same `riseBlurFade`, product-hover, and tab-cascade recipes apply verbatim (see `home-animations.md` §1 for the dictionary; not repeated here). What's unique to this page is worth its own read: a **per-letter hero title reveal**, a **mirrored slide-in** direction for the guide images, and the page's centerpiece — a **scroll-scrubbed image collage** that explodes, settles, and exits, plus an **idle orbit loop** that keeps it alive between scrolls.

---

## 1. What Changed From the First Migration Pass

The page was already scaffolded (hero, catalog, guide, cta), but diverged from both the original design and the codebase's own conventions:

- **Guide section** used an invented "sticky portrait crop" layout. The original — and now the rebuild — mirrors the home page's *brew* section exactly: subtitle + title + 2-column feature grid + pill CTA on one side, two overlapping product shots on the other.
- **CTA copy and imagery** were untouched Beano-coffee placeholders ("Ready to enjoy Beano", `images.unsplash.com` stock photos) sitting next to a page that had already been rebranded to Maison Angelina everywhere else. Rewritten to match the established brand voice, sourced entirely from local `/assets/angelina/` files.
- **Undefined CSS custom properties** (`--color-fg`, `--color-bg`, `--color-surface`, `--color-fg-muted`) were used throughout the guide and CTA — none of these exist in `globals.css` (the real tokens are `--foreground`/`--background`/`--primary`/etc., see the theme's `@theme inline` block). Every occurrence is now a real token.
- **Duplicated tab/grid logic** — the catalog reimplemented ~180 lines that were already in the home page's collection component, only different at the tab font-size. Extracted into one shared `src/components/shared/product-tabs-client.tsx` (`size="lg" | "md"`), used by both pages now.
- **A raw `<a>` tag** on the CTA button, styling reimplemented from scratch instead of reusing `RollLink`.

---

## 2. Loading Animations

| Element | Original | Timing |
|---|---|---|
| Hero title | letters rise out of per-character overflow-hidden masks (custom SplitText, not IX2) | 1.2s, stagger 0.04, power4.out |
| Hero description | riseBlurFade (`a-48`) | 1s power3.out, starts 0.8s before the title finishes |
| CTA image collage | ambient 25s orbit loop (`a-113`, `PAGE_START`) | infinite, ease:none |

The hero's letter-mask reveal is a genuinely different technique from the home page's whole-word stagger — each character sits in its own `overflow-hidden` span starting at `translateY(100%)`, and GSAP animates them to `0%` in a tight per-letter cascade. It reads as more "typeset" than home's softer word-level rise, which fits a menu page's more structured, list-like tone.

## 3. Macro Animations (scroll-driven)

**Catalog** — identical to home's collection: tab words cascade (`a-171`), then the card grid rises late, then cards re-stagger on every tab switch. The only difference is scale (`text-xl`→`text-3xl` vs home's `text-3xl`→`text-5xl`) — now expressed as a `size` prop on the shared component instead of a second copy of the logic.

**Guide** — subtitle/title/features/button rise together (`a-48`/`a-33`); the two product shots slide in from the **left** (`slideInLeft`) — the mirror image of home's brew section, which slides its cups in from the right. Same recipe, opposite direction, because the two sections face opposite layout orientations in the original site.

**CTA — the page's signature move.** A single continuous `SCROLL_PROGRESS` interaction (`a-112`) scrubbed across the entire pinned scroll range:

1. **0–15%**: the center title holds at `scale(1.2)` — oversized, as if the viewer is zoomed in.
2. **15–25%**: the title eases down to `scale(1)`.
3. **20–26%**: the 8-image collage — invisible and scattered until now — fades in already spread into a wide "burst" position (each image's offset decoded straight from the source as `xPercent`/`yPercent`, since Webflow's percentage transforms map 1:1 onto GSAP's).
4. **26–70%**: every image drifts inward from its burst position to a much tighter "settled" arrangement — the explosion resolves into a composed collage.
5. **70–80%**: the whole collage — now settled — exits upward (`yPercent: -100`) as the section unpins.

This is built as **one scrubbed timeline** (not eight independent ScrollTriggers) attached to the outer 200vh sticky wrapper, per the ScrollTrigger rule of keeping scroll-linked animation on a single top-level timeline. Position parameters (`0.15`, `0.2`, `0.26`, `0.7`) map the original's 0–100% keyframes onto GSAP's 0–1 timeline scale.

**The idle orbit** (`a-113`) is independent of scroll entirely — it fires once on page load and loops forever: the collage wrapper rotates a full 360° over 25 seconds while every individual image counter-rotates −360° over the same span, so each photo stays visually upright while its *position* slowly drifts around the collage's center. It's a small detail, but it's why the CTA still feels alive if you stop scrolling and just look at it.

## 4. Micro / Interactive

Same table as home (product-card hover, tab clicks) — see `home-animations.md` §4. Nothing menu-specific here beyond what's already shared through `ProductTabsClient`.

## 5. The Responsive Simplification (worth calling out)

On small/tiny breakpoints, the original **drops the percentage-based collage math entirely** and swaps in a plain `riseBlurFade` on the title and (only 3 of the 8) images. That's a deliberate original design choice — the burst/settle percentages are tuned against a specific viewport-relative image size that doesn't hold up on narrow screens, so rather than fight it, the interaction is simplified outright.

The GSAP conversion honors this with a `gsap.matchMedia()` `isDesktop` branch in `menu-cta-client.tsx`: desktop gets the full scrub + orbit; everything below `768px` gets a single staggered rise-blur-fade covering the title and all 8 images (simpler than the original's 3-image subset, since dropping 5 images outright reads as an oversight rather than a deliberate choice once you're already simplifying).

## 6. Implementation Notes

- `menu-cta-client.tsx` queries its DOM via `data-cta-wrapper` / `data-cta-content` / `data-cta-images` / `data-cta-image` attributes rather than class-name selectors — keeps the GSAP island decoupled from Tailwind's utility classes.
- The explosion/settle timeline and the orbit loop are two **separate** `gsap.to` calls — the orbit is unconditional (once desktop + motion is allowed) while the scrub timeline is scroll-gated; keeping them separate means the orbit doesn't need to be re-derived from timeline progress.
- Everything animates only `transform` (`x`/`y`/`xPercent`/`yPercent`/`rotation`/`scale`) and `opacity` — no `width`/`height`/`top`/`left`, per the project's animation rules.
- `prefers-reduced-motion` is checked once via `gsap.matchMedia()` and short-circuits the entire effect, consistent with every other client island in the app.
