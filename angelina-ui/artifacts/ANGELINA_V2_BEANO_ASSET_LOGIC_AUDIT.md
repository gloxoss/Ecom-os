# Angelina V2: Beano Asset Logic Audit

This audit explains why the first Angelina image set felt wrong in the current UI and what the second image generation pass should copy from the old Beano assets.

## Core Finding

The old Beano images were not only "coffee images." They were designed for specific component roles:

- Hero: full-bleed abstract material texture behind white text.
- Brew section: isolated product cutouts on a clean background.
- Feature/story sections: framed editorial photos.
- Product grid: centered ecommerce product images with hover/lifestyle variants.

The first Angelina set used correct Angelina subject matter, but some assets had the wrong role. The hero became a literal table scene, and the brew images became framed lifestyle photos. That breaks the feeling even if the subject is right.

## Hero Logic

Old source:

```text
public/assets/beano/aHR0cHM6_6973e2d273cf24578fae43af_Rectangle 1.webp
```

What it does:

- Abstract macro texture, not a product scene.
- Full-bleed 16:9 background.
- Warm amber/chocolate palette.
- Bubbles and high-detail texture mostly on the right.
- Center area stays readable behind white hero type.
- No horizon line, no table edge, no room perspective.
- Creates atmosphere first, product second.

Why the new hero failed:

- It is a literal salon/table scene.
- The object cluster competes with the text.
- The marble table creates a strong horizontal plane.
- It feels like a location/product photo, not an immersive hero background.

V2 hero must be:

- Macro hot chocolate surface.
- Abstract whipped cream/chocolate swirl.
- Ganache/gloss/bubbles.
- Possibly chestnut cream texture, but as material, not a plated dessert.
- Dark enough for white text, with controlled calm zones.

## Brew Section Logic

Old sources:

```text
public/assets/beano/aHR0cHM6_697885c5f501f5e5f2d816e4_Frame 7 (2).webp
public/assets/beano/aHR0cHM6_697885e87b34eadf67c86c89_Frame 8.webp
```

What they do:

- Isolated glass objects.
- Product cutouts, not lifestyle photos.
- Clean white/transparent-looking background.
- No rounded-card feeling.
- Strong object silhouette.
- Different object heights create rhythm.
- The right-side layout expects these to float as products.

Why the new brew section failed:

- The images are rectangular lifestyle photos.
- Rounded corners make them look like cards.
- They overlap visually with the text column and feel like inserted panels.
- They do not preserve the original "two product objects floating on white" logic.

V2 brew assets must be:

- Isolated product cutouts.
- Transparent or pure white background.
- One shorter cup/bowl object and one taller object.
- No surrounding table scene.
- No salon background.
- No rectangular framed-photo crop.

## Product Card Logic

The product grid can use square ecommerce/lifestyle images. The current generated product assets are closer to the right role than the hero and brew section.

For product cards:

- Main image: centered object on clean background.
- Hover image: lifestyle scene, still square.
- Consistent lighting across the set.
- No hard shadows or dark backgrounds.

## Feature Section Logic

Feature blocks can stay editorial. These sections accept rectangular lifestyle images because the component frames them as image panels.

Good subjects:

- Boutique shelf.
- Macaron gift box.
- Patisserie counter.
- Tea-room service.

Avoid:

- Product cutouts here.
- Abstract textures here.

## Story And Location Logic

These sections can use interior imagery and video posters, but only if they are not too busy behind text overlays.

Good subjects:

- Blurred Belle Epoque salon interior.
- Marble tables and leather chairs.
- Gilded mirrors.
- Soft warm lights.

Avoid:

- Clear readable signage.
- Large faces.
- Strong foreground objects directly under text.

## V2 Asset Priority

Generate these first:

1. `hero-hot-chocolate-macro-texture.webp`
2. `brew-hot-chocolate-cup-cutout.webp`
3. `brew-mont-blanc-cutout.webp`
4. `brew-whipped-cream-bowl-cutout.webp` as optional alternate

After those are good, continue product pairs 06-12 and videos.

