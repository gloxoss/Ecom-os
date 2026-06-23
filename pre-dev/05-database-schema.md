# Database Schema — Ecom OS

Two layers of schema:

1. **Engine-native tables** — owned by WooCommerce or Vendure. Ecom OS does not redefine these; we read/write through the engine's API.
2. **Ecom-OS-owned addon tables** — created by EPIOSO WP plugins (MySQL) or Vendure plugin migrations (PostgreSQL). Defined below.

---

## 1. Engine-native tables (reference only — not redefined here)

| Concept | WooCommerce table | Vendure table |
|---|---|---|
| Customers | `wp_users` + `wp_usermeta` | `customer` + `user` |
| Products | `wp_posts` (type: product) + `wp_postmeta` + `wp_woocommerce_*` | `product`, `product_variant`, `product_translation` |
| Categories | `wp_terms` + `wp_term_taxonomy` (product_cat) | `collection`, `collection_translation` |
| Cart | session-based (`wp_woocommerce_sessions`) | `order` (draft state) |
| Orders | `wp_posts` (type: shop_order) + `wp_postmeta` + `wp_woocommerce_order_items*` | `order`, `order_line`, `payment` |
| Addresses | meta on customer + per-order | `address` |

We do **not** write migrations for these. We rely on the engine's installation to provide them.

---

## 2. Ecom OS-owned addon tables

These are the ONLY tables Ecom OS code creates and owns. Schemas given in engine-neutral form below; the actual implementation is a WP migration (MySQL) or a Vendure plugin TypeORM entity (PostgreSQL).

### `ecom_i18n_dictionary` (owned by i18n addon, v1)

Stores translation strings that the merchant can edit through the admin UI.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string (uuid/bigint) | PK | |
| `addon_namespace` | varchar(64) | NOT NULL, indexed | `i18n` for core strings; future addons add their own namespace |
| `key` | varchar(256) | NOT NULL | dot.notation, e.g. `cart.add_to_cart` |
| `locale` | varchar(16) | NOT NULL | BCP47 (`fr`, `ar`, `en`, `fr-MA`) |
| `value` | text | NOT NULL | the translated string |
| `updated_at` | timestamp | NOT NULL, default now | |
| `updated_by` | varchar(64) | nullable | engine user id, for audit |

**Indexes:**
- UNIQUE (`addon_namespace`, `key`, `locale`)
- Index on (`locale`)

**Notes:**
- Defaults are seeded from JSON files at addon install; merchant edits overlay seeded values.
- Reads at request time go through the i18n addon's in-memory cache (warmed at boot, invalidated on write).

---

### `ecom_payment_gateway_config` (owned by multi-payment addon, v1)

Per-deployment configuration for each enabled payment provider. Secrets are encrypted at rest with a key derived from `ECOM_OS_ENCRYPTION_KEY` (env-only).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string | PK | |
| `provider_id` | varchar(32) | NOT NULL, UNIQUE | `cmi` · `stripe` · `cod` |
| `enabled` | boolean | NOT NULL, default false | Toggle per deployment |
| `config_encrypted` | text | NOT NULL | AES-256-GCM ciphertext (provider keys, merchant IDs, etc.) |
| `display_order` | int | NOT NULL, default 0 | Sort order at checkout |
| `updated_at` | timestamp | NOT NULL, default now | |

**Indexes:**
- UNIQUE (`provider_id`)
- Index on (`enabled`)

---

### `ecom_webhook_delivery_log` (owned by multi-payment addon, v1)

Append-only audit trail of every inbound webhook (payment callbacks, ISR triggers, engine events).

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string | PK | |
| `source` | varchar(32) | NOT NULL, indexed | `cmi` · `stripe` · `woo` · `vendure` |
| `event_type` | varchar(64) | NOT NULL | Source-specific event identifier |
| `external_ref` | varchar(128) | nullable, indexed | Provider transaction id / order id |
| `signature_status` | varchar(16) | NOT NULL | `valid` · `invalid` · `missing` |
| `payload` | jsonb / longtext | NOT NULL | Full raw payload (PII redacted before storage where applicable) |
| `response_status` | int | NOT NULL | HTTP code we returned |
| `response_body_snippet` | varchar(512) | nullable | First 512 bytes of our response |
| `received_at` | timestamp | NOT NULL, indexed | |

**Indexes:**
- Index on (`source`, `received_at`)
- Index on (`external_ref`)
- Partition or rotate by month after volume justifies it (post v1).

**Retention:** 12 months, then archive to cold storage or delete (per `06-privacy-compliance.md`).

---

### `ecom_branch` (owned by multi-branch addon, **v1.1**)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string | PK | e.g., `agadir` |
| `name` | varchar(128) | NOT NULL | Display name |
| `address_json` | jsonb / longtext | NOT NULL | Country, city, postal code, street |
| `contact_email` | varchar(255) | nullable | Branch operations contact |
| `is_default` | boolean | NOT NULL, default false | Exactly one row per deployment must be true |
| `enabled` | boolean | NOT NULL, default true | |

**Constraints:**
- Exactly one row with `is_default = true` (enforced via partial unique index in PG; trigger in MySQL).

---

### `ecom_branch_postal_mapping` (owned by multi-branch addon, **v1.1**)

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | string | PK | |
| `branch_id` | string | NOT NULL, FK → `ecom_branch.id`, ON DELETE CASCADE | |
| `country` | varchar(2) | NOT NULL | ISO-3166 alpha-2 |
| `postal_prefix` | varchar(16) | NOT NULL | First N characters of postal code |
| `priority` | int | NOT NULL, default 0 | Higher wins on tie |

**Indexes:**
- Index on (`country`, `postal_prefix`)
- UNIQUE (`branch_id`, `country`, `postal_prefix`)

**Resolution algorithm (referenced in v1.1):**
For an incoming order address with country `C` and postal `P`:
1. Find rows where `country = C` AND `postal_prefix` is a prefix of `P`.
2. Order by `length(postal_prefix) DESC, priority DESC`.
3. Pick the first match; if none, fall back to the `is_default = true` branch.

---

## 3. Migrations

| Addon | Engine | Migration tool | Location |
|---|---|---|---|
| i18n | WC | `dbDelta()` in WP plugin activation | `plugins/wp-epioso-i18n/migrations/` |
| i18n | Vendure | TypeORM migrations in Vendure plugin | `plugins/vendure-epioso-i18n/src/migrations/` |
| multi-payment | WC | `dbDelta()` in WP plugin | `plugins/wp-epioso-multi-payment/migrations/` |
| multi-payment | Vendure | TypeORM migrations | `plugins/vendure-epioso-multi-payment/src/migrations/` |
| multi-branch (v1.1) | WC | `dbDelta()` | `plugins/wp-epioso-multi-branch/migrations/` |
| multi-branch (v1.1) | Vendure | TypeORM | `plugins/vendure-epioso-multi-branch/src/migrations/` |

All migrations are forward-only and idempotent. Each migration script must be safe to re-run.

---

## 4. Storage choices recap

| Engine | RDBMS | Why |
|---|---|---|
| WC engine | MySQL 8 (Hostinger default) | Bundled with WP; no choice realistically |
| Vendure engine | PostgreSQL 16 | Vendure's primary supported DB; better for relational commerce data; jsonb support |

No NoSQL store in v1. Redis is used by Vendure for queues, not by Ecom OS addons directly.

---

## 5. Data ownership matrix

| Data | Created by | Modified by | Read by |
|---|---|---|---|
| Customer | Engine (on register) | Engine + storefront via engine API | Storefront |
| Product | Engine (admin) | Engine (admin) | Storefront, addons (i18n overlays) |
| Order | Storefront → engine | Engine + webhook handlers | Storefront, merchant admin |
| Translation strings | Addon (seed) | Merchant (admin UI) | Storefront (i18n addon) |
| Payment config | EPIOSO engineer (env + setup script) | EPIOSO engineer | Multi-payment addon |
| Webhook log | Addons (on receipt) | — (append-only) | EPIOSO engineer (debugging) |
| Branch + postal mapping (v1.1) | Merchant (admin UI) | Merchant | Multi-branch addon (order assignment) |

---

## 6. What is explicitly NOT stored

- **No user passwords in Ecom OS tables** — auth is delegated to the engine (ADR-006).
- **No raw payment card data** — never touches our servers; CMI hosted page + Stripe Elements/Intents only.
- **No analytics events** in v1 — out of scope; deferred to optional addon.
- **No session data** in v1 — engine session cookies only.
