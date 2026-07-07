# Section 02 — Brand Config & Theme Tokens

> **Batch 2 · Risk: green · Deps: 01 · Tasks: 4 · Blueprint: Step 5**

## Why this section exists
FR-040/041: each deployment brandable end-to-end in ≤ 4 hours by one developer. Brand config is a typed schema that feeds Tailwind v4 `@theme` tokens at build time. The shipped `packages/brand-config/index.ts` is a thin skeleton missing most of the FR-040 fields.

## Requirements covered
- **FR-040** `brand.config.ts` contains: brand name, logo paths (light+dark), primary/secondary/accent colors, font families, hero copy, contact info, social links
- **FR-041** new deployment brandable in ≤ 4h

## Tasks
1. **Expand `BrandConfig` schema** (`packages/brand-config/index.ts`) to cover all FR-040 fields: `name`, `logos {light,dark}`, `colors {primary,secondary,accent,background,foreground,muted}` (6 colors per success metric F-04), `fonts {sans,mono}` (2 per F-04), `hero {headline,subheadline,ctaLabel,ctaHref,image}`, `contact {email,phone,address}`, `social {instagram,facebook,...}`. Zod schema for runtime validation at build.
2. **Token generator** — `packages/brand-config/src/tokens.ts` maps `BrandConfig.colors` → Tailwind v4 `@theme` CSS custom properties, emits `apps/storefront/src/styles/brand.tokens.css`. Run via `prebuild` hook (Cahier §9 Step 5).
3. **Wire tokens into `globals.css`** — import generated tokens so `text-primary`, `bg-background`, etc. resolve from brand config. Update default `apps/storefront/brand.config.ts` with all FR-040 fields populated as placeholders.
4. **Brand-swap acceptance test** — document + verify: change one color in `brand.config.ts` → `pnpm build` → home page color shifts. Target ≤ 4h documented in `packages/brand-config/README.md`.

## Inputs
- Section 01 (no engine coupling, but shared TS strictness), Cahier §2 (Tailwind v4), pre-dev PRD F-04

## Outputs
- `packages/brand-config/src/{schema.ts,tokens.ts,index.ts}`
- `apps/storefront/src/styles/brand.tokens.css` (generated, gitignored)
- `apps/storefront/brand.config.ts` (default placeholders)
- `packages/brand-config/README.md`

## Acceptance Criteria
- [ ] All FR-040 fields present and typed (Zod-validated)
- [ ] Changing one brand color rebuilds with the new color on `/`
- [ ] `brand.tokens.css` is generated, not hand-edited (gitignored + `prebuild` hook)
- [ ] README documents the ≤ 4h brand-swap procedure

## Skills to load
`tailwind-patterns` (Tailwind v4 `@theme`), `nextjs-shadcn` (shadcn theme tokens), `tailwind-design-system`

## Risks / notes
- Tailwind v4 `@theme` is CSS-first — confirm the generated CSS syntax matches v4 (not v3 `theme.extend`).
- Fonts use `next/font` variables (already wired in layout) — brand fonts should map to those variables, not raw font names.
