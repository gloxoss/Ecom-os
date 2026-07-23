# Home Page Animations - Webflow to GSAP Conversion Guide

Companion files:
- `home-animations.json` is the machine-readable animation spec.
- `webflow-ix2-home.raw.json` is the decoded Webflow IX2 source for the home page.

The original page uses Webflow IX2 for scroll/load/hover interactions and a custom GSAP SplitText module for pill-button label hovers. The Next.js conversion expresses that motion as scoped `useGSAP` client islands, ScrollTrigger timelines, and CSS-only hover transforms where JavaScript is unnecessary.

The shared entrance island is [`src/features/landing/ui/reveal.tsx`](../../src/features/landing/ui/reveal.tsx).

## 1. Motion Language

| Recipe | Webflow source | Motion | GSAP/CSS conversion |
|---|---|---|---|
| Rise-blur-fade | `a-10`, `a-33`, `a-48`, `a-172` | `y:20`, blur, opacity 0 to identity | `data-reveal` with scoped ScrollTrigger stagger |
| Curtain wipe | `a-32` | absolute overlay `height:100%` to `0` | `data-reveal-curtain` |
| Zoom-settle | `a-31`, `a-51` | image `scale 1.3` to `1`, or slow vertical drift | `data-reveal-zoom`, `data-reveal-kenburns` |
| Roll-through | `a-27/38/40` plus SplitText | visible copy exits, duplicate enters | duplicated icon/text spans with CSS transforms |
| Fade | `a-34`, `a-46` | opacity 0 to 1 | `data-reveal-fade` |

Easing map:
- `inOutQuad` -> `power1.inOut`
- `inOutQuart` -> `power3.inOut`
- `inOutQuint` -> `power4.inOut`
- `outQuart` -> `power3.out`
- `ease/easeInOut` -> `power1.out/inOut`

Trigger map:
- `SCROLL_INTO_VIEW` -> `scrollTrigger: { start: "top bottom", once: true }`
- `SCROLLING_IN_VIEW` / `PAGE_SCROLL` -> scrubbed ScrollTrigger timeline
- `MOUSE_OVER/OUT` -> CSS hover for simple transforms; `contextSafe` GSAP for the reviews flip

## 2. First Paint

Hero load is handled by [`hero-client.tsx`](../../src/features/landing/ui/hero-client.tsx):
- Category links slide from `x:-20` with blur at 0.15s.
- Heading, description, and CTA rise-blur-fade from 0.3s onward.
- The hero image uses a scrubbed ScrollTrigger timeline: hold until 50% progress, then scale to `1.1` and drift `yPercent:-5` by 90%.

The navbar recolor remains a CSS transition/state simplification in `site-header-client.tsx`, which is close to the original first-scroll scrub without shipping an extra page-wide animation timeline.

## 3. Section Animations

| Section | Implemented behavior |
|---|---|
| Collection | Label reveal, tab-word cascade, delayed card content reveal at the 1s mark, tab-change card re-stagger |
| Feature blocks | Image zoom-settle, background curtain wipe, centered content reveal |
| Story | Text/video reveals, divider line draw, desktop advantages slide-up, mobile item stagger |
| Process | Background Ken Burns drift, text reveals, SVG circle stroke draw and number reveal |
| Quote | Primary-color curtain wipe over portrait, quote text reveal |
| Brew | Text reveals, feature fade, cup images slide in from the right |
| Reviews | Row reveal, decorative square fade, slider arrow roll, image rotateY flip on hover |
| Location | Card-level rise-blur-fade reveal |

## 4. Micro / Interactive Animations

| Interaction | Conversion | Status |
|---|---|---|
| Nav link hover | duplicated icon roll via CSS | done |
| Pill CTA hover | `RollLink` manually splits the label into character spans and rolls top/bottom copies with 20ms delays | done |
| Product card hover | CSS image scale and product-name opacity dim | done |
| Slider arrows hover | duplicated icon roll via CSS | done |
| Reviews image hover | `ReviewsImageFlip` client island with `contextSafe` GSAP repeat/yoyo tween | done |
| Tab switch | React state plus `useGSAP` dependency re-stagger | done |
| Review slide change | translateX track with 500ms CSS transition | done |

## 5. Implementation Rules

1. GSAP code lives in client islands with `useGSAP` and scoped refs.
2. ScrollTriggers are top-level tweens/timelines, created in page order, with `once: true` for IX2-style entrance reveals.
3. Reduced motion is respected through `gsap.matchMedia()`.
4. Motion uses transforms, opacity, and small blur filters. The curtain overlay height animation is absolute-positioned and does not reflow layout.
5. `useGSAP` is registered with GSAP, and matchMedia instances are reverted on cleanup.
6. Simple hover transforms stay in CSS; the spin-and-return reviews image uses GSAP because it needs a yoyo tween.

## 6. Parity Backlog

Applied on 2026-07-09:
- Hero load blur channel and hero scroll scrub.
- Collection tab cascade and late card-content reveal.
- Feature image zoom-settle and curtain wipes.
- Story divider draw and desktop/mobile advantages animation.
- Process Ken Burns drift and circle draw.
- Quote curtain, brew slide-right, product hover, slider arrow roll, reviews image flip, and per-letter CTA roll.

Remaining: none for the decoded home-page animation backlog.
