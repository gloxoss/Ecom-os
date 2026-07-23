# Design System: Angelina Paris
**Project ID:** angelina-paris-theme

## 1. Visual Theme & Atmosphere
Friendly, approachable, and elegantly airy design. The atmosphere combines a bright, minimalist canvas with warm, rich pastry-inspired accents. Generous whitespace and pill-like rounded shapes create a welcoming, Belle Époque Parisian salon aesthetic. The design relies heavily on its unique typography to convey brand identity, keeping UI elements simple so the text and food imagery can shine.

## 2. Color Palette & Roles
* **Café (#aa631a):** Primary Accent. Used for CTA backgrounds, primary links, and brand highlights. Provides strong contrast against white.
* **Gold (#c69951):** Secondary Accent. Used for secondary buttons, hover states, and premium cards. Adds a touch of luxury.
* **Warm Brown (#3f100a):** Primary Text. Used for all headings and body text, avoiding the harshness of pure black while maintaining excellent legibility.
* **Soft Peach (#fff5f2):** Border & Surface. Used for subtle dividers, outlines, and input backgrounds. Barely visible against white, providing extremely soft containment.
* **Pure White (#ffffff):** Background. The primary canvas color ensuring a bright, airy feel.
* **Old Peach (#d9a594):** Section Accent. Used for large section backgrounds to break up white space.
* **Dark Brown (#2e1e16):** Secondary Dark Text/Button. Used for high-contrast interactive elements.
* **Vieux Rose (#ffcebf):** Tertiary Block. Used for soft highlight blocks and alternative filled buttons.

## 3. Typography Rules
* **Heading Font:** `Pestifero-regular` (weight 400). Used for all major display headings (H1, H2) with a distinctive, slightly condensed serif feel and tight letter-spacing (-1.5px). This is the hero element of the design.
* **Body Font:** `Arial` (weight 400). Used for maximum legibility in running text and supporting content. A highly utilitarian choice that offsets the decorative heading font.
* **Subheadings:** `Hkgrotesk-xbold` (weight 800) with wide letter-spacing (4px) for small caps, labels, or overlines.

## 4. Component Stylings
* **Buttons:** 
  - *Primary Filled:* Pill-shaped (`border-radius: 100px` or `182px`), bold styling with solid backgrounds (`#ffcebf` or `#aa631a`).
  - *Outlined:* Zero radius with thin `0.8px` borders (`#ffcebf`) and transparent backgrounds. Text usually in Warm Brown.
  - *Ghost:* Zero radius, relying purely on color changes for interaction cues.
* **Cards/Containers:** Subtly rounded corners (`16px`) with warm, tinted shadows (`rgba(0, 0, 0, 0.11) 0px 2px 10px 0px`). Backgrounds often use Gold (`#c69951`).
* **Tags/Badges:** Highly rounded, pill-like. Used for product labels or categories.
* **Inputs/Forms:** Soft Peach (`#fff5f2`) borders, transparent or white backgrounds, Arial typography.

## 5. Layout Principles
* **Spacing Strategy:** A rigid `10px` base unit. All margins and padding scale by multiples (e.g., 10px, 20px, 32px). Large section gaps use substantial spacing (e.g., `157px`) to maintain the airy feel and separate distinct visual areas.
* **Alignment:** Centered hero text with generous vertical breathing room. Text blocks are typically narrow to ensure optimal reading line length.
* **Elevation:** Flat design with minimal depth. Shadows are used sparingly on cards and dropdowns, always with a warm tint, actively avoiding harsh gray or black drop shadows.
