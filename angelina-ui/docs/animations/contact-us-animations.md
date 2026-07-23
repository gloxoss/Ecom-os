# Contact-Us Page Animations — Webflow → GSAP Conversion Guide

Companion files:
- **`contact-us-animations.json`** — machine-readable spec (this doc narrates it).
- **`webflow-ix2-contact-us.raw.json`** — decoded IX2 data for this page (22 events), filtered from the same site-wide registry as `webflow-ix2-home.raw.json` / `webflow-ix2-menu.raw.json`.

This page reuses the site's established motion language end to end — every recipe here (`riseBlurFade`, `slideInRight`, the CTA's explosion/settle scrub) is already documented in `home-animations.md` and `menu-animations.md`. Nothing new to decode; what's worth recording is which recipes apply where, and the one real difference from menu's CTA.

## Design Audit (Phase 1)

Read against the rendered original (not just its markup — see the note in the repo's chat history about why a static single-shot screenshot lies for scroll-triggered pages):

1. **Hero** — a heading + short paragraph with inline email/phone links, then a two-column row: a photo with a small **locations card overlaid on its bottom-left corner** (label + address list), and a **contact form** (first/last name, email/phone, message, submit) beside it. Richer than a typical "contact banner" — this is effectively the whole page's primary content.
2. **Info block** — identical composition to the home page's *brew* section: label → heading → paragraph → pill CTA → 2-up feature list on one side, two product shots sliding in from the right on the other. Confirmed via `slideInRight` in the IX2 data (not `slideInLeft`, which is menu's guide-section mirror).
3. **CTA** — the same pinned image-collage closing section as menu, structurally identical down to the class names (`cta-image-wrap _01`…`_08`). The one difference: **no ambient orbit loop**. Menu's registry has a `PAGE_START` event driving `a-113`; this page's registry has no equivalent. The original site doesn't apply that idle flourish uniformly — it's page-specific polish, not a universal component behavior.

## Component Decisions (Phase 2–3)

- **CTA collage extracted to a shared component.** This was the second page to need the exact explosion/settle/exit choreography verbatim (menu was the first). Per the project's rule of thumb — one bespoke instance is fine, a second literal duplicate gets extracted — `menu-cta.tsx`/`menu-cta-client.tsx` were promoted to `src/components/shared/cta-collage.tsx` + `cta-collage-client.tsx`, with `withOrbit?: boolean` (default `false`) covering the one real behavioral difference between pages. Menu now calls it with `withOrbit`; contact-us calls it without, matching each page's actual source.
- **Info block was *not* extracted**, even though it's visually the same pattern as home's `brew-section.tsx`. This is the second usage of the pattern, but the content differs enough (no separate "description" field structure reuse risk, different feature count semantics) that forcing an abstraction now would be premature — the layout was freshly authored in `contact-info-section.tsx` following the same proven JSX/motion shape. If a third page needs this exact pattern, extract then.
- **Contact form is a genuine interactive island** (`contact-form-client.tsx`), not present anywhere else in the app yet. Wired to a new mock action (`contactAction` in `src/lib/mock-actions.ts`, 700ms fake latency) following the existing `checkoutAction`/`loginAction` mock pattern — replaced by a real server action at merge time, same as the rest of the sandbox.

## Animation Summary

| Element | Recipe | Source |
|---|---|---|
| Navbar | scroll recolor | shared, `a-114` (same as home/menu) |
| Hero heading, quick-contact, image+locations card, form panel | riseBlurFade | `a-48` / `a-10` / `a-33` |
| Info label/heading/description/button/features | riseBlurFade | `a-46` wrap, same recipe |
| Info product shots | slideInRight | mirrors home's brew section |
| CTA collage | explosion → settle → exit scrub | `a-112`, **no orbit** (unlike menu) |
| CTA mobile fallback | simplified rise-blur-fade | `a-48`/`a-33` on small/tiny |
| Form submit | React state machine (idle/submitting/success/error) | not IX2 — reimplements Webflow's native form swap |

## Parity Notes

- Every color, spacing, and typography value follows the same token set as home/menu (`--color-*` HSL vars from `globals.css`) — no new tokens introduced.
- Icons for mail/phone/location switched from the original's raw SVG assets to `lucide-react` (`Mail`, `Phone`, `MapPin`) — these are generic line-icon glyphs in the source (Material Symbols / Line MD sets), not brand-specific artwork, so using the project's existing icon library is the more idiomatic choice per the project's established convention (already used for the mega-menu's chevron).
- Form field labels, placeholder copy, and the three salon addresses are original content authored for this migration — the source page's actual copy was not reused verbatim (see the design-audit summary above for the structural facts that were carried over).
