---
name: angelina-theme
description: "Design logic, UI patterns, and styling rules for the Angelina Paris theme. Use this skill when building or cloning UI for the Angelina theme. Enforces colors, typography, rounded corners, and component structures derived from the original site."
---
# Angelina Theme Guidelines

## When to Use This Skill
Use this skill whenever you are asked to build or clone UI components, pages, or layouts using the "Angelina" theme, or when working within the `angelina-ui` directory.

## Source of Truth
The complete design system and UI patterns are located alongside this skill file:
- `DESIGN.md`: The semantic design system detailing the atmosphere, colors, and typography.
- `ui-patterns.md`: The specific component structures, interactive states, and animations.

## Core Rules
1. **Backgrounds**: Use `#ffffff` for the primary canvas. Never use dark backgrounds, this is a highly light and airy theme.
2. **Typography**: Headings must use `Pestifero-regular` (the custom web font). Body text uses `Arial`.
3. **Accent Colors**: `#aa631a` (Café) is the primary CTA color. `#c69951` (Gold) is secondary.
4. **Borders & Radii**: Emphasize highly rounded corners. Pills (`100px+`) for buttons and badges, `16px` for cards.
5. **Spacing**: The base unit is `10px`. Always use multiples of 10 for padding and margins (e.g. `p-5` for 20px in Tailwind, `gap-[10px]`, `gap-[20px]`). Large section breaks should be substantial (e.g., `150px`).
6. **Shadows**: Avoid harsh black or gray shadows. Use warm, tinted shadows (`rgba(0, 0, 0, 0.11) 0px 2px 10px 0px`).

## Tailwind CSS Setup
The CSS custom properties have been implemented in `globals.css` using Tailwind v4's `@theme inline` directive. Refer to `globals.css` for the exact variable names, which include:
- `bg-background` (`#ffffff`)
- `text-foreground` (`#3f100a`)
- `bg-cafe` (`#aa631a`)
- `bg-gold` (`#c69951`)
- `font-heading` (`Pestifero-regular`)
- `font-body` (`Arial`)
