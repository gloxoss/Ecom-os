# Theme Notes — Angelina

## Palette
Defined once in `src/app/globals.css` `:root` (HSL channel triplets, contract §4):
- `--background` white `#ffffff` · `--foreground` warm brown `#3f100a`
- `--primary` café `#aa631a` · `--secondary`/`--card` gold `#c69951`
- `--accent` vieux rose `#ffcebf` · `--muted` old peach `#d9a594`
- `--border`/`--input` soft peach `#fff5f2` · `--ring` café

## Fonts
- Headings: `Sentient Variable` self-hosted at `src/fonts/`, loaded via `next/font/local` in layout.tsx (`--font-sentient`), exposed as `font-heading`. Applied to all h1–h6. Fallback: Palatino Linotype.
- Body: `Inter Tight Variable` self-hosted, `--font-inter-tight` → `font-body` (fallback Arial). Overline/labels: 14px uppercase medium, `tracking-[1.4px]`.
- Debug: `npm run debug:fonts [url]` (scripts/check-fonts.mjs) crawls a running instance and reports HTTP status + size for every declared font file.

## Radius
- Base `--radius: 1rem` (cards `rounded-2xl` = 16px), pills `rounded-full` for all CTAs/badges.
- Shadows: warm-tinted only — `0 2px 10px 0 rgba(0,0,0,0.11)`.

## Animation Inventory
Full Webflow→GSAP conversion specs live in `docs/animations/` — one JSON + one MD per migrated page, plus the decoded IX2 raw data:
- `home-animations.md`/`.json` + `webflow-ix2-home.raw.json` — home page (31 animations, all implemented).
- `menu-animations.md`/`.json` + `webflow-ix2-menu.raw.json` — menu page (11 animations, all implemented). Introduces the per-letter hero title reveal, the `slideInLeft` mirror, and the CTA's scroll-scrubbed image-collage explosion/settle/exit choreography + idle 25s orbit loop.
- `contact-us-animations.md`/`.json` + `webflow-ix2-contact-us.raw.json` — contact-us page (7 animations, all implemented). First page to reuse the CTA collage as a shared component (no orbit, matching its source).
- `about-us-animations.md`/`.json` + `webflow-ix2-about-us.raw.json` — about-us page (largest yet: hero, story, café-colored journey block, vertical category showcase, team grid, FAQ accordion, location strip). Introduces `data-reveal-parallax-zoom` (continuous scroll-scrubbed zoom, distinct from the one-shot `data-reveal-zoom`) and `data-reveal-bottom` (`slideInBottom`, third member of the slide-in family alongside left/right). One known gap: the curtain-wipe reveal on the journey/collection images isn't ported yet (noted as todo in the doc).
- `catalog-animations.md`/`.json` + `webflow-ix2-catalog.raw.json` — `/catalog` route, built from `localized-html/coffee.html` (the pre-existing placeholder named this file explicitly as its migration source). Full-bleed continuous-parallax hero, 6 consistently-oriented (no alternation) collection items each in a bordered card with filled icon chips, and an asymmetric journal teaser grid (one large featured card + two smaller). Screenshot QA caught and fixed three real layout mismatches from the initial class-name-driven build — see the doc's "Design Audit" section.
- `product-animations.md`/`.json` + `webflow-ix2-product.raw.json` — `/product/[slug]` route, built from `localized-html/product/sagebrush.html` and generalized across all 12 mock products via `generateStaticParams`. Introduces the `magnifyZoomLens` recipe (hover-driven `gsap.quickTo` pan of a 3×-scaled photo copy, gated to `(hover: hover)` devices only). Real Add to Cart wiring into the Zustand cart-store (genuine new functionality, not in the static source). One known simplification: per-row accordion stagger skipped in favor of the existing block-level reveal — see the doc's "Known Simplification" section.
- `features/landing/ui/reveal.tsx` — shared scroll-reveal island (GSAP ScrollTrigger), used by every migrated page. Children opt in via `data-reveal*` attributes (rise-blur-fade, fade, zoom, parallax-zoom, curtain, slide-left/right/bottom, line-draw, SVG stroke-draw, Ken Burns). Respects `prefers-reduced-motion` via `gsap.matchMedia`.
- `components/shared/product-tabs-client.tsx` — shared category-tab + product-grid island (tab-word cascade, card stagger, hover zoom), used by both the home collection section and the menu catalog via a `size="lg"|"md"` prop.
- `components/shared/cta-collage.tsx` + `cta-collage-client.tsx` + `cta-collage-config.ts` — shared scroll-pinned image-collage closing CTA (menu, contact-us), config-driven with a dev-only debug panel (`cta-collage-debug-panel.tsx`, gear icon bottom-right, `npm run dev` only).
- `components/shared/location-section.tsx` — shared video/image-background closing location strip (home, about-us).
- `components/shared/roll-link.tsx` — CSS-only per-letter dual-text hover roll on all pill CTAs.
- `features/landing/ui/hero-client.tsx` / `features/menu/ui/menu-hero-client.tsx` — page-specific on-load GSAP timelines.
- `features/landing/ui/reviews-client.tsx` — CSS transform slider (translateX), prev/next buttons.
- `components/shared/accordion.tsx` — shared accordion (about-us FAQ, product page description/shipping/returns), pure CSS `grid-template-rows` transition, no GSAP. Extracted from the page-specific `about-faq-client.tsx` (now deleted) once the product page needed the same pattern a second time.
- `components/shared/site-header-client.tsx` — header defaults to white nav text only on routes whose hero sits over a dark image (`DARK_HERO_ROUTES = ['/', '/about-us', '/catalog']`); every other route (light/cream heroes) gets dark `text-foreground` from the first frame instead of white-until-scroll, which was previously invisible on those pages.
- Background videos (story, location): native `<video autoplay muted loop playsinline>`, no JS.

## Template Variations
- RollLink variants: `dark` (foreground pill), `light` (background pill), `glass` (blur over imagery).

## Open / Unfinished

- **CTA image-collage choreography** (`components/shared/cta-collage*`) — functional and config-driven with a dev-only debug panel (gear icon, bottom-right, `npm run dev` only — stripped from production builds), but the burst/settle timing values are the first-pass decode from the source and haven't been hand-tuned against the panel yet. Revisit with the panel open on `/menu` or `/contact-us` before considering this section done.

## Deviations
- Home page (`(shop)/page.tsx`) fetches the 12 coffee fixtures via mock `getEngine()`; weight ("2.2lb") is stored as `variants[0].name` — no invented fields on `Product`.
- Process-section circle-draw animation from the original Webflow simplified to static numbered circles (ponytail note in file).
- The legacy `webflow-styles.css` has been deleted — the app is 100% Tailwind + globals.css tokens. Future page migrations must be built token-first from `localized-html/*.html` as visual reference only.
- `text-white`-equivalents on imagery use `text-background`/`bg-foreground/40` tokens; hero (pre-existing) still uses `text-white` + one inline rgba.
