# ParaLoca — Approved Design Specification (`DESIGN.md`)

- **Design Version**: 1.0 (Phase 8 Production Implementation)
- **Approved Reference**: `references/PARALOCA_DESIGN_REFERENCE.md`
- **Brand Orthography**: **ParaLoca**
- **Domain**: `paraloca.ma`

---

## 1. Design Thesis: Editorial Warmth × Precise Clinical Commerce

ParaLoca represents a contemporary Moroccan medical equipment and healthcare distributor. The visual direction balances the precision, reassurance, and authority required for clinical devices with the warmth, accessibility, and high editorial polish of a premium lifestyle commerce experience.

- **Atmosphere**: Approachable specialist, serene and orderly. Expansive whitespace, warm off-white surfaces, restrained medical sage/teal accents.
- **Negative Boundaries**:
  - No hospital-blue gradients or harsh emergency motifs.
  - No medical crosses tiled as decorative background patterns.
  - No false badges, fake countdown timers, or simulated urgency chips.
  - No low-contrast micro-typography below 12px.

---

## 2. Color Palette & Semantic Tokens

| Semantic Token | Hex Value | HSL Value | WCAG Contrast on White | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--pl-bg` | `#FFFFFF` | `0 0% 100%` | 1.0:1 | Primary canvas and elevated cards |
| `--pl-surface-soft` | `#F6F6F4` | `60 7% 96.5%` | 1.07:1 | Full-width section dividers & banners |
| `--pl-surface-product` | `#F1F1EF` | `60 6% 94.1%` | 1.14:1 | Clean 1:1 catalog product image tiles |
| `--pl-text` / `--pl-ink` | `#171817` | `120 2% 9%` | **16.6:1** (AAA) | Primary typography, headers, main actions |
| `--pl-text-secondary` | `#595D5A` | `135 2% 36%` | **5.7:1** (AA) | Subheads, technical specs, metadata |
| `--pl-text-muted` | `#767B77` | `133 2% 47.5%` | **4.6:1** (AA) | Minor metadata, quiet badges, footnotes |
| `--pl-accent` | `#276C61` | `170 47% 28.8%` | **5.3:1** (AA) | Medical accent, filter active chips, verify pins |
| `--pl-accent-soft` | `#EAF2EF` | `157 26% 93.5%` | - | Secondary pill fills, info banners |
| `--pl-border` | `#E2E4DF` | `84 8% 88.4%` | - | Hairline boundaries and form outlines |
| `--pl-focus` | `#165FBA` | `213 79% 41%` | **5.9:1** (AA) | Keyboard focus ring (distinct from accent) |
| `--pl-destructive` | `#A93636` | `0 52% 43.7%` | **5.4:1** (AA) | Form errors and critical alerts |

---

## 3. Typography Hierarchy

- **Primary Sans**: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Display Headings**: `Manrope, -apple-system, BlinkMacSystemFont, sans-serif` (tracked tight, weight 700-800)
- **Arabic Script**: `Noto Sans Arabic` (proper ligature shaping and right-to-left layout alignment)
- **Tabular Numerals**: `font-variant-numeric: tabular-nums` for prices, dimensions, SKUs, and stock quantities.

---

## 4. Layout Architecture & Component Slots

1. **Header Slot (`standard`)**:
   - Clean white banner with left-aligned **ParaLoca** wordmark.
   - Main navigation: *Boutique / Catégories / Marques / Matériel Médical / Demande de Devis*.
   - Wide accessible search input + wishlist heart + cart counter.
2. **Hero Slot (`split`)**:
   - Editorial photography with authentic home-care environment paired with crisp typography.
   - Primary CTA: *Découvrir les équipements*, secondary link: *Demande de devis professionnel*.
3. **Product Grid Slot (`3-column`)**:
   - 3 columns on desktop (1280px+), 2 columns on tablet/mobile.
   - 1:1 neutral product tile cutout with unobtrusive wishlist trigger and explicit variation selectors.
4. **Footer Slot (`multi-column`)**:
   - Dark editorial ink (`#111211`) footer with high-contrast text (`#FFFFFF` / `#CBD5E1`).
   - Customer support, Moroccan legal mentions, distributor disclosures, and payment/delivery guarantees.
