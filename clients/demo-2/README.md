# Client Profile: Nordic Craft Supplies (demo-2)

## Purpose & Scope

This directory contains the second neutral client profile fixture for **EcomOS**, created under task **ECO-406**.

Its purpose is to decisively prove that EcomOS is **not coupled or hardcoded to ParaLoca** or any single industry/aesthetic. The identical underlying commerce engine (`@ecom-os/engine`, WooCommerce API bridges, cart state, guest checkout, tax, and order tracking) drives this brand without code modifications.

---

## Contrast Matrix: ParaLoca (Angelina) vs. Nordic Craft Supplies (demo-2)

| Parameter | ParaLoca / Angelina Paris | Nordic Craft Supplies (`demo-2`) | Engine Impact |
| :--- | :--- | :--- | :--- |
| **Industry** | Luxury Confectionery & Pâtisserie | General Retail / Craft & Workshop Tools | None (`general_retail` vs `general_retail`) |
| **Primary Hue** | Burgundy / Warm Chestnut (`#5A1C16`) | Slate Charcoal (`#0F172A`) | CSS variable `--primary` |
| **Accent Hue** | Soft Bisque (`#FDE2D6`) | High-contrast Sky Blue (`#0284C7`) | CSS variable `--accent` |
| **Background** | Warm Ivory (`#FFFDF9`) | Cool Technical Slate (`#F8FAFC`) | CSS variable `--background` |
| **Corner Radius** | Soft Organic (`1rem` / `16px`) | Industrial Precision (`0.25rem` / `4px`) | CSS variable `--radius` |
| **Header Slot** | `standard` / `centered` | `minimal` | Layout slot projection |
| **Hero Slot** | `split` (lifestyle imagery + copy) | `minimal` (compact catalog-first banner) | Layout slot projection |
| **Product Grid** | `4-column` editorial cards | `3-column` technical workshop cards | Layout slot projection |
| **Variant Selector**| `pills` (macaron boxes / packaging) | `dropdown` (dimensions / calibers) | Layout slot projection |
| **Footer Slot** | `multi-column` Maison luxury footer | `simple` compact utility footer | Layout slot projection |
| **Capabilities** | Quotes off, Guest checkout on | Quotes off, Guest checkout on | Validated by `ClientCapabilitiesSchema` |
| **Customer Accounts**| Disabled (`false`) | Disabled (`false`) | Phase 4 Architectural Invariant |

---

## File Manifest

1. [`profile.ts`](./profile.ts): Validated `ClientProfile` manifest adhering to `@ecom-os/brand-config`.
2. [`catalog-fixture.json`](./catalog-fixture.json): Craft tools, textiles, and ceramics catalog fixture.
3. [`../../packages/themes/src/clients/demo-2/theme.ts`](../../packages/themes/src/clients/demo-2/theme.ts): Theme definition and CSS variable tokens registered with `@ecom-os/themes`.
