# Client Profile: ParaLoca (`paraloca`)

## Brand Identity & Domain Context

- **Brand Spelling**: **ParaLoca** (CamelCase branding)
- **Primary Domain**: `paraloca.ma`
- **Market Context**: Casablanca, Morocco (`MA`)
- **Primary Currency**: `MAD` (Moroccan Dirham)
- **Primary Locale**: French (`fr`), with Arabic (`ar`) typography readiness
- **Design Thesis**: Editorial warmth × precise clinical commerce (clean, light, minimal medical-lifestyle aesthetic based on `references/PARALOCA_DESIGN_REFERENCE.md`)

---

## Architectural & Commerce Invariants

1. **Zero Forking**: ParaLoca is a client configuration profile mounted onto the standard EcomOS commerce architecture. No core engine or checkout code is branched or altered.
2. **Certified Payment Gateways Only**: Payment methods are restricted to certified gateways (`cod` - Cash on Delivery). Direct uncertified gateways (CMI, international cards) remain turned off pending formal merchant accreditation and production keys.
3. **Guest Checkout Isolation**: Standard consumer purchases operate via verified guest sessions with zero mandatory customer account creation (`capabilities.customerAccounts = false`).
4. **Environment Secrets Decoupling**: All secrets, WordPress REST API keys, and HPOS webhook tokens reside strictly in environment variables, never checked into client configuration manifests.
5. **Addon Off-State by Default**: The B2B Quotes / RFQ addon is cleanly disabled in initial profile validation (`capabilities.quotes = false`) and activated discreetly under task **ECO-805**.

---

## File Structure

- [`profile.ts`](./profile.ts): Canonical validated `ClientProfile` conforming to `@ecom-os/brand-config`.
- [`profile.test.ts`](./profile.test.ts): Contract suite asserting schema compliance, currency constraints, forbidden secret leakage, and payment boundaries.
- [`../../packages/themes/src/clients/paraloca/theme.ts`](../../packages/themes/src/clients/paraloca/theme.ts): Theme definition and CSS variable design tokens registered in `@ecom-os/themes`.
