# Angelina Image Production Runbook

Use this runbook to create, evaluate, export, and later implement the new Angelina-style website assets.

## Step 1: Prepare References

For each generated image:

1. Open `ANGELINA_REFERENCE_IMAGE_LINKS.md`.
2. Pick 1-3 references from the matching section group.
3. Use the matching prompt ID from `ANGELINA_PROMPT_LIBRARY.md`.
4. Keep the universal negative prompt active.

Recommended reference combinations:

| Output type | References |
| --- | --- |
| Hero | REF-HERO-01, REF-MONT-02, REF-INTERIOR-02 |
| Product cards | Matching product reference plus REF-MACARON-01 or REF-MONT-01 |
| Story/location | REF-INTERIOR-01, REF-INTERIOR-02 |
| Process/service | REF-SERVICE-01, REF-MONT-03 |
| Hot chocolate ritual | REF-MONT-02, REF-DESSERT-02 |

## Step 2: Generate In Batches

Batch order:

1. Hero image.
2. Product-card set.
3. Feature/story/process images.
4. Video posters.
5. Videos.

Do product cards in one visual batch so lighting and camera angle stay consistent.

## Step 3: Required Sizes

| Asset type | Minimum generation size | Export |
| --- | --- | --- |
| Hero | 2400x1350 | WebP |
| Product cards | 1600x1600 | WebP |
| Feature images | 1800x1350 | WebP |
| Quote/reviews | 1800x1200 | WebP |
| Story/location posters | 2400x1350 | WebP |
| Videos | 1920x1080, 6-8 seconds | MP4 and WebM |

## Step 4: File Naming

Save final assets under:

```text
public/assets/angelina/
```

Use filenames exactly as defined in:

```text
ANGELINA_ASSET_REPLACEMENT_MAP.md
ANGELINA_PROMPT_LIBRARY.md
```

Do not use spaces in filenames.

## Step 5: Review Checklist

Approve an asset only if:

- It reads as Angelina-style patisserie or Paris tea-room immediately.
- It fits the current UI crop.
- It has no fake readable text.
- It has no fake logo.
- It is not a coffee image.
- The palette matches ivory, chocolate, cafe, muted gold, blush, and vieux rose.
- The subject is not cut off awkwardly.
- The image is sharp where the product/food matters.
- Hands, cups, utensils, pastry strands, and packaging geometry look natural.

Reject if:

- It looks like stock brunch photography.
- It has rustic bakery styling.
- It is too dark.
- It has blue/gray lighting.
- It contains AI text artifacts.
- The food looks melted, deformed, or unclear.

## Step 6: Export Rules

Stills:

- Prefer WebP.
- Keep quality around 82-90.
- Preserve high enough resolution for `next/image`.

Videos:

- MP4 H.264 for compatibility.
- WebM for modern browsers.
- Muted loop.
- 6-8 seconds.
- Poster image exported from a clean frame.
- Avoid abrupt first/last frame mismatch.

## Step 7: Later Implementation Checklist

When the user asks to implement:

1. Add files to `public/assets/angelina/`.
2. Update helper paths in `src/features/landing/data/landing-content.ts` from `/assets/beano/` to `/assets/angelina/`.
3. Update hero, feature, story, process, quote, brew, reviews, and location source fields.
4. Update product image data in `src/lib/engine.ts`.
5. Update alt text using the alt text from `ANGELINA_PROMPT_LIBRARY.md`.
6. Do not change component UI or layout.
7. Run the local build.
8. Check hero, product cards, and video poster crops on mobile and desktop.

## Step 8: Content Warning

Because these are inspired by a real brand, generated images should avoid exact trademarks unless licensed. For a clean working prototype, use brand-adjacent visual language:

- "Angelina Paris inspired"
- "Paris tea-room"
- "Belle Epoque salon"
- "patisserie gift box"
- "blank label"
- "abstract gold ornamentation"

Only use exact Angelina logos or official product photos when the project has explicit permission to do so.

