# Angelina V2: Old-Logic Image Prompts

These prompts are for the second image generation pass. They keep Angelina subject matter but copy the old Beano asset logic.

## Universal V2 Rules

Use:

- Same composition role as the old asset.
- Same crop behavior as the old component.
- Warm chocolate/cafe/gold palette.
- No fake logos.
- No readable text.
- No exact Angelina trademark unless licensed.

Avoid:

- Literal salon table scene for the hero.
- Rectangular lifestyle photos in the brew section.
- Busy object clusters under white hero text.
- Framed cards where the UI expects cutouts.

## HERO-V2-01: Hot Chocolate Macro Texture

Replacement for:

```text
hero-mont-blanc-hot-chocolate.webp
```

New filename:

```text
hero-hot-chocolate-macro-texture.webp
```

Prompt:

```text
extreme macro photograph of thick Parisian hot chocolate surface, glossy chocolate foam, tiny bubbles, warm amber cocoa gradients, soft ivory cream swirls dissolving through the chocolate, abstract material texture only, no cup edge, no table, no room, no product objects, no people, no readable text, rich cafe brown and caramel gold palette, premium patisserie atmosphere, high detail bubbles clustered mostly on the right side, smoother calmer texture through the center-left for white overlay text, cinematic full-bleed background, sharp texture with soft organic transitions, luxurious Angelina Paris inspired hot chocolate mood --ar 16:9
```

Negative prompt:

```text
coffee beans, latte art heart, cup rim, spoon, table, plated dessert, salon room, people, logo, text, label, product packaging, harsh black shadows, blue gray lighting, rustic bakery, cartoon, illustration
```

Composition notes:

- Put the strongest bubble cluster on the right third.
- Keep center and left-center readable.
- Make it darker and richer than the first generated hero.
- The output should look like a background texture, not a product photo.

## HERO-V2-02: Whipped Cream And Chocolate Swirl

Alternative hero if V2-01 feels too close to coffee.

New filename:

```text
hero-chocolate-cream-swirl-texture.webp
```

Prompt:

```text
extreme close-up abstract surface of thick hot chocolate with ivory whipped cream slowly swirling into it, glossy cocoa brown liquid, caramel highlights, delicate micro bubbles, soft creamy trails like marble veins, no cup edge, no table, no utensils, no dessert objects, no people, full-bleed luxury patisserie texture, warm chocolate cafe and ivory palette, subtle old peach warmth, detailed right side with bubbles and cream, calmer center-left area for white hero text, cinematic macro food photography, Angelina Paris inspired indulgence --ar 16:9
```

Negative prompt:

```text
latte art, coffee roaster, cup, table, room interior, spoon, brand logo, readable text, packaging, dark burned texture, black background, cartoon, fake 3D render
```

## HERO-V2-03: Chestnut Cream Macro

Use only if the hot-chocolate versions feel too Beano-like.

New filename:

```text
hero-chestnut-cream-macro-texture.webp
```

Prompt:

```text
macro abstract texture inspired by Mont-Blanc chestnut cream, fine chestnut cream strands and glossy chocolate shadows forming soft flowing waves, warm cafe brown, caramel, ivory cream highlights, dense texture on the right side, calmer smooth warm area through center-left for white overlay typography, no visible pastry shape, no plate, no cup, no table, no logo, no readable text, premium Paris patisserie material background, cinematic full-bleed macro photography --ar 16:9
```

Negative prompt:

```text
whole pastry, plated dessert, fork, table, salon, product packaging, logo, text, people, messy noodles, spaghetti, cartoon, low detail
```

## BREW-V2-01: Hot Chocolate Cup Cutout

Replacement for:

```text
signature-hot-chocolate-pour.webp
```

New filename:

```text
brew-hot-chocolate-cup-cutout.webp
```

Prompt:

```text
isolated product cutout of a white porcelain cup filled with thick glossy Parisian hot chocolate, subtle gold rim, soft whipped cream foam edge, object centered on pure white background, realistic studio product photography, soft natural shadow directly beneath cup, no table scene, no salon background, no hands, no spoon, no logo, no readable text, clean transparent-background style, luxury Angelina Paris inspired hot chocolate object --ar 4:5
```

Negative prompt:

```text
rectangular lifestyle photo, table, marble surface, room background, people, hands, logo, text, packaging, dark background, coffee beans, latte art heart, messy spill, cartoon
```

Export notes:

- Ideally export with transparent background as PNG/WebP.
- If transparency is not possible, use pure white background.
- Keep object edges clean.

## BREW-V2-02: Tall Hot Chocolate Glass Cutout

This copies the second tall-glass rhythm from the old Beano brew section.

New filename:

```text
brew-tall-hot-chocolate-glass-cutout.webp
```

Prompt:

```text
isolated product cutout of a tall elegant clear glass filled with dark thick Parisian hot chocolate, smooth ivory cream layer on top, subtle condensation on glass, pure white background, soft product shadow underneath, realistic luxury studio photography, tall vertical silhouette, no table, no room, no spoon, no hands, no logo, no readable text, clean transparent-background style, refined patisserie beverage object --ar 2:5
```

Negative prompt:

```text
lifestyle background, cafe interior, marble table, rectangular photo crop, logo, text, straw, ice cubes, disposable cup, coffee beans, black background, cartoon
```

## BREW-V2-03: Mont-Blanc Cutout

If we want the brew section to feel more Angelina than beverage-only, replace the tall glass with this.

New filename:

```text
brew-mont-blanc-cutout.webp
```

Prompt:

```text
isolated product cutout of a single Mont-Blanc pastry with fine chestnut cream strands, small ivory pastry base, placed on a white porcelain dessert plate, pure white background, soft studio shadow underneath, realistic premium patisserie product photography, clean object silhouette, no table scene, no salon background, no cup, no spoon, no logo, no readable text, transparent-background style --ar 4:5
```

Negative prompt:

```text
rectangular lifestyle photo, marble table, room interior, hands, fork, logo, text, messy cream, spaghetti appearance, cartoon, low detail
```

Recommended pairing:

- Pair `brew-hot-chocolate-cup-cutout.webp` with `brew-mont-blanc-cutout.webp`.
- Or pair `brew-hot-chocolate-cup-cutout.webp` with `brew-tall-hot-chocolate-glass-cutout.webp` if you want to preserve the old two-beverage silhouette exactly.

## BREW-V2-04: Whipped Cream Bowl Cutout

Optional third object for future variations.

New filename:

```text
brew-whipped-cream-bowl-cutout.webp
```

Prompt:

```text
isolated product cutout of a small white porcelain bowl filled with piped whipped cream, subtle gold rim, pure white background, soft product shadow underneath, realistic luxury studio photography, clean silhouette, no table, no room, no spoon, no logo, no readable text, transparent-background style --ar 4:5
```

Negative prompt:

```text
table scene, background, hands, brand mark, readable text, messy cream, dark shadow, cartoon, plastic bowl
```

## PROCESS-V2-01: Abstract Process Texture

If the process image also feels too literal, generate this variant.

New filename:

```text
process-chestnut-cream-piping-closeup.webp
```

Prompt:

```text
close-up macro of pastry craft, fine chestnut cream strands being piped in elegant lines, only the piping tip and cream texture visible, warm ivory and cafe brown palette, shallow depth of field, premium Paris patisserie craft mood, no full hands, no face, no logo, no readable text, no messy background, refined material detail --ar 16:9
```

## Product Cutout Rule For Future Assets

For any component that places images directly on white or pale backgrounds without a card frame, generate:

```text
isolated product cutout, pure white background, transparent-background style, soft natural shadow, clean object silhouette
```

For components that already frame images as photos, generate:

```text
editorial lifestyle photography, composed scene, warm salon atmosphere, no readable text
```

