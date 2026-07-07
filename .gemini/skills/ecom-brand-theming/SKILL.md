---
name: ecom-brand-theming
description: Guide for per-client brand configuration. Use when setting up brand tokens, swapping themes, configuring Tailwind v4 @theme, or customizing the storefront for a new client deployment.
---

# Ecom OS Brand Theming Skill

## When to Use
- Setting up a new client deployment's brand
- Modifying `brand.config.ts`
- Connecting brand tokens to Tailwind v4 @theme
- Achieving the "≤ 4-hour brand swap" target

## Brand Config Schema

```typescript
// packages/brand-config/index.ts
export type BrandConfig = {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
  };
  fonts: {
    sans: string;
    mono: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
  };
};
```

## How It Works

1. Each deployment has `apps/storefront/brand.config.ts`
2. Brand values feed into Tailwind v4 `@theme` tokens in `globals.css`
3. All components use token-based classes (`text-primary`, `bg-background`)
4. Changing one color in `brand.config.ts` and rebuilding shifts the entire storefront

## Brand Swap Checklist (≤ 4 hours)

- [ ] Update `brand.config.ts` — colors, fonts, radii
- [ ] Replace logo files (light + dark variants)
- [ ] Update hero copy in `features/home/data/`
- [ ] Update contact info + social links
- [ ] Update `BRAND_NAME` env var
- [ ] Rebuild and verify: `pnpm --filter storefront build`
- [ ] Visual check: home page, catalog, PDP, checkout

## Tailwind v4 @theme Pattern

```css
/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: var(--brand-primary);
  --color-secondary: var(--brand-secondary);
  --color-background: var(--brand-background);
  --color-foreground: var(--brand-foreground);
  --font-sans: var(--brand-font-sans);
  --font-mono: var(--brand-font-mono);
  --radius-sm: var(--brand-radius-sm);
  --radius-md: var(--brand-radius-md);
  --radius-lg: var(--brand-radius-lg);
}
```

## Rules
1. **No hardcoded colors in components** — always use design tokens
2. **No direct hex/rgb values** — use `text-primary`, `bg-background`, etc.
3. **Logo must have light + dark variants**
4. **Font families loaded via `next/font`** — no external CDN links
