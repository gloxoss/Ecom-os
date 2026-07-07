# Logo Generation Prompts — ecomOS mark

Style source: 4 Pinterest references (rounded-tile metaball clusters, flat, dark canvas). Palette: DESIGN.md v2.0 (Noir #000000 · Cacao #763B00 · Ember #FA7400 · Warm White #FFFBFA · White #FFFFFF). Identity lock: ../02-identity-sheet.md. Shared negative prompt at bottom. Aspect 1:1, 2K. Best model for crisp vector-flat marks: Nano Banana Pro or GPT Image 2 (i2i with the reference images attached).

---

## 1 — The Fused Pair (minimal mark)
> Minimalist vector logo mark on a pure black background (#000000). Two large rounded squares (corner radius 25% of width) joined diagonally corner-to-corner, fused with a smooth concave fillet neck where they meet, like liquid metaball shapes merging. Bottom-left square in warm off-white (#FFFBFA), top-right square in vivid warm orange (#FA7400). Perfectly flat solid fills, no outlines, no gradients, mathematically clean bezier curves, centered with generous negative space. Swiss logo design, geometric construction-grid precision.

## 2 — The Modular Grid Mark (brand-spec icon)
> Flat vector logo icon on a warm off-white background (#FFFBFA). A 2x2 grid of four rounded squares (corner radius 25%), three tiles in pure black (#000000), the top-right tile in vivid warm orange (#FA7400) offset 10% outward, its inner corner connected back to the grid by a short smooth fillet bridge, metaball style. The three black tiles are fused where their corners meet with subtle concave necks, forming one continuous shape. Flat solid color, no gradients, no shadows, no outline, centered, generous margin. Modern tech brand identity, geometric sans-serif era.

## 3 — The Pixel Cluster (Stellar-style scatter)
> Minimal vector logo mark on a pure black background (#000000): a diagonal cluster of seven small rounded squares of two sizes arranged like a rising pixel constellation flowing from bottom-left (smallest) to top-right (largest), adjacent tiles fused with smooth metaball fillet joins. Six tiles in warm off-white (#FFFBFA), the single topmost-right tile in vivid warm orange (#FA7400). Flat solid fills, crisp bezier edges, no gradients, no glow, centered composition with wide negative space. Brutalist-minimal tech logo.

## 4 — The Diamond Lattice (construction-sheet look)
> Logo construction sheet, flat vector style, pure black background (#000000) with a faint dotted grid. Centered mark: nine rounded squares (corner radius 25%) arranged in a diamond/rhombus lattice, alternating filled and empty positions like a checker, filled tiles in warm off-white (#FFFBFA) fused with smooth concave metaball necks where corners touch; one single tile on the right edge in vivid warm orange (#FA7400). Dashed thin deep-brown construction circles (#763B00) overlaying each corner radius, like a logo geometry blueprint. Precise, technical, brand-guideline presentation aesthetic.

## 5 — The Wordmark Lockup (icon + type)
> Horizontal logo lockup centered on a pure black background (#000000). Left: a compact cluster of five small rounded squares in a 45-degree diagonal pixel arrangement, fused with metaball fillet joins, four tiles warm off-white (#FFFBFA) and the top-right tile vivid warm orange (#FA7400). Right of it, with a gap equal to one tile width: the wordmark "ecomOS" in a bold geometric sans-serif (Space Grotesk style), lowercase "ecom" and capital "OS", warm off-white, tight letter spacing. Flat vector, no gradients, no glow, no bevel, balanced baseline alignment, wide margins. Contemporary developer-platform branding.

---

## Shared negative prompt
> gradients, glow, neon, 3D bevel, chrome, drop shadow, outline strokes, texture, photorealism, background clutter, extra shapes, uneven corner radii, hand-drawn wobble, watermark, misspelled text, letterform distortion, purple-pink AI gradient, red-orange hue shift

## Risk notes
- Fillet/metaball joins are the make-or-break detail — reject any render where tiles merely overlap instead of fusing with a concave neck.
- Tile count must be exact per prompt; models love adding extras.
- Prompt 5's "ecomOS" casing must be letter-perfect.
- Orange fidelity: must read as #FA7400 (warm vivid orange), not EPIOSO's #FF6B2D and not red-orange.
- Attach the 4 Pinterest reference images via an image-to-image slug (e.g. `input_urls` on GPT Image 2, `image_input` on Nano Banana Pro) for much stronger style adherence.
