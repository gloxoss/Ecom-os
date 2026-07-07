# Deep Dive: CMS Content and Localization Management

Welcome to the fourth technical manual in the Ecom-os Theme documentation series. This 2000+ word document focuses on how we handle static text, dynamic content blocks, and internationalization (i18n) within heavily customized themes.

A common pitfall in headless e-commerce builds is coupling the frontend too tightly to a visual page builder inside the CMS (like Elementor in WordPress). This destroys performance, breaks custom React components, and violates the separation of concerns. Ecom-os strictly separates structural UI from content.

---

## 1. The Strategy: Structured Data vs. Visual Data

When a merchant uses Ecom-os, they should not be dragging and dropping buttons inside the WordPress admin panel. Instead, they manage **Structured Data**.

### What belongs in the CMS?
- **Products & Categories:** Names, descriptions, prices, SKUs, inventory, images.
- **Global Settings:** Store name, logo URL, currency settings.
- **Headless Content Blocks:** Promotional banners, hero text, blog posts, FAQ items.

### What belongs in the Frontend Theme?
- **Layout & Structure:** CSS Grids, spacing, component ordering.
- **Visual Styles:** Colors, border radii, shadows.
- **Interactive Logic:** Accordions, carousels, modals, cart sidebars.
- **Static Theme Text:** Button labels ("Add to Cart"), navigation links, footer copyright text.

By enforcing this boundary, you can safely deploy radical new themes without destroying the merchant's content, and the merchant can update their catalog without breaking your React components.

---

## 2. Managing Theme-Specific Static Text with Next-Intl

Every custom theme will inevitably require hardcoded text. For example, the `luxury` theme might have a completely bespoke banner section that says "Experience Uncompromising Quality."

**You must never hardcode text directly into the `.tsx` files.**

Because Ecom-os is multi-lingual by default, all static text must be stored in translation maps. We use `next-intl` for this.

### Setting Up Theme Namespaces

To prevent the global translation files (`messages/en.json`, `messages/fr.json`, `messages/ar.json`) from becoming a chaotic mess of overlapping keys, every theme must have its own namespace.

```json
// messages/en.json
{
  "Common": {
    "AddToCart": "Add to Cart",
    "Checkout": "Proceed to Checkout"
  },
  "Theme_Luxury": {
    "HeroHeadline": "Experience Uncompromising Quality",
    "HeroSubline": "Discover the 2026 Collection."
  },
  "Theme_Minimal": {
    "HeroHeadline": "Less is More.",
    "HeroSubline": "Shop the essentials."
  }
}
```

### Accessing Translations in Server Components

Inside your custom Server Components within the theme registry, you retrieve these strings using the `getTranslations` function.

```tsx
// packages/themes/src/clients/luxury/components/LuxuryHero.tsx
import { getTranslations } from 'next-intl/server';

export async function LuxuryHero() {
  // Target the specific namespace for this theme
  const t = await getTranslations('Theme_Luxury');
  
  return (
    <section className="bg-background text-foreground py-24 text-center">
      <h1 className="font-serif text-5xl tracking-widest uppercase">
        {t('HeroHeadline')}
      </h1>
      <p className="mt-6 text-xl text-muted-foreground">
        {t('HeroSubline')}
      </p>
    </section>
  );
}
```

### Why this is critical for agencies
If you are an agency building multiple storefronts on Ecom-os, keeping theme text in `messages/` allows you to deliver a CMS-free experience for "brochure" text while still giving the client a way to edit the text (by editing the JSON file in the repository or using a simple localization management platform like Locize). It keeps the React code pristine and completely devoid of magic strings.

---

## 3. Dynamic Headless Content Blocks

Sometimes, a merchant legitimately needs to update a promotional banner on the homepage every week without pushing code. For this, we use Headless Content Blocks fetched via the `EcomEngine`.

### The `engine.getContentBlock()` Method
The engine abstracts away the complexity of fetching custom post types from WordPress or custom entities from Vendure.

```tsx
export async function DynamicPromoBanner() {
  const engine = await getEngine();
  
  // The backend returns a structured JSON object, NOT HTML!
  const block = await engine.getContentBlock('homepage-promo-banner');
  
  if (!block) return null;
  
  return (
    <div className="bg-primary text-primary-foreground p-4 text-center">
      <h2 className="font-bold">{block.title}</h2>
      <p>{block.subtitle}</p>
      {block.ctaLink && (
        <a href={block.ctaLink} className="underline">{block.ctaText}</a>
      )}
    </div>
  );
}
```

### The Rule Against Raw HTML Injection
You should avoid using `dangerouslySetInnerHTML` whenever possible. 

If the merchant uses a rich text editor (WYSIWYG) in WordPress to write a blog post, it is sometimes unavoidable to inject the resulting HTML. However, for structural elements like banners, grids, and calls-to-action, you should configure the backend (e.g., using Advanced Custom Fields in WordPress) to return clean JSON fields (Title, Subtitle, Image URL).

When you *must* render rich text (e.g., a product description or a blog post), use a highly sanitized parsing library or strict CSS scoping to prevent the injected HTML from breaking your theme's layout.

```tsx
// Safely rendering a WYSIWYG description
export function ProductDescription({ htmlContent }) {
  return (
    <div 
      className="prose prose-sm dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: sanitize(htmlContent) }}
    />
  );
}
```
The `prose` class from `@tailwindcss/typography` is essential here—it ensures that random `<h1>` or `<ul>` tags injected by the CMS are styled elegantly according to your theme variables, rather than inheriting global resets.

---

## 4. Handling Right-to-Left (RTL) Languages

Because Ecom-os is built for global deployment (and heavily used in regions requiring Arabic support), every custom component you build inside a theme MUST natively support RTL layouts.

### Tailwind v4 RTL Support
We rely heavily on logical CSS properties provided by modern Tailwind. You should completely eliminate the use of physical directional utility classes (`ml-4`, `pr-2`, `left-0`).

Instead, use logical utility classes:

```tsx
// ❌ INCORRECT (Physical properties)
<div className="ml-4 pl-8 border-l-2">...</div>

// ✅ CORRECT (Logical properties)
<div className="ms-4 ps-8 border-s-2">...</div>
```
- `ms-4` (margin-inline-start) becomes `margin-left` in LTR, and `margin-right` in RTL.
- `ps-8` (padding-inline-start) becomes `padding-left` in LTR, and `padding-right` in RTL.
- `border-s-2` (border-inline-start-width) puts the border on the correct logical edge.

### Flipping Icons and Animations
Some visual elements need manual flipping in RTL contexts. 

For icons (like back arrows), you can use the `rtl:rotate-180` variant in Tailwind:
```tsx
<ArrowIcon className="rtl:rotate-180" />
```

For Framer Motion animations (e.g., a sidebar sliding in from the left), you must detect the locale direction and adjust the `x` coordinates accordingly.

```tsx
'use client';
import { motion } from 'framer-motion';
import { useLocale } from 'next-intl';

export function AnimatedSidebar() {
  const locale = useLocale();
  const isRtl = locale === 'ar'; // Or check an array of RTL locales
  
  // In LTR, slide in from -100% (left). In RTL, slide in from 100% (right).
  const initialX = isRtl ? '100%' : '-100%';
  
  return (
    <motion.aside
      initial={{ x: initialX }}
      animate={{ x: 0 }}
      className="fixed top-0 bottom-0 w-64 bg-background border-e"
    >
      {/* Sidebar Content */}
    </motion.aside>
  );
}
```

### The Direction Attribute
The Next.js `app/[locale]/layout.tsx` file automatically applies `dir="rtl"` to the `<html>` tag based on the locale parameter. The browser handles the text alignment and flexbox reversal automatically. Your only job as a theme developer is to ensure you use logical CSS properties and manually flip directional icons and absolute positioning where necessary.

---

## 5. Currency and Formatting

Prices in e-commerce are never just raw numbers. They involve symbols, separators, and specific formatting rules based on the locale and currency.

### Rely on the Engine and Next-Intl
The backend `EcomEngine` handles returning the correct numerical value for the product based on the active currency. However, formatting that number into a human-readable string is the responsibility of the frontend.

Always use the Next-intl formatting utilities to ensure prices look native to the user's region.

```tsx
import { useFormatter } from 'next-intl';

export function PriceDisplay({ amount, currencyCode }) {
  const format = useFormatter();
  
  // If locale is 'fr', this formats as "1 200,50 €"
  // If locale is 'en', this formats as "€1,200.50"
  const formattedPrice = format.number(amount, {
    style: 'currency',
    currency: currencyCode
  });
  
  return <span className="font-mono text-lg font-bold">{formattedPrice}</span>;
}
```

Never try to write your own regex or string concatenation functions to format currencies. It will fail on edge cases and frustrate international users.

---

## Conclusion

By treating the CMS strictly as a repository for normalized JSON data, relying on Next-intl for static theme text, and embracing logical CSS properties for RTL support, you guarantee that your bespoke themes are universally deployable.

A developer can take your `luxury` theme, deploy it for a French client selling in Euros, and deploy it for a Moroccan client selling in MAD with an Arabic interface, without changing a single line of React code.

Proceed to the final manual, `05-THEMING-AND-ANIMATION.md`, to learn how to master the build-time CSS injection strategy and safely implement heavy interactive animations.
