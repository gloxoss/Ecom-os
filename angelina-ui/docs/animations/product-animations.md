# Product Page Animations — Webflow → GSAP Conversion Guide

Companion files:
- **`product-animations.json`** — machine-readable spec (this doc narrates it).
- **`webflow-ix2-product.raw.json`** — decoded IX2 data for this page (32 events), filtered from the same site-wide registry as every other page.

**Source note:** built from `localized-html/product/sagebrush.html`, a per-product static export. The route (`/product/[slug]`) generalizes that single source across all 12 mock products via `generateStaticParams`.

## Design Audit (Phase 1)

Structurally close to the source: image column left, info column right (specs, price, Add to Cart, description, accordion), related products strip, shared location closer. No layout mismatches surfaced this time — the interesting work was in the interactions, not the composition.

## New Recipe: Magnify Zoom Lens

`a-122`/`a-123` (hover in/out) + `a-124` (continuous `MOUSE_X`/`MOUSE_Y`) — the page's signature interaction and the reason this page needed real GSAP rather than pure CSS. On hover, a hidden `.zoom-modal` fades in over the product photo (opacity 0→1, scale 0.25→1). While hovered, a 3×-scaled copy of the photo pans opposite the cursor — moving right pans the zoomed image left, the classic e-commerce loupe effect.

```ts
const moveX = gsap.quickTo(zoomedImg, "xPercent", { duration: 0.3, ease: "power2.out" });
const moveY = gsap.quickTo(zoomedImg, "yPercent", { duration: 0.3, ease: "power2.out" });

container.addEventListener("mousemove", (e) => {
  const rect = container.getBoundingClientRect();
  const fracX = gsap.utils.clamp(0, 1, (e.clientX - rect.left) / rect.width);
  const fracY = gsap.utils.clamp(0, 1, (e.clientY - rect.top) / rect.height);
  moveX(fracX * -66.7);
  moveY(fracY * -66.7);
});
```

`quickTo` matters here specifically because `mousemove` fires far more often than a scroll or click handler — creating a fresh tween per event would stack and stutter. `quickTo` reuses one tween instance and just retargets it, which is the correct GSAP pattern for any high-frequency input.

Gated behind `(hover: hover) and (prefers-reduced-motion: no-preference)` via `gsap.matchMedia()`, so touch devices (no real hover) and reduced-motion users get the plain static photo instead of a dead or unwanted hover affordance.

Implementation: `src/features/product/ui/product-zoom-image.tsx`. Verified with a real Playwright mousemove test — moving the cursor toward a corner produced a non-identity CSS transform matrix on the zoomed layer, and lens opacity flipped 0→1→0 across enter/leave.

## Reused, Not Reinvented

- Navbar recolor, hero block riseBlurFade, related-product card hover (scale 1.08), and the location strip are all the same shared recipes/components documented in earlier pages — not redefined here.
- The related-products "slider" is a native CSS `scroll-snap-x` track with `scrollBy()`-driven prev/next buttons, not a reimplemented `translateX` carousel — same visual arrow-roll-through hover lifted directly from `reviews-client.tsx`.
- The description/shipping/returns accordion reuses the new shared `Accordion` component (`src/components/shared/accordion.tsx`), extracted from about-us's FAQ during this page's build — this is the second page to need an expand/collapse pattern, which is this project's threshold for promoting a component to shared.

## New, Not From the Source

Add to Cart is genuine new functionality — the static template had no real cart. `add-to-cart-button.tsx` wires directly into the existing Zustand `cart-store`, with a 1.8s "Added to bag" text swap for feedback. Verified by reading `localStorage["cart-storage"]` after a real click and confirming the correct product id, quantity, and price landed in it.

## Known Simplification

The source staggers each accordion row in with its own `slideInBottom` as it scrolls into view. Here the whole info column (title, price, description, accordion) already rises as one `data-reveal` block, so per-row stagger was left out — the block-level reveal reads as sufficient and adding a second, finer-grained reveal on top would be redundant motion. Marked `todo` in `product-animations.json` if this is ever worth revisiting.

## Animation Summary

| Element | Recipe | Status |
|---|---|---|
| Navbar | scroll recolor | shared, implemented |
| Product photo | magnify zoom lens (new) | implemented |
| Image column | fade | implemented |
| Title/notes, price+specs, description | riseBlurFade | implemented |
| Accordion rows (per-row stagger) | slideInBottom | todo — block-level reveal used instead |
| Add to Cart | real cart-store wiring (new, not in source) | implemented |
| Accordion expand/collapse | shared `Accordion` component (CSS grid-rows) | implemented |
| Related products header | riseBlurFade | implemented |
| Related product card hover | CSS scale | implemented |
| Related products slider arrows | CSS scroll-snap + arrow roll-through | implemented |
| Location strip | riseBlurFade (shared component) | implemented |
