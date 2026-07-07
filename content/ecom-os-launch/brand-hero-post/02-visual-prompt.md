# Phase 2 — Visual Prompt (per /prompt-image)

**Asset:** brand-hero-post · **Format:** still image, 1:1 (2048×2048 target) · **Identity lock:** ../02-identity-sheet.md (variant 1 — Launch hero) · **Palette:** DESIGN.md v2.0

---

## Master prompt

> Minimal editorial brand launch poster, square 1:1 composition. Warm off-white background (#FFFBFA) with very subtle paper grain texture. Upper-left two-thirds: a 2x2 grid of four rounded squares (corner radius 25% of tile width), three tiles in pure black (#000000), the top-right tile in vivid warm orange (#FA7400), offset about 10% outward from the grid as if snapping into place, each tile casting a faint soft shadow on the paper. One thin deep-brown (#763B00) hairline connects the offset tile back to the grid. Lower third, left-aligned: headline text "The 80% is done." set in a bold geometric sans-serif (Space Grotesk style), pure black (#000000), sentence case. Directly beneath it, a smaller monospace line in vivid warm orange (#FA7400): "2 weeks · your source code · AR FR EN". Swiss grid alignment, generous negative space, flat vector-graphic style with restrained dimensional depth, even studio lighting.

## Negative prompt

> gradients, glassmorphism, blur panels, neon glow, chrome, glossy 3D render, heavy drop shadows, pure white background, pure black background, extra tiles, missing tiles, recolored tiles, red-orange hue shift, photograph of people, hands, faces, laptop, office stock photo, clutter, decorative icons, emoji, watermark, signature, misspelled text, distorted letterforms, gradient text, purple-pink AI gradient

## Composition notes
- Subject hierarchy: (1) tile grid with orange offset tile, (2) headline, (3) mono proof line. Nothing else.
- Grid occupies upper-left ~55% of canvas; text block anchored to the same left margin (strict left alignment, no centering).
- ≥40% negative space. 8% canvas margin on all sides.

## Style anchors
Swiss/International typographic poster · contemporary SaaS brand system (Linear/Stripe restraint) but warm-paper not dark-mode · flat graphic with soft physicality (Bauhaus print, not 3D render).

## Lighting notes
Even, shadowless studio light across the paper; only the tiles cast shallow soft-edged shadows (offset 2–3% of tile size, ~15% opacity).

## Variants
- **Photoreal:** the same grid built from matte ceramic tiles (black glaze + one orange glaze, quiet zellige nod) lying on warm-white plaster, soft window light from left, 50mm lens look, headline overlaid in the same type treatment.
- **Ad creative:** tighter crop, grid smaller top-right as a stamp, headline enlarged to 60% of canvas width, mono line doubled in size — thumb-stopping at feed size.
- **Editorial:** magazine-cover framing with a thin black border inset 4%, tiny uppercase kicker "EPIOSO — CASABLANCA" top-left in letter-spaced mono.
- **Stylized concept:** isometric view of the orange tile mid-air, descending into the empty grid slot, dashed deep-brown guide-line showing its path.

## Model-risk notes (carry into generation plan)
1. **Typography is the whole asset** — the headline and mono line must render letter-perfect; this drives model choice toward best-tier text rendering.
2. Hex fidelity: orange must read as #FA7400 — not EPIOSO's #FF6B2D, not red-orange; the brown hairline must stay deep brown, not fade to gray.
3. Tile count drift: exactly 4 tiles, exactly one orange.
4. Background drift to pure white — must stay warm off-white #FFFBFA.
