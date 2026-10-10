# ECO-402 Completion Report: ClientProfile Manifest and Schema Validation

## Executive Summary

- **Task**: ECO-402 (Create `ClientProfile` manifest and schema validation; capability flags, shipping/payment methods, industry metadata, environment URLs separated from code.)
- **Executor**: `runtime-cleanup`
- **Lane**: `experience`
- **Tool**: `codex`
- **Base Commit**: `c0f66dc5527720fe9372f8c147957e0bfe48ddf8`
- **Status**: Implemented, verified with unit tests and typechecks, ready for independent verification.

---

## Changed Files & Architecture

All changes reside strictly within claimed file paths (`packages/brand-config`, `docs/ecomos/evidence/ECO-402`):

1. [`packages/brand-config/src/client-profile.ts`](../../../packages/brand-config/src/client-profile.ts):
   - **Capability Flags Schema (`ClientCapabilitiesSchema`)**:
     - Strict validation for capability toggles (`quotes`, `multiCurrency`, `guestCheckout`, `customerAccounts`, `reviews`, `wishlist`, `newsletter`, `facetedSearch`).
     - Rejects arbitrary unknown capability flags (`.strict()`) to prevent unauthorized privilege escalation or unsafe feature toggling.
     - Enforces Phase 4 architectural invariant: Customer accounts stay disabled at direct boundary levels (`capabilities.customerAccounts` cannot be true).
   - **Commerce Rules Schema (`CommerceRulesSchema`)**:
     - Enforces ISO 2-letter uppercase codes for `allowedCountries` (min 1).
     - Validates that `defaultCountry` is present within `allowedCountries`.
     - Validates that `defaultShippingMethod` is present within `allowedShippingMethods`.
     - Enforces certified payment method boundaries (`allowedPaymentMethods` restricted to certified `'cod'` for guest checkout; uncertified gateways like raw Stripe/CMI remain prohibited).
   - **Industry Metadata Schema (`IndustryMetadataSchema`)**:
     - Typed industry classification (`pharmaceutical`, `general_retail`, `cosmetics`, `food_beverage`, `b2b_industrial`, `fashion`, `services`).
     - Regulatory compliance fields: `complianceDisclaimers`, `requiresPrescriptionValidation`, `requiresAgeVerification`, `minimumAge`, `regulatedProductNotice`, `licenseNumber`.
     - Cross-field refinement: If `requiresAgeVerification` is true, `minimumAge` must be explicitly specified and > 0.
   - **Environment URL Separation (`EnvironmentUrlsSchema`)**:
     - Decouples external backend topology (`wooCommerceUrl`, `wordpressUrl`, `searchUrl`, `cdnUrl`, `storefrontUrl`) from application source code.
     - Strict URL parsing disallowing embedded credentials (e.g. `http://user:pass@host`) and insecure protocols (`javascript:`, `file:`, `ftp:`).
     - Disallows secret leakage: tokens, API keys, and credentials cannot reside in environment URL configurations.
   - **Public Client Projection (`toPublicClientProfile`)**:
     - Produces a safe `PublicClientProfile` for client-side components and browser transmission.
     - Strips internal backend URLs (`wooCommerceUrl`, `wordpressUrl`, `searchUrl`) to prevent disclosing private backend infrastructure.
     - Retains only client-facing presentation URLs (`cdnUrl`, `storefrontUrl`), brand styling, safe capabilities, commerce shipping/country rules, and regulatory disclaimers.
   - **Manifest Loader (`loadClientProfile`, `resolveEnvironmentUrlsFromEnv`)**:
     - Merges runtime environment overrides and validates whole profile against `ClientProfileSchema`.
     - Throws actionable `ConfigurationValidationError` detailing exact violation paths.

2. [`packages/brand-config/src/schema.ts`](../../../packages/brand-config/src/schema.ts):
   - Updated `BrandConfigSchema` so `radii.full` is cleanly optional, ensuring backwards-compatibility with existing client configs.

3. [`packages/brand-config/index.ts`](../../../packages/brand-config/index.ts):
   - Exported all client profile types, schemas, projections, and loaders.

4. [`packages/brand-config/src/client-profile.test.ts`](../../../packages/brand-config/src/client-profile.test.ts) (21 tests):
   - Manifest validation for complete ParaLoca pharmaceutical exemplar profile.
   - Capability defaults and invariant enforcement (`customerAccounts: false`, disallowing unknown keys).
   - Commerce constraints: empty countries rejection, country code formatting, default country membership, shipping method membership, uncertified payment method rejection.
   - Industry regulatory constraints: valid industry enums, age verification requirement constraints.
   - Environment URL safety: HTTP/HTTPS validation, rejection of embedded secrets/credentials, protocol filtering, runtime overrides, environment variable mapping.
   - Public projection isolation: verification that internal backend URLs are stripped while public CDN/storefront URLs and compliance notices remain intact.
   - Error handling: non-object inputs and invalid slug/ID formats.

---

## Verification Commands & Observed Results

1. **Brand Config Unit & Contract Tests**:
   ```bash
   npx vitest --run packages/brand-config
   ```
   - **Result**: `2 passed (2)`, `27 passed (27)` tests.

2. **Brand Config TypeScript Typecheck**:
   ```bash
   npx tsc -p packages/brand-config/tsconfig.json --noEmit
   ```
   - **Result**: `0 errors`.

---

## Architectural Invariants Adherence

- **Separation of Capabilities and Server Authority**: The client profile defines presentation and client-side capability toggles, but backend authority (WooCommerce for inventory, prices, guest orders) remains strictly sovereign. Flags alone cannot bypass backend checks.
- **Credential Separation**: Secrets and API keys are strictly forbidden in client profile manifests. Environment URLs are validated for protocol safety and credential absence.
- **Safe Public Projection**: Client-facing components receive only safe public projections without internal server topology disclosures.
