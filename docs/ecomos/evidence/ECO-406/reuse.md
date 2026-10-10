# ECO-406 Architectural Proof: Multi-Theme Commerce Reuse

## Objective

Demonstrate that EcomOS is **not bound to ParaLoca** or any single merchant domain, and that multiple distinct client profiles and visual themes reuse the identical commerce engine without application core modifications.

---

## 1. Client Profile Comparison: ParaLoca (Angelina) vs. Nordic Craft Supplies (demo-2)

| Parameter | ParaLoca / Angelina Paris | Nordic Craft Supplies (`demo-2`) | Decoupling Mechanism |
| :--- | :--- | :--- | :--- |
| **Profile ID** | `paraloca` / `angelina` | `demo-2` | Schema-validated `ClientProfile` manifest |
| **Domain & Catalog** | Luxury Confectionery, Tea & Macarons | Workshop Outillage, Raw Textiles & Ceramics | Product catalog fixture & WooCommerce backend |
| **Design Aesthetic** | Warm Ivory & Burgundy French Maison | Cool Slate & Sky Blue Scandinavian Modern | CSS Design Tokens via `@ecom-os/themes` |
| **Primary Color** | Burgundy (`7 73% 14%` / `#5A1C16`) | Slate Charcoal (`222.2 47.4% 11.2%` / `#0F172A`)| `--primary` CSS variable |
| **Accent Color** | Soft Bisque (`14 100% 87%` / `#FDE2D6`) | High-contrast Sky Blue (`199 89% 48%` / `#0284C7`)| `--accent` CSS variable |
| **Background Color** | Warm Off-White (`0 0% 100%`) | Slate Gray (`210 40% 98%` / `#F8FAFC`) | `--background` CSS variable |
| **Border Radius** | `1rem` (16px, soft organic luxury) | `0.25rem` (4px, sharp technical precision) | `--radius`, `--radius-sm/md/lg` |
| **Header Slot** | `standard` (full brand navigation) | `minimal` (compact catalog-first utility) | `slots.header` layout projection |
| **Hero Slot** | `split` (lifestyle imagery + story copy) | `minimal` (concise catalog banner) | `slots.hero` layout projection |
| **Product Grid Slot** | `4-column` (editorial cards) | `3-column` (workshop technical cards) | `slots.productGrid` layout projection |
| **Variant Selector** | `pills` (macaron boxes / packaging) | `dropdown` (dimensions / calibers) | `slots.variantSelector` layout projection |
| **Footer Slot** | `multi-column` (Maison history & links) | `simple` (compact utility footer) | `slots.footer` layout projection |

---

## 2. Invariant Commerce Engine Consistency

Despite completely distinct visual presentations, both clients share 100% identical backend contracts:

1. **Monetary System**:
   - Both utilize `Money` type with integer `amount_minor` and ISO 4217 currency (`MAD`).
   - Minor units eliminate floating-point arithmetic errors across all cart and line item calculations.

2. **Cart & Inventory Lifecycle**:
   - Same cart aggregate structure (`items`, `subtotal`, `total`, `taxVisibility`).
   - Authoritative stock verification via WooCommerce inventory (`status: IN_STOCK | OUT_OF_STOCK`).

3. **Certified Guest Checkout**:
   - Single certified payment method: Cash on Delivery (`cod`).
   - Identical Moroccan shipping rules (`allowedCountries: ['MA']`, `defaultCountry: 'MA'`).
   - Duplicate-safe idempotent submission lock and client address validation.

4. **Security & Capabilities Policy**:
   - **Customer accounts stay strictly disabled** (`capabilities.customerAccounts = false`), validated at schema parse time.
   - RFQ quote capability is disabled (`capabilities.quotes = false`) for both initial retail storefront profiles.
   - Decoupled environment URLs: backend endpoints (`wooCommerceUrl`, `wordpressUrl`) are scrubbed before browser transmission via `toPublicClientProfile`.

---

## 3. Conclusion

EcomOS successfully achieves architectural multi-tenancy through decoupled design tokens, slot orchestration, and schema-validated `ClientProfile` manifests. Frontend variation is achieved strictly through CSS variables and layout slots without requiring custom forks or engine modifications.
