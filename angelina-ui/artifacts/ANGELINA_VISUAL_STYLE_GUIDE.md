# Angelina Visual Style Guide For Generated Assets

This guide translates the Angelina theme into image-generation rules. It is designed to preserve the current website UI while replacing the coffee imagery with patisserie and salon imagery.

## Visual Personality

The website should feel like a bright Paris tea room, not a coffee roaster.

Core words:

- Airy
- Warm
- Refined
- Creamy
- Giftable
- Heritage
- Patisserie-led
- Quietly luxurious

## Color Direction

Match the site theme:

| Theme role | UI color | Image equivalent |
| --- | --- | --- |
| Primary background | `#ffffff` | Porcelain, white marble, ivory wall, white plates |
| Primary text | `#3f100a` | Chocolate, chestnut cream, espresso brown |
| Primary accent | `#aa631a` | Cafe brown, caramel, cocoa, baked pastry |
| Secondary accent | `#c69951` | Muted brass, gilded mirror, gold foil, warm light |
| Soft surface | `#fff5f2` | Blush packaging, soft cream background |
| Section accent | `#d9a594` | Old peach paper, rose-beige packaging |
| Soft highlight | `#ffcebf` | Vieux rose ribbon, macaron, napkin, gift box |

Avoid:

- Black-dominant images.
- Cold gray marble with blue tint.
- Neon colors.
- Saturated red or orange.
- Rustic tan/brown dominance.
- Dark coffee shop shadows.

## Lighting

Preferred:

- Soft morning window light.
- Warm salon practical lighting.
- High-key studio light for product cards.
- Creamy highlights on porcelain and marble.

Avoid:

- Harsh noon sun.
- Low-key moody restaurant lighting.
- Heavy vignette.
- Dramatic black shadows.

## Materials

Use repeatedly:

- White marble
- Porcelain cups and plates
- Silver spoons and forks
- Muted brass or gilded mirror detail
- Blush and ivory packaging
- Satin ribbon
- Warm leather seating
- Cream linen napkins

Do not use:

- Kraft paper
- Burlap
- Chalkboards
- Rustic wood boards
- Industrial metal tables
- Plastic cups

## Subject Matter Hierarchy

Primary subjects:

1. Mont-Blanc
2. Hot chocolate with whipped cream
3. Macarons
4. Tea tins and gift boxes
5. Chocolate crepes / pralines / caramels
6. Belle Epoque tea-room interiors
7. Patisserie craft hands

Secondary props:

- Silver spoon
- Fork
- Rose petals
- Ivory napkin
- Blush ribbon
- Porcelain saucer
- Menu-like card with no readable text
- Gift bag with no visible logo

## Composition Rules

Hero:

- Wide crop.
- Strong subject on right or lower right.
- Calm negative space on left/center-left for text.
- Background can be softly blurred salon interior.

Product cards:

- Square.
- Centered object.
- Consistent camera height.
- Consistent shadow softness.
- Similar background temperature.
- No busy surroundings.

Editorial feature images:

- 4:3 or 3:2.
- Subject should be clear in the first second.
- Leave enough quiet border for rounded image containers.

Videos:

- 6-8 seconds.
- One action only.
- Smooth loop.
- No hard camera shake.
- No readable text.

## Cropping Safety

The current UI uses large image containers and object-cover behavior. Generate larger than needed and keep the subject away from edges.

Safe zones:

- Hero: leave 35-45% of the left side calm.
- Product cards: keep subject inside central 70%.
- Feature blocks: keep the main subject inside central 80%.
- Videos: avoid critical action in outer 15%.

## Texture Rules

Keep textures precise:

- Chestnut cream strands should be fine and clean.
- Hot chocolate should look thick and glossy, not watery.
- Whipped cream should be soft and piped, not foam.
- Macarons should be smooth with visible feet.
- Marble should be white/cream, not gray/blue.

## People And Hands

Use hands only when the section is about service or process. No full-face models are needed.

Rules:

- Natural hand anatomy.
- Clean nails.
- White blouse or neutral sleeve.
- No visible tattoos unless intentional.
- No fake staff uniforms or name badges.

## Logo And Text Rules

Safest default:

- No visible logos.
- No readable text.
- No fake brand marks.
- Packaging can have ornamental linework, abstract monograms, or blank labels.

If real branded packaging is licensed later, use the licensed photo directly rather than generating a fake version.

## Quality Gate

Reject an image if:

- It looks like coffee branding.
- The object is unclear or generic.
- The background is too dark.
- The color palette fights the UI.
- Text is garbled.
- The pastry anatomy looks impossible.
- The image could be mistaken for a rustic bakery, brunch cafe, or coffee roaster.

