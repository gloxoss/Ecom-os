# Architectural Decision (AD-704): RFQ WordPress Backend Strategy

## Context
EcomOS requires a durable, versioned quotation (Request for Quote / Devis) backend in WordPress that supports:
1. Pure headless REST API operation (`/wp-json/ecomos/v1/rfq/*`) consumed by the Next.js storefront.
2. Cryptographic guest ownership without requiring B2C WordPress customer user accounts (`wp_users`).
3. Immutable multi-revision pricing offers (`rev_1`, `rev_2`...) created and amended by merchant operators.
4. Total compatibility with WooCommerce High-Performance Order Storage (HPOS).
5. Addon off-state isolation (disabling the addon immediately revokes routes with HTTP 404 and halts processing).

## Evaluation of Options

### Option A: Off-the-Shelf Quotation Plugins (e.g. YITH Request a Quote, NP Quote)
- **Strengths**: Pre-built admin screens in WordPress dashboard.
- **Critical Flaws**:
  - Built exclusively for server-rendered PHP templates, shortcodes, and PHP session cookies.
  - No versioned REST APIs; client requests cannot query or submit quotes without cookie authentication.
  - Lacks immutable revision history: edits overwrite existing quote fields destructively.
  - Forces WordPress user registration, violating the guest B2B/B2C requirement.
  - Alters core WooCommerce cart sessions destructively, violating our cart isolation invariant.
  - Introduces recurring licensing costs and third-party update fragility.

### Option B: Custom Companion Plugin (`wp-ecomos-rfq`)
- **Strengths**:
  - Implements lightweight dedicated custom tables (`wp_ecomos_rfq_quotes`, `wp_ecomos_rfq_revisions`) with zero mutation of core WooCommerce tables (`wp_posts`, `wp_wc_orders`).
  - Native, typed, versioned REST endpoints (`/wp-json/ecomos/v1/rfq/*`).
  - Native support for HMAC guest ownership verification (`accessSecretHash`).
  - Enforces immutable revision snapshots with atomic transition validation.
  - Strict capability gating (`ecomos_operator`, `manage_woocommerce`) and addon off-state interception.
  - 100% owned, open, and zero licensing overhead.

## Decision
Adopt **Option B: Custom Companion Plugin (`wp-ecomos-rfq`)**.
This ensures seamless headless integration, atomic revision preservation, and complete compliance with EcomOS architectural invariants.
