---
name: ecom-os-frontend
description: "Core UI logic, frontend architecture, and theming principles for Ecom-os. Use this skill whenever asked to build, modify, or plan any frontend pages, UI components, layouts, or animations in the Ecom-os Next.js storefront. Enforces strict backend decoupling and theme consistency."
---

# Ecom-os Frontend Rules & Theming

This skill enforces the UI architecture and theming principles for building frontend features in **Ecom-os**.

You MUST follow these rules when writing React code or CSS in this repository.

## 1. Engine-Agnostic UI

**Rule:** UI Components must NEVER import from specific engine implementations (e.g., `@ecom-os/engine-woocommerce` or Shopify/Magento specific packages).

- **Always do this:** 
  ```tsx
  import { getEngine } from '@/lib/engine';
  // ...
  const engine = await getEngine();
  const products = await engine.listProducts({ category: 'shoes' });
  ```
- **Why:** The storefront must remain completely agnostic to the underlying backend. This allows switching the database or platform via environment variables without rewriting the frontend.

## 2. Server Components First

**Rule:** Fetch data in React Server Components (RSC) and pass only the needed data down to Client Components.

- Page components (`page.tsx`) must be `async` and fetch data using `getEngine()`.
- Client components should receive this data as standard JSON props.
- Keep Client Components small and restrict them to the leaf nodes of the component tree (e.g., interactive elements like `AddToCartButton` or carousels).

## 3. The Capability Matrix

**Rule:** Conditionally render features based on the store's capabilities matrix.

- Different backends have different active plugins (e.g. Loyalty, Coupons, Guest Checkout).
- Always use the `<IfCapable>` wrapper to render these features:
  ```tsx
  import { IfCapable } from '@/components/if-capable';
  
  <IfCapable capability="loyaltyEnabled">
    <LoyaltyPointsWidget customerId={session.customer.id} />
  </IfCapable>
  ```
- This ensures the UI degrades gracefully if a plugin is missing or disabled.

## 4. Theming Logic & Design Tokens

**Rule:** NEVER hardcode arbitrary colors or spacing. All colors, typography, and spacing must be driven by the centralized Theme Configuration.

Ecom-os uses a strict Design Token system to support saving a theme and reusing it for new clients.

- **Use CSS Variables:** Colors are mapped to variables like `bg-primary`, `bg-background`, `text-foreground`, `text-muted`.
- **Theme Registry:** Do not bypass the design tokens. If a new color is needed, it must be added to the theme registry in `packages/themes/`.

## 5. Structuring Page Data & Custom Components

When building standard e-commerce pages or custom React pages for a theme:

- **The Golden Rule:** NEVER fetch data directly from `/wp-json` or `/graphql`. Always use `getEngine()`.
- **Homepage (`/`):** 
  - Hero sections should fetch data from a headless CMS or standard fields, with fallback to static text.
  - Featured sections should use `engine.listProducts({ featured: true })` or specific categories.
- **Shop / Catalog (`/catalog`):**
  - Implement filters via `engine.listCategories()`.
  - Handle standard pagination through the `listProducts(query)` arguments.
- **Add to Cart & Checkout:**
  - Always use the pre-built Server Actions (e.g., `addToCartAction()`) inside client components rather than trying to build direct API mutations.
  - Keep the standard `engine.initCheckout` and `engine.placeOrder` lifecycle methods exactly as they are designed.

## 6. Styling and Animations

- **Styling:** Use standard Tailwind utility classes tied to our theme variables.
- **Animations:** Use Framer Motion or lightweight CSS transitions. Do not overcomplicate animations; ensure they are smooth and don't block the main thread.
- **Responsiveness:** Build mobile-first. Ensure all tables, grids, and navigation elements work flawlessly on small screens.

## 7. Saving Themes & UI Templates

To ensure Ecom-os can rapidly deploy new stores for different clients, you must follow the Theme Registry pattern when creating new visual styles.

### A. Saving a New Theme
When you create a new brand identity for a client, do NOT overwrite the `default` theme. Instead:
1. **Create a Theme File:** Create a new file in `packages/themes/src/clients/` (e.g., `client-b.ts`).
2. **Define Tokens:** Export a new `EcomTheme` object containing the specific color palette (using RGB strings for Tailwind compatibility), fonts, and border radius rules.
3. **Register It:** Add the theme to the main registry index in `packages/themes/src/index.ts`.
4. **Activate It:** The Next.js app reads the `THEME_NAME` environment variable at build time to inject the correct CSS variables into the `:root` HTML tag.

### B. UI Component Templates
Sometimes modifying CSS colors isn't enough; a client needs a structurally different component (e.g., a "Luxury" Hero section vs a "Minimal" Hero section).
1. **Create Variations:** Build component variations alongside each other (e.g., `HeroMinimal.tsx`, `HeroLuxury.tsx`, `HeroDefault.tsx`).
2. **Template Registry:** Export these from a component registry. 
3. **Theme Configuration:** The `EcomTheme` object can optionally include a `templates` mapping:
   ```ts
   templates: {
     hero: 'luxury',
     productCard: 'minimal'
   }
   ```
4. **Dynamic Rendering:** The base component (e.g., `<Hero />`) reads the active theme's template preference and dynamically renders the correct variation. Never use `if (client === 'A')` in your components. Always bind it to the Theme configuration.

## 8. Creating the Design Kit (DESIGN.md & ui-patterns.md)

Whenever a new theme or client is created, you MUST create a dedicated design kit inside `packages/themes/src/clients/[client-name]/`. This acts as the source of truth for both developers and AI design tools.

### A. DESIGN.md
Create a `DESIGN.md` that synthesizes the technical theme into semantic, evocative language.
- **Visual Theme & Atmosphere:** Describe the mood (e.g., "Airy, Minimalist, Utilitarian").
- **Color Palette & Roles:** List colors with natural language, hex codes, and their functional role (e.g., "Ocean-deep Cerulean (#0077B6): Used for primary actions").
- **Typography Rules:** Describe the font family, weights for headers vs body, and character spacing.
- **Component Stylings:** Translate technical values into physical descriptions (e.g., "Pill-shaped buttons" instead of `rounded-full`, "Whisper-soft shadows" instead of `shadow-sm`).
- **Layout Principles:** Describe whitespace strategy, margins, and grid behavior.

### B. ui-patterns.md
Create a `ui-patterns.md` to document the specific structural templates and animation styles.
- **Component Variations:** Which UI templates does this theme use? (e.g., "Uses HeroLuxury.tsx with sticky scrolling").
- **Animation Philosophy:** How does motion work? (e.g., "Framer Motion spring physics with high damping for realistic settling").
- **Interaction States:** Hover effects, active states, and focus rings.

## 9. Gotchas

- If you find yourself importing from `engine-woocommerce` inside `apps/storefront`, STOP. You are breaking the decoupling rule.
- Do not use Zustand or Redux for server-side state. Let Server Components handle initial load, and only use client state for user interactions (like an open cart drawer).
