# ADR-008: Co-hosting Next.js storefront with WordPress on shared hosting

**Status:** Accepted
**Date:** 2026-06-24

---

## Context

EPIOSO's WooCommerce engine clients are typically on Hostinger shared hosting, where WordPress already lives. The question is whether the Next.js storefront can be co-hosted on the **same Hostinger account** — avoiding a second bill and a separate deployment target per client.

Two sub-cases exist depending on the client's Hostinger plan:

- **Hostinger Business+ (Node.js slot available):** hPanel exposes a Node.js app manager; a persistent Node process (PM2) can run alongside the Apache/PHP stack.
- **PHP-only shared hosting:** No persistent Node process is possible. Only static files and PHP are served.

## Decision

Support **two deployment modes** per client, selectable via a single env var (`ECOM_DEPLOY_MODE`):

---

### Mode A — Node.js on Hostinger (default, Hostinger Business+)

- WordPress + WooCommerce at `cms.yourdomain.com` (Apache + PHP)
- Next.js storefront at `yourdomain.com` as a Node.js app managed by PM2 via Hostinger's Node.js manager
- Full Next.js features preserved: SSR, Server Actions, ISR (`revalidatePath` + WC webhook within 60 s per FR-024), API routes, security middleware
- Deploy via `scripts/deploy-hostinger.ts`: SSH → rsync → `pm2 reload ecom-os --update-env`

### Mode B — Static Export (PHP-only / any CDN-capable host)

- `output: 'export'` in `next.config.ts` when `ECOM_DEPLOY_MODE=static`
- All product, category, and PDP pages pre-rendered at build time via `generateStaticParams()`
- `out/` folder rsynced to `public_html/` (root domain) or to a subdomain folder
- `.htaccess` added for SPA-style fallback routing
- Cart: unchanged — Zustand + localStorage (client-side)
- Checkout: Server Action removed; replaced with a direct client-side `fetch` POST to WC REST API
- Image optimization: disabled (`images.unoptimized: true`); optionally delegate to Cloudflare Proxy (free plan) for optimisation without a Node process
- Product update flow: WC webhook → GitHub Actions `pnpm build` → `rsync out/` → ~5 min publish lag (acceptable for SMB update cadence)

---

## Domain routing strategy (both modes)

```
yourdomain.com         → Next.js storefront (Mode A: Node/PM2 | Mode B: static files)
cms.yourdomain.com     → WordPress admin · WPGraphQL · WC REST API
```

Single Hostinger cPanel account. Both subdomains point to the same server. Client pays one hosting bill.

## `next.config.ts` gate (no forking, one env var)

```ts
const isStatic = process.env.ECOM_DEPLOY_MODE === 'static';

const config: NextConfig = {
  output: isStatic ? 'export' : undefined,
  images: { unoptimized: isStatic },
};
```

## CORS requirement (Mode B only)

In Mode B, the browser makes WC REST calls from `yourdomain.com` to `cms.yourdomain.com` — a cross-origin request. Add to WordPress (via a micro-plugin or `functions.php`):

```php
add_action('init', function () {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = getenv('STOREFRONT_URL') ?: 'https://yourdomain.com';
    if ($origin === $allowed) {
        header("Access-Control-Allow-Origin: $allowed");
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Authorization, Content-Type');
    }
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        status_header(204);
        exit;
    }
});
```

`STOREFRONT_URL` is set in WordPress's `.env` or `wp-config.php`. Document in deploy runbook.

## Rationale

- Clients already on Hostinger do not need a second host — the storefront lives on the same cPanel account.
- Static export is a proven headless WooCommerce pattern (used by many agencies on JAMstack). It is not a workaround; it is a first-class deployment target.
- SMB product catalogs are write-rarely, read-often. A ~5 min CI rebuild cycle covers ≥ 95 % of update patterns.
- Mode A is the preferred default because it preserves ISR (FR-024: 60 s live update), Server Actions (secure server-side checkout), and all security middleware. Mode B is the fallback for PHP-only plans.
- One env var (`ECOM_DEPLOY_MODE`) selects the mode. No code fork. The same storefront codebase builds in both modes.

## Alternatives considered

- **Vercel for Next.js + Hostinger for WordPress.** Rejected (see ADR-005): unpredictable cost at scale, serverless cold starts hurt LCP, clients prefer one vendor.
- **Static export always.** Rejected: loses ISR, Server Actions, and security middleware — acceptable only for the lowest-tier clients; Mode B is the explicit fallback, not the default.
- **iFrame embed.** Rejected: broken SEO, poor DX, accessibility nightmare.
- **Cloudflare Pages + D1 + Workers.** Tempting but immature for transactional e-commerce at v1; reconsider in 12 months.

## Consequences

- `next.config.ts` **must** gate `output` and `images.unoptimized` on `ECOM_DEPLOY_MODE`.
- The Checkout page **must** support both modes: Server Action (Mode A) and a client-side `fetch` to WC REST (Mode B), selected at runtime via `ECOM_DEPLOY_MODE`.
- `scripts/deploy-hostinger.ts` **must** handle both modes: `pm2 reload` for Mode A; `rsync out/` + `.htaccess` for Mode B.
- `create-ecom-os` CLI **must** prompt for deploy mode and write `ECOM_DEPLOY_MODE=` to the generated `.env.local`.
- Deploy runbook **must** include a CORS setup step for Mode B.
- ISR revalidation webhook (§10) applies only to Mode A. Mode B uses a CI rebuild webhook (WC product.updated → GitHub Actions) instead.
- WPGraphQL reads (ADR-001) work unchanged in both modes — static pages call them at build time; Mode A pages also call at request time via ISR.
