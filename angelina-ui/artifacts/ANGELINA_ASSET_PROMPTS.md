# Angelina Paris Asset Logic and Prompt System

This document defines the image and video direction for replacing the current Beano-style assets with visuals that feel aligned with Angelina Paris: refined patisserie, Belle Epoque salon culture, marble table service, warm chocolate, tea-room ritual, elegant gifting, and quiet Parisian luxury.

The goal is not to redesign the UI. The goal is to feed the existing sections with images that make the current layout feel intentional, premium, and brand-correct.

For the expanded artifact pack, start with `ANGELINA_ASSET_ARTIFACT_INDEX.md`.

## Core Visual Thesis

Angelina should feel like:

- A white salon canvas warmed by chocolate, gold, cafe, and vieux rose accents.
- Real patisserie objects, not generic bakery stock.
- Paris tea-room ritual: marble, porcelain, silverware, whipped cream, tea tins, gift boxes, menus, mirrors, and upholstered seating.
- Elegant product photography with enough negative space for the existing UI.
- Premium but not cold: cream, pastry, chocolate, rose, and warm interior light.

Avoid:

- Rustic bakery flour-dust styling.
- Overly dark coffee-shop visuals.
- Generic croissants on kraft paper.
- Modern minimalist cafe scenes that could belong to any brand.
- Fake logos, fake packaging, or invented brand marks unless you have licensing/permission.
- Busy images behind text.

## Palette Logic

Use the Angelina theme palette as the image grading target:

- Porcelain white / warm ivory backgrounds.
- Chocolate brown and espresso accents.
- Soft cafe au lait neutrals.
- Old peach, vieux rose, and blush details.
- Muted gilded brass, never bright yellow gold.
- Occasional deep burgundy or brown leather from salon interiors.

The image grading should stay soft and high-key. Shadows can be warm but should not dominate.

## Prompt Formula

Use this structure for every generated image:

```text
[specific subject] in [Angelina-style Paris tea-room or patisserie setting], on [surface/material],
with [supporting props], [lighting], [composition], [color palette], [camera/lens],
premium editorial patisserie photography, refined Belle Epoque Paris salon atmosphere,
no visible logos, no readable text, no fake brand marks, no people unless specified
```

Universal negative prompt:

```text
generic coffee shop, rustic bakery, kraft paper, messy crumbs, plastic packaging,
modern neon cafe, dark moody bar, over-saturated colors, fake logo, misspelled text,
readable label, cartoon, illustration, AI artifacts, distorted pastry, extra utensils,
warped cup handle, messy table, hands with bad anatomy
```

## Section Asset Map

| Current section | Asset role | Best subject | Format |
| --- | --- | --- | --- |
| Hero | Signature brand mood with room for headline | Mont-Blanc, hot chocolate, whipped cream, marble, salon detail | 16:9 or 5:3 |
| Collection tabs/cards | Clean product families | Macarons, hot chocolate tin, teas, chocolate crepes, gift boxes | 1:1 |
| Feature blocks | Editorial lifestyle panels | Table service, gifting, boutique shelf, tea menu | 4:3 or 3:2 |
| Story | Brand heritage and craft | Salon interior, pastry counter, plated signature dessert | 16:9 image or short video |
| Process | Making and service ritual | Piping chestnut cream, pouring hot chocolate, arranging macarons | 4:3 image or 9:16/16:9 video |
| Quote | Quiet maison moment | Handwritten menu, porcelain cup, rose, gilded mirror reflection | 3:2 |
| Brew/signature section | Iconic tasting ritual | Hot chocolate beside Mont-Blanc and cream | 4:3 |
| Reviews/social proof | Guest table detail | Two cups, plated desserts, silver spoons, soft salon background | 3:2 |
| Location | Destination proof | Tea room interior, boutique shelves, marble tables, warm lights | 16:9 |

## Hero Prompt

Use for the first viewport. It must have negative space on the left or center-left for existing headline text.

```text
Angelina Paris inspired signature tea-room table scene, a Mont-Blanc pastry on a white porcelain plate beside a cup of thick hot chocolate and a small bowl of whipped cream, polished white marble table, silver spoon, folded ivory napkin, blurred Belle Epoque salon background with warm gilded mirror details and deep brown leather seating, soft morning window light, refined Paris patisserie atmosphere, warm ivory chocolate cafe vieux rose palette, editorial luxury food photography, 50mm lens, shallow depth of field, generous clean negative space on the left for headline text, no visible logos, no readable text, no fake brand marks --ar 16:9
```

Alternative hero prompt with more packaging:

```text
premium Angelina Paris inspired patisserie still life, elegant gift tin, wrapped chocolate crepes, porcelain cup of hot chocolate with whipped cream, small plate of macarons in blush and chocolate tones, arranged on white marble with a soft ivory tea-room menu shape in the background, warm Paris salon lighting, Belle Epoque elegance, polished but inviting, negative space in upper left, no visible logo, no readable text, no fake brand marks --ar 5:3
```

## Collection Product Prompts

Generate these as a consistent square set. Same lighting, same surface, same crop language.

### Mont-Blanc Card

```text
single Mont-Blanc pastry with chestnut cream vermicelli and whipped cream core on white porcelain dessert plate, white marble surface, tiny silver fork, soft ivory background, warm window light, refined Paris salon patisserie product photography, chocolate brown and cream palette, centered composition, realistic pastry texture, no logo, no readable text --ar 1:1
```

### Hot Chocolate Card

```text
porcelain cup of thick Parisian hot chocolate with a small white bowl of whipped cream beside it, white marble table, silver spoon, subtle blush napkin, warm ivory background, luxury tea-room product photography, chocolate and cream palette, centered clean composition, no logo, no readable text --ar 1:1
```

### Macarons Card

```text
open elegant macaron box with rose, chocolate, vanilla, pistachio, and raspberry macarons, soft pink ribbon, a few rose petals, ivory marble surface, refined Paris patisserie gifting photography, pastel vieux rose and cafe palette, clean square composition, no logo, no readable text --ar 1:1
```

### Tea Tin Card

```text
elegant art deco inspired loose tea tin with no readable label beside a porcelain tea cup and loose tea leaves, ivory marble surface, muted gold and cafe accents, soft salon lighting, premium Paris tea-room product photography, centered square crop, no logo, no readable text, no fake brand marks --ar 1:1
```

### Chocolate Crepes Card

```text
dark chocolate covered crispy crepe bites arranged on a white porcelain plate, a few wrapped pieces in ivory paper without text, warm marble table, refined chocolate patisserie product photography, crisp texture, chocolate brown ivory palette, clean centered square crop, no logo, no readable text --ar 1:1
```

## Feature Block Prompts

### Boutique Shelf

```text
refined Paris patisserie boutique shelf with elegant tea tins, chocolate boxes, macaron boxes, and porcelain display plates, warm ivory walls, muted brass trim, soft spot lighting, Belle Epoque inspired detail, premium retail photography, organized shelves with quiet luxury, no readable labels, no visible logos, no fake brand marks --ar 4:3
```

### Gifting Moment

```text
elegant patisserie gift moment on white marble, blush ribbon, ivory shopping bag with no logo, macaron box, tea tin, small chocolate box, soft rose petals, warm Paris salon light, luxury patisserie gifting photography, calm composition with negative space, no readable text, no fake brand marks --ar 3:2
```

### Tea Service

```text
Paris tea-room service scene, two porcelain cups of tea and hot chocolate on white marble, small plate of macarons, silver spoons, folded ivory napkins, blurred gilded salon interior, warm window light, refined hospitality mood, no logos, no readable text --ar 4:3
```

## Story Section Prompt

Use this for a wide image or poster frame behind a story/video area.

```text
historic Paris tea room interior inspired by Belle Epoque salons, white marble tables, warm brown leather chairs, gilded mirror details, tall windows with soft daylight, a few plated patisserie desserts on foreground table, elegant calm atmosphere, refined luxury hospitality photography, ivory cafe chocolate vieux rose palette, no people in focus, no readable text, no visible logos --ar 16:9
```

## Process Section Prompts

### Still Image

```text
close-up patisserie craft scene, pastry chef hands carefully piping chestnut cream onto a Mont-Blanc pastry on a white porcelain plate, marble work surface, silver piping tip, soft warm atelier light, elegant Paris pastry kitchen atmosphere, realistic texture, shallow depth of field, no logo, no readable text, natural hands --ar 4:3
```

### Video Prompt

```text
6 second cinematic macro video, pastry chef hands pipe chestnut cream in fine strands onto a Mont-Blanc pastry on a white porcelain plate, marble counter, soft warm Paris patisserie atelier lighting, gentle camera push-in, realistic motion, refined luxury dessert craft, no logos, no text, natural hands, seamless loop
```

## Quote Section Prompt

For authenticity, avoid fake founder portraits. Use a maison detail instead.

```text
quiet Paris tea-room detail, handwritten-style blank ivory menu card with no readable text, porcelain hot chocolate cup, silver spoon, single blush rose, reflection of gilded mirror and warm salon lights in background, white marble table, refined Belle Epoque atmosphere, editorial still life, soft negative space, no logos, no readable words --ar 3:2
```

## Brew / Signature Ritual Prompt

```text
iconic Paris hot chocolate ritual, thick hot chocolate being poured from a porcelain pot into a white cup, Mont-Blanc pastry and whipped cream beside it on a white marble table, warm salon interior softly blurred, silver spoon catching light, luxurious but cozy, chocolate ivory cafe palette, realistic liquid motion, no logos, no readable text --ar 4:3
```

Video variant:

```text
8 second cinematic video, thick hot chocolate pours slowly from a white porcelain pot into a cup on a marble tea-room table, Mont-Blanc pastry and whipped cream bowl beside it, warm Belle Epoque salon background, gentle steam, subtle camera move, refined Paris patisserie mood, no logos, no text, seamless loop
```

## Reviews / Guest Moment Prompt

```text
elegant guest table moment in a Paris salon de the, two cups of hot chocolate, a shared plate of macarons and small pastries, silver spoons, ivory napkins, warm leather seating softly blurred in background, white marble surface, soft daylight, premium hospitality photography, no visible faces, no logos, no readable text --ar 3:2
```

## Location Section Prompt

```text
wide interior photograph of an elegant Paris patisserie tea room, marble tables, warm brown leather chairs, gilded mirrors, display counter with pastries, tall windows, ivory walls, muted brass accents, refined Belle Epoque hospitality atmosphere, balanced natural and warm interior light, realistic architectural photography, no readable signs, no visible logos --ar 16:9
```

Video variant:

```text
7 second cinematic interior video, slow lateral pan across an elegant Paris tea room with marble tables, warm brown leather chairs, gilded mirrors, pastry display counter, tall windows and soft daylight, refined Belle Epoque salon atmosphere, no readable signs, no visible logos, stable smooth motion
```

## Reference Image Links

Use these as visual references and mood references, not direct copies. Keep generated outputs original, and avoid reproducing exact branded packaging or visible logos unless you have permission.

| Reference | What to study |
| --- | --- |
| https://angelinaparisusa.com/ | Mini giandujas, hot chocolate, whipped cream, marble table, official luxury product tone |
| https://angelinaparisusa.com/collections/all | Product card logic for tea tins, chocolate crepes, giftable packaged goods |
| https://salon-de-the.angelina-paris.fr/en/pastry-shop/rue-du-bac-paris-7/ | Mont-Blanc with soft pink packaging, macarons with roses/ribbons, boutique shelf styling |
| https://salon-de-the.angelina-paris.fr/en/pastry-shop/av-du-president-wilson-paris-8/ | Red/brown leather seating, warm salon interior, Mont-Blanc and hot chocolate on marble |
| https://salon-de-the.angelina-paris.fr/fr/patisserie-salon-de-the/rue-de-rivoli-paris-1/ | Breakfast ritual, croissants, hot chocolate, Belle Epoque tea-room heritage |
| https://salon-de-the.angelina-paris.fr/en/pastry-shop/pavillon-dorleans-chateau-de-versailles/ | Chateau tea-room atmosphere, vintage decor, chocolate Mont-Blanc and hot chocolate service |

## Existing Assets To Replace

The current project has coffee-oriented Beano assets. These should be replaced with local files in a new folder such as:

```text
public/assets/angelina/
```

Recommended naming:

```text
hero-mont-blanc-hot-chocolate.webp
collection-mont-blanc.webp
collection-hot-chocolate.webp
collection-macarons.webp
collection-tea-tin.webp
collection-chocolate-crepes.webp
feature-boutique-shelf.webp
feature-gifting-marble.webp
story-salon-interior.webp
process-piping-mont-blanc.webp
brew-hot-chocolate-pour.webp
reviews-tea-room-table.webp
location-paris-salon.webp
video-hot-chocolate-pour.mp4
video-piping-mont-blanc.mp4
video-salon-pan.mp4
```

## Generation Specs

- Hero: generate at 2400x1350 or larger.
- Product cards: generate at 1600x1600 or larger.
- Feature images: generate at 1800x1350 or larger.
- Story/location images: generate at 2400x1350 or larger.
- Videos: 6-8 seconds, muted loop, 1920x1080, plus a poster frame.
- Export stills as WebP when possible, with JPEG fallback if needed.
- Keep important objects away from text overlays.
- Preserve clean edges for cards because current UI uses rounded image containers.
- Use consistent camera height across product cards so the collection grid feels intentional.

## Image Selection Rules

Choose an image only if it passes these checks:

- It immediately reads as patisserie or Paris tea room.
- At least one Angelina-coded object is visible: Mont-Blanc, hot chocolate, whipped cream, macarons, tea tin, marble table, salon interior, gift box, or boutique shelf.
- The palette sits in ivory, chocolate, cafe, muted gold, blush, and vieux rose.
- It has enough quiet space for the current component layout.
- It does not look like a generic bakery, coffee roaster, or brunch cafe.
- It contains no fake readable text or distorted brand marks.

## Implementation Notes For Later

When these assets are ready, replace only image/video source data in the current components. Do not change layout, spacing, typography, or section structure unless separately requested.

Suggested implementation approach:

1. Add final assets under `public/assets/angelina/`.
2. Update image data arrays and `src` values section by section.
3. Keep existing `alt` text meaningful and specific.
4. Use `next/image` for still images.
5. Use short muted autoplay loops only where the existing component already supports video.
6. Run the app and check desktop/mobile crops before finalizing.
