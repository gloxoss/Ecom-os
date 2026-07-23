# Angelina Asset Replacement Map

This is the practical checklist for replacing the current Beano/coffee assets with Angelina-style images and videos. It maps current website slots to recommended new assets. It does not ask for UI layout changes.

## Target Asset Folder

Use this folder later:

```text
public/assets/angelina/
```

## Landing Page Assets

| Slot | Current source | Current meaning | Replace with | New filename | Prompt ID |
| --- | --- | --- | --- | --- | --- |
| Hero background | `/assets/beano/aHR0cHM6_6973e2d273cf24578fae43af_Rectangle 1.webp` | Coffee foam background | Mont-Blanc + hot chocolate on marble with salon atmosphere and text-safe negative space | `hero-mont-blanc-hot-chocolate.webp` | HERO-01 |
| Feature block 1 | `/assets/beano/aHR0cHM6_69b024fceab623b1138863de_carolyn-christine-Fq_0jY8hY50-unsplash 1.webp` | Coffee beans | Boutique shelf with chocolates, tea tins, pastry boxes | `feature-boutique-shelf.webp` | FEATURE-01 |
| Feature block 2 | `/assets/beano/aHR0cHM6_697769fbe79d99a49652ecff_pexels-cmrcn-30226608 1.webp` | Barista milk foam | Macaron and gift-box scene with roses and ribbon | `feature-macaron-gift.webp` | FEATURE-02 |
| Story video mp4 | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69776ef43bd7f2f833082408_Close up of roasted coffee beans in hand_mp4.mp4` | Coffee beans in hand | Slow salon interior pan or pastry counter movement | `story-salon-interior-pan.mp4` | VIDEO-01 |
| Story video webm | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69776ef43bd7f2f833082408_Close up of roasted coffee beans in hand_webm.webm` | Coffee beans in hand | WebM export of same salon video | `story-salon-interior-pan.webm` | VIDEO-01 |
| Story poster | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69776ef43bd7f2f833082408_Close up of roasted coffee beans in hand_poster.0000000.jpg` | Coffee beans poster | Salon interior poster frame | `story-salon-interior-pan-poster.webp` | STORY-01 |
| Process image | `/assets/beano/aHR0cHM6_69778f018818716e0ed1bcbe_foam-of-coffee-in-cup.webp` | Coffee foam | Patisserie hands piping chestnut cream or plating Mont-Blanc | `process-piping-mont-blanc.webp` | PROCESS-01 |
| Quote main image | `/assets/beano/aHR0cHM6_697798addf1c5873ab25898f_andrew-neel-66NjVBij7P8-unsplash.webp` | Tray with coffee beans | Maison still life: blank menu, porcelain cup, rose, mirror detail | `quote-maison-still-life.webp` | QUOTE-01 |
| Quote author image | `/assets/beano/aHR0cHM6_69b086d70a628248aaf41649_139506 2.webp` | Cafe owner portrait | Do not fake a founder portrait; use cropped maison seal/still life or remove only in a later content pass | `quote-author-maison-detail.webp` | QUOTE-02 |
| Brew image 1 | `/assets/beano/aHR0cHM6_697885c5f501f5e5f2d816e4_Frame 7 (2).webp` | Coffee cup | Hot chocolate pour with whipped cream | `signature-hot-chocolate-pour.webp` | BREW-01 |
| Brew image 2 | `/assets/beano/aHR0cHM6_697885e87b34eadf67c86c89_Frame 8.webp` | Coffee cup | Mont-Blanc close-up on porcelain plate | `signature-mont-blanc-closeup.webp` | BREW-02 |
| Reviews image | `/assets/beano/aHR0cHM6_69788ad767b50c7f11fb9117_pexels-fotios-photos-17741500 1.webp` | Coffee cup in shadow | Guest table with two cups, macarons, silver spoons | `reviews-salon-table.webp` | REVIEWS-01 |
| Location video mp4 | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69aeb8387aa47ca7fca756d9_Barista crafting perfect milk foam in cafe_mp4.mp4` | Barista milk foam | Wide tea-room interior pan | `location-tea-room-pan.mp4` | VIDEO-02 |
| Location video webm | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69aeb8387aa47ca7fca756d9_Barista crafting perfect milk foam in cafe_webm.webm` | Barista milk foam | WebM export of tea-room interior pan | `location-tea-room-pan.webm` | VIDEO-02 |
| Location poster | `/assets/beano/aHR0cHM6_69700209399c1d34b8f11637/69aeb8387aa47ca7fca756d9_Barista crafting perfect milk foam in cafe_poster.0000000.jpg` | Barista poster | Tea-room interior poster frame | `location-tea-room-pan-poster.webp` | LOCATION-01 |

## Product Card Assets

The current mock engine has 12 coffee products with two images each. Replace them with 12 Angelina-style product concepts. Keep square ecommerce image logic and add a lifestyle hover image for each.

| Product slot | Current product | New product concept | Main image filename | Hover image filename | Prompt IDs |
| --- | --- | --- | --- | --- | --- |
| p-1 | Sagebrush | Hot Chocolate Mix | `product-hot-chocolate-mix.webp` | `product-hot-chocolate-cup-lifestyle.webp` | PRODUCT-01A / PRODUCT-01B |
| p-2 | Midnight Roast | Signature Mont-Blanc | `product-mont-blanc.webp` | `product-mont-blanc-lifestyle.webp` | PRODUCT-02A / PRODUCT-02B |
| p-3 | Coastline | Macaron Gift Box | `product-macaron-box.webp` | `product-macaron-roses-lifestyle.webp` | PRODUCT-03A / PRODUCT-03B |
| p-4 | Forest Shade | Dark Chocolate Crispy Crepes | `product-crispy-crepes.webp` | `product-crispy-crepes-lifestyle.webp` | PRODUCT-04A / PRODUCT-04B |
| p-5 | Brazil Toucan Cerrado | Mini Giandujas | `product-mini-giandujas.webp` | `product-mini-giandujas-lifestyle.webp` | PRODUCT-05A / PRODUCT-05B |
| p-6 | Peru Cafe Del Futuro | Salted Butter Caramels | `product-caramels.webp` | `product-caramels-gift-lifestyle.webp` | PRODUCT-06A / PRODUCT-06B |
| p-7 | EL Salvador | Parisian Heart Praline Box | `product-heart-praline-box.webp` | `product-praline-box-lifestyle.webp` | PRODUCT-07A / PRODUCT-07B |
| p-8 | Ethiopia Sidamo Filter | Discovery Tea Box | `product-discovery-tea-box.webp` | `product-tea-service-lifestyle.webp` | PRODUCT-08A / PRODUCT-08B |
| p-9 | Fresh Coffee | French Chestnut Spread | `product-chestnut-spread.webp` | `product-chestnut-toast-lifestyle.webp` | PRODUCT-09A / PRODUCT-09B |
| p-10 | Primo Exclusive | Oolong Loose Tea Tin | `product-oolong-tea-tin.webp` | `product-oolong-tea-lifestyle.webp` | PRODUCT-10A / PRODUCT-10B |
| p-11 | Costa Rica Amapola | Assorted Chocolates Box | `product-assorted-chocolates.webp` | `product-chocolate-box-lifestyle.webp` | PRODUCT-11A / PRODUCT-11B |
| p-12 | Wienner Kaffe | Breakfast Patisserie Set | `product-breakfast-set.webp` | `product-breakfast-salon-lifestyle.webp` | PRODUCT-12A / PRODUCT-12B |

## Icon Assets

The site still references small Beano SVG icons for arrows, basket, feature icons, and stars. These do not need generated photography.

Recommended later treatment:

- Keep generic arrows/stars if they are visually neutral.
- Replace basket/logo only when brand identity is finalized.
- Do not generate raster images for icons.
- Use CSS/lucide/simple SVG if icons need brand cleanup later.

## Implementation Boundary For Later

When the assets are generated, change:

- `src/features/landing/data/landing-content.ts`
- `src/lib/engine.ts`
- Any static logo/icon references only if brand assets are approved

Do not change:

- Component layout
- Section order
- Spacing
- Typography
- Animations
- Card structure

