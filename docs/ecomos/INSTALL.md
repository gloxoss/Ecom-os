# EcomOS Platform Installation Guide

- **Document**: `INSTALL.md`
- **Application**: EcomOS Dual-Engine E-Commerce Platform
- **Version**: 1.0.0
- **Status**: **PRODUCTION CERTIFIED**

---

## 1. Prerequisites & System Requirements

- **Node.js**: `v22.0.0` or later (LTS recommended)
- **Package Manager**: `pnpm` `11.7.0` (frozen lockfile enforcement)
- **Backend Host**: WordPress `6.4+` with WooCommerce `8.5+` (HPOS enabled)
- **PHP**: `8.1.0` through `8.3.x` with `pdo_mysql`, `sodium`, and `opcache`
- **Database**: MySQL `8.0+` or MariaDB `10.6+`

---

## 2. Storefront Installation

1. **Clone & Install Dependencies**:
   ```bash
   pnpm install --frozen-lockfile
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env.local` or `.env.paraloca`:
   ```bash
   cp .env.example .env.local
   ```
   Configure mandatory environment variables:
   - `ECOM_CLIENT_PROFILE`: `paraloca` (default)
   - `NEXT_PUBLIC_WORDPRESS_URL`: Backend WordPress REST/GraphQL origin
   - `WC_REST_KEY` / `WC_REST_SECRET`: WooCommerce read/write credentials
   - `ECOM_OS_ENCRYPTION_KEY`: 32-byte Base64 key
   - `SESSION_COOKIE_SECRET`: Session authentication secret ($\ge 32$ chars)

3. **Validate Architectural Boundaries**:
   ```bash
   pnpm guard
   ```

4. **Build Production Assets**:
   ```bash
   pnpm --filter storefront build
   ```

---

## 3. WordPress Companion Plugins Installation

Copy or symlink companion plugins from `plugins/` into your WordPress `wp-content/plugins/` directory:

1. **`wp-ecomos-addons`**: Addon lifecycle, feature flags, and settings schema.
2. **`wp-ecomos-operations`**: Operational health probes and HPOS compatibility bridge.
3. **`wp-ecomos-rfq`**: Durable quotation request tables (`wp_ecomos_rfq_quotes`, `wp_ecomos_rfq_revisions`).

Activate via WP-CLI:
```bash
wp plugin activate wp-ecomos-addons wp-ecomos-operations wp-ecomos-rfq
```

---

## 4. Search Provider Configuration

EcomOS provides a typed `SearchProvider` abstraction (`packages/ecom-engine/src/search`):
- **Native WooCommerce Search**: Default fallback; zero additional infrastructure required.
- **Typesense**: Self-hosted or cloud search engine for typo-tolerant fast queries.
- **Meilisearch**: High-relevance open-source search engine.

Select the provider in `.env`:
```env
SEARCH_PROVIDER=typesense # or meilisearch | native
```
All providers fallback explicitly to Native Woo search if the external cluster becomes unreachable.
