# Local Dev Setup

## Prerequisites
- Node.js 22 LTS
- pnpm ≥ 9
- A WordPress + WooCommerce + WPGraphQL sandbox

## Steps
1. `pnpm install`
2. Copy `.env.example` → `.env.local` and fill in values
3. Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
4. `pnpm --filter storefront dev`

Open http://localhost:3000

## Engine
Set `ECOM_ENGINE=woocommerce` (or `fake` for UI-only work with no WC instance).

## Addons
`ADDONS=i18n,multi-payment` — comma-separated. Empty string disables all addons.
Run `pnpm generate:addons` after changing ADDONS.
