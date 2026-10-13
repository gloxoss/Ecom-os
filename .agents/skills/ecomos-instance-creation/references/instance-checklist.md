# Instance checklist (commands)

## Shell on this machine

The `pnpm` on PATH may be a broken shim. Use corepack from the working Codex runtime:

```
COREPACK_ENABLE_NETWORK=0
PATH="C:/Users/OMEN/AppData/Local/OpenAI/Codex/runtimes/cua_node/cfb32733c877621e/bin:$PATH"
corepack pnpm install --offline --frozen-lockfile
```

Or call `node_modules/.bin/vitest`, `tsc`, `eslint` directly. Re-check the runtime folder name if it fails; it changes when the Codex app updates.

## Secrets (fresh per instance)

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"   # ECOM_OS_ENCRYPTION_KEY (43 chars + '=')
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"      # REVALIDATE_SECRET, SESSION_COOKIE_SECRET, ORDER_ACCESS_SECRET
```

Minimum `.env.local` keys: `ECOM_CLIENT_PROFILE`, `THEME_NAME`, `ADDONS` (for example `quotes`), `ECOM_ENGINE=woocommerce`, `WC_REST_URL`, `WC_GRAPHQL_URL`, `WC_REST_KEY`, `WC_REST_SECRET`, the three secrets above, and for RFQ `ECOM_RFQ_WP_URL`, `ECOM_RFQ_WP_USER`, `ECOM_RFQ_WP_APP_PASSWORD`.

## WP-CLI against a Local site

Local's MySQL port changes on every start and `wp` needs Local's generated `php.ini`. Read the port from the site's `conf/mysql/my.cnf` under `AppData/Roaming/Local/run/<id>/`, run PHP with `PHPRC=<run>/conf/php -d mysqli.default_port=<port>`, and pass `--host=127.0.0.1 --port=<port>` to `wp db export`.

## Connector role (read-only REST key)

Create a role with `read` and `manage_woocommerce`, then add the four read capabilities the storefront needs, or REST calls for orders, products, brands and coupons return 403:

```
wp role create ecomos_connector "EcomOS Connector"
wp cap add ecomos_connector read manage_woocommerce read_private_shop_orders read_private_products read_private_shop_coupons manage_product_terms
```

Use two users with this role (catalog reader with a `read` REST key, RFQ bridge with an application password). Confirm reads return 200 and writes (`POST /orders`, `PUT /settings/...`) return 401. Never use an administrator login in the storefront.

## Playwright and certificates (found by agent-1)

- Playwright 1.64.0 wants browser build 1248 but the local cache may only hold 1243. Point Chromium at an installed browser with an explicit `executablePath` (the live specs read `ECOM_CHROME_PATH`, default system Chrome) or run `playwright install chromium`.
- A storefront build or run only reaches a Local site over HTTPS when `NODE_EXTRA_CA_CERTS` points at that site's certificate under `AppData/Roaming/Local/run/router/nginx/certs/<site>.crt`, set before Node starts.

## Application passwords

`WP_Application_Passwords::create_new_application_password()` returns `[plain_password, item]`. Use index 0. Saving the item (index 1) stores a useless value and the storefront then fails with `INCORRECT_PASSWORD`. Write the secret straight into `.env.local`; never print it.

## Fixtures (local test sites only)

`wp eval-file scripts/seed-instance-fixtures.php` seeds synthetic products and a Morocco delivery zone; `... remove` deletes them. Remove them before real content.

## Verify

```
node node_modules/tsx/dist/cli.mjs scripts/check-engine-imports.ts   # guard
cd apps/storefront && node_modules/.bin/eslint . && node_modules/.bin/tsc --noEmit
node_modules/.bin/vitest run
```

Live specs (from `apps/storefront`, site running):

```
ECOM_LIVE_MUTATIONS=1 ECOM_STAGING_URL=https://<id>-store.local \
NODE_EXTRA_CA_CERTS=<Local router certs>/<id>-store.local.crt \
node --env-file=.env.local ../../node_modules/@playwright/test/cli.js test e2e/sprint-b-commerce.spec.ts
```

Set `NODE_EXTRA_CA_CERTS` before Node starts. Specs create real staging orders: run them only against the instance's own staging site.

## Isolation proof (record the result)

Different database name and port, different REST key pair, different secrets, and no product or order IDs shared with the starter site. Record PASS, FAIL, BLOCKED or NOT RUN with the commands used.
