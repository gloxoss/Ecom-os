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
