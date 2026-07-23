# About-Us Page Animations — Webflow → GSAP Conversion Guide

Companion files:
- **`about-us-animations.json`** — machine-readable spec (this doc narrates it).
- **`webflow-ix2-about-us.raw.json`** — decoded IX2 data for this page (34 events), filtered from the same site-wide registry as home/menu/contact-us.

This is the largest page migrated so far — 7 content sections plus the shared footer. Most of the motion is the established site language (`riseBlurFade`, zoom-settle, curtain wipes — all in `home-animations.md`). Two genuinely new recipes came out of this page, both added to the shared `Reveal` island so future pages get them for free.

## Design Audit (Phase 1) — what a static read of the markup got wrong

Read against the rendered original (scroll-settled screenshot, not the raw HTML) before writing any component:

1. **Journey section** — the four feature captions (*Trusted origins*, *Careful selection*, *Skilled hands*, *Pure flavor*) are **not** a separate grid beside the image, as the class names (`features-grid-large`, `features-image-wrapper` as siblings) suggested. They're a caption strip **overlaid on the bottom edge of the single large image**. Built that way from the start this time — the menu-page lesson about not trusting class names alone paid off here.
2. **Collection section** — this is a **vertical tab list** (six category names stacked, each with a small arrow), not the horizontal-tabs-plus-grid pattern used on home/menu. Clicking a tab swaps a single large image + info card on the right. A new interaction pattern, not a reuse of `ProductTabsClient`.
3. **Team section** — straightforward 4-up card grid, photo + name + role, hover reveals a small action icon. No surprises here.
4. **FAQ section** — image + description + "view all" link on the left, heading + accordion list on the right. First accordion component in the app.

## Two New Motion Recipes

**`data-reveal-parallax-zoom`** (Reveal island) — the story and journey images use a *continuous* scroll-scrubbed zoom (`a-56`): scale 1 the instant the image enters the viewport, scale 1.2 by the instant it fully leaves. This is different from the existing `data-reveal-zoom`, which settles once to a final value and stops. The distinction matters: `data-reveal-zoom` is an *entrance* animation (something happens once, then it's done); `data-reveal-parallax-zoom` is a *parallax* effect (tied to scroll position for as long as the element is visible, every scroll direction). Implementation:

```ts
gsap.fromTo(el, { scale: 1 }, {
  scale: 1.2, ease: "none",
  scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
});
```

**`data-reveal-bottom`** (Reveal island) — `slideInBottom`, the third member of the site's slide-in family (siblings: `slideInRight` on home/contact's brew-pattern sections, `slideInLeft` on menu's guide). Used here for the FAQ accordion rows: each rises `y: 100px → 0` with a fade, staggered 0.1s apart, `power3.out`, 1000ms — the exact same shape as its siblings, just vertical instead of horizontal.

## New Interaction: The Vertical Collection Showcase

`about-collection-client.tsx` is a fresh component (not a `ProductTabsClient` variant) because the interaction is genuinely different: a vertical list of category buttons on the left, and a single image + overlaid info card on the right that **cross-fades** when you click a different category. The original's `a-58` action list (a plain 500ms opacity fade) was repurposed for this swap — same timing the source used for the tabs-wrap's own scroll entrance, reused here for the panel-swap-on-click since Webflow's native tab behavior doesn't define its own transition and this felt like the right call — consistent, unobtrusive polish.

## New Interaction: The FAQ Accordion

`about-faq-client.tsx` — the app's first accordion. Deliberately **not** built with GSAP: expand/collapse uses a pure CSS `grid-template-rows: 0fr → 1fr` transition (the standard modern CSS-only accordion technique — no `height: auto` hacks, no JS measuring). This keeps the interaction instant and jank-free without spending a GSAP timeline on something CSS already does well. The *entrance* of each row onto the page (as you scroll to the section) is the separate `slideInBottom` motion described above — two different animations serving two different moments (entrance vs. interaction), correctly kept independent.

## Shared Component Extraction

**`LocationSection` moved to `components/shared/`.** This page's closing section is structurally identical to home's — same video/image background, same label/heading/CTA/address/divider layout, same `riseBlurFade` reveal. Since it's now the second page needing it verbatim, it was promoted out of `features/landing/ui/` (same threshold used for `ProductTabsClient` and `CtaCollage` in earlier migrations: one bespoke instance is fine, a second literal duplicate gets extracted).

## Known Gap

The **curtain-wipe reveal** (`a-32`) on the journey section's image and the collection panel's image is not yet implemented — both currently rely on the shared `Reveal` fade rather than the dedicated overlay-collapse effect built for home's feature-blocks section (`data-reveal-curtain`). Porting it here is mechanical (see `feature-blocks-section.tsx` for the exact pattern: an absolute `bg-background` div starting at `h-0` inside the image container) — flagged as a follow-up rather than blocking the page.

## Animation Summary

| Element | Recipe | Status |
|---|---|---|
| Navbar | scroll recolor | shared, implemented |
| Hero heading/label/description/CTA | riseBlurFade | implemented |
| Story text + both images | riseBlurFade + parallaxZoomContinuous | implemented |
| Journey text + image | riseBlurFade + parallaxZoomContinuous | implemented (curtain wipe: todo) |
| Collection text + tab list | riseBlurFade | implemented |
| Collection panel swap | tabPanelFade (custom, click-driven) | implemented (curtain wipe: todo) |
| Team text + cards | riseBlurFade | implemented |
| Team photo hover | scale 1.08 (CSS) | implemented |
| FAQ image/description/link | riseBlurFade | implemented |
| FAQ rows | slideInBottom | implemented |
| FAQ expand/collapse | CSS grid-rows transition | implemented |
| Location strip | riseBlurFade (shared component) | implemented |
