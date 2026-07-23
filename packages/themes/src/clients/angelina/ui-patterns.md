# Angelina UI Patterns & Animations

## Component Variations
- **RollLink Variants:** `dark` (foreground pill), `light` (background pill), `glass` (blur over imagery). Used for interactive CTAs.
- **Headers:** Transparent frosted glass (`rgba(244,243,240,0.85)`) on scroll. Adapts text color dynamically depending on the route's hero image lightness.

## Animation Philosophy
- **Framer Motion / GSAP:** Relies heavily on GSAP ScrollTrigger for rich, scroll-linked storytelling.
- **Pacing:** Fast in (~0.3s, ease-out), settled stop. No endless floaty loops. Main thread kept clear.
- **Accessibility:** Respects `prefers-reduced-motion` via `gsap.matchMedia`.

## Interaction States
- **Hover Effects:** Dual-text hover roll on Pill CTAs (`RollLink`).
- **Product Cards:** Smooth magnify zoom lens effect on product images (gated to hover-capable devices).
- **Image Collages:** Scroll-scrubbed image explosion/settle/exit choreography (`cta-collage`).
- **Scroll Reveals:** Comprehensive `data-reveal*` system (rise-blur-fade, fade, zoom, parallax-zoom, curtain, slide-left/right/bottom, line-draw).
