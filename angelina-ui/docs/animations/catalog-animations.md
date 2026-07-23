# Catalog Page Animations — Webflow → GSAP Conversion Guide

Companion files:
- **`catalog-animations.json`** — machine-readable spec (this doc narrates it).
- **`webflow-ix2-catalog.raw.json`** — decoded IX2 data for this page (29 events), filtered from the same site-wide registry as home/menu/contact-us/about-us.

**Source note:** this page is built from `localized-html/coffee.html`, not a `coffee.html`-named route — the pre-existing placeholder at `src/components/sections/catalog-view.tsx` explicitly said *"Migrate properly from localized-html/coffee.html"*, so this became the `/catalog` route rather than a new one.

## Design Audit (Phase 1) — the pass where the screenshot mattered most

This page was the clearest reminder yet that CSS class names describe *what a Webflow author called something*, not *how it renders*. Three real mismatches surfaced only after screenshotting the scroll-settled original:

1. **Hero.** The class names (`clip-photo-wrap`, `intro-photo`) read like a small decorative photo alongside the text — that's what got built first. The rendered original is a **full-bleed background-image hero**: description top-right, heading + CTA pinned bottom-left, a dark gradient fading into the page background. Rebuilt to match (same composition family as about-us's hero).
2. **Collection items.** Assumed an alternating left/right layout (image swaps sides per item, like home's brew section). The original keeps **every single one of the 6 items in the same orientation** — text card always left, image always right, no alternation. Also: the text block sits inside a **bordered card** (not floating text), and the benefit tags render as **filled pill chips with a small icon**, not the outlined flowing pills first built.
3. **Journal teaser.** Assumed three equal-sized cards. The original is an **asymmetric 2-column grid**: one large featured article (image with the title overlaid directly on a dark gradient scrim) beside two smaller stacked articles (image + plain text below, no overlay).

All three were caught and fixed in the same pass, using the project's now-standard verification loop: build → screenshot the rebuild → compare against a scroll-settled screenshot of the original → fix real mismatches → rebuild → confirm.

## New Recipe: Continuous Hero Parallax

`a-138` scales and drifts the hero's background photo for the *entire* time the hero is in view — not a one-shot settle, a true scroll-scrubbed effect:

```ts
gsap.fromTo(photo,
  { scale: 1.08, yPercent: -3 },
  { scale: 1.1, yPercent: 5, ease: "none",
    scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom top", scrub: true } }
);
```

Same family as home's hero-exit scrub, just applied to a full-bleed background image instead of a hero illustration, and active across the *entire* hero (not just its exit).

## Reused, Not Reinvented: The Collection-Item Reveal

`a-146` (the entrance for each of the 6 collection items) is a genuinely rich choreography — a self-contained curtain wipe *plus* a 5-second image zoom-out, combined. Rather than adding a third near-duplicate zoom recipe to `Reveal.tsx` (the existing ones run 1.5s and 10s), this page reuses the existing `data-reveal-curtain` + `data-reveal-zoom` pair together on each image. The duration difference (1.5s vs. the source's 5s) is not perceptible enough to justify a bespoke recipe — a deliberate simplification, not an oversight.

## Micro-Interactions

| Element | Original | Conversion |
|---|---|---|
| Journal card image | scale 1 → 1.07 on hover | CSS `group-hover:scale-[1.07]` — same technique as product-card hover elsewhere, ~1% less zoom to match the source |
| Journal card title | opacity 1 → 0.7 on hover | CSS `group-hover:opacity-70` |

Both are simple enough that the established CSS group-hover pattern (already used for product cards, team photos) covers them without any new GSAP code.

## Responsive Note

The source scopes the collection-item entrance (`a-146`) to `[main, medium]` only — small/tiny breakpoints skip the curtain + zoom choreography entirely, likely because the effect reads poorly once the image column collapses under the text card at narrow widths. The GSAP conversion doesn't special-case this: the shared `Reveal` recipes fire the same tweens regardless of viewport width, which just means mobile gets a slightly richer entrance than the original intended rather than a broken one — an acceptable simplification, noted rather than silently dropped.

## Animation Summary

| Element | Recipe | Status |
|---|---|---|
| Navbar | scroll recolor | shared, implemented |
| Hero text | riseBlurFade | implemented |
| Hero photo | continuous parallax (new) | implemented |
| Collection item text | riseBlurFade | implemented |
| Collection item image | curtain wipe + zoom (reused) | implemented |
| Journal header | riseBlurFade | implemented |
| Journal cards | riseBlurFade | implemented |
| Journal card hover | CSS scale + opacity | implemented |
| Location strip | riseBlurFade (shared component) | implemented |
