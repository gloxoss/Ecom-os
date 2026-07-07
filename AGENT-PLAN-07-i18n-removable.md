# AGENT-PLAN-07 — Make i18n a True Toggle Addon

> **Scope:** 4 files changed, ~50 lines total. No route restructuring.
> **Goal:** `ADDONS=multi-payment` (no i18n) → single-locale, no locale prefix in URLs, no broken imports.
> **Constraint:** Do NOT restructure `app/[locale]/`. Do NOT touch payment code. Do NOT add new dependencies.

---

## Why This Is Needed

`proxy.ts` and `i18n/request.ts` both hard-import from `@ecom-os/addons-i18n` directly.
When `ADDONS=` does not include `i18n`, those imports still run — the addon is permanently active regardless of the env var. Three specific violations:

1. `proxy.ts:4` — `import { routing } from '@ecom-os/addons-i18n/src/routing'`
2. `proxy.ts:30,38` — locale strip regex `/fr|ar/` hardcoded (breaks if locales change)
3. `i18n/request.ts:2–12` — imports all three locale JSONs + references addon routing directly

The `[locale]/` route structure is fine as-is. When next-intl is configured with a single locale + `localePrefix: 'never'`, URLs look like `/products/slug` — the locale param is invisible. That's the "disabled" state for v1.

---

## Architecture Insight

`addons-i18n` is a pnpm workspace package — it is **always installed**. You cannot conditionally un-install it. "Removable" means:

- **Disabled:** `ADDONS=multi-payment` → single locale (from `DEFAULT_LOCALE` env), no URL prefix, proxy is a passthrough on locale routing, only default locale messages load.
- **Enabled:** `ADDONS=i18n,multi-payment` → multi-locale (en/fr/ar), as-needed prefix, full translation support.

The storefront routing layer (`proxy.ts`, `i18n/request.ts`) must read from an **indirection file in the storefront** (`src/i18n/routing.ts`) — not directly from the addon. The indirection file decides which config to use based on `ADDONS`.

---

## What Already Exists — DO NOT REDO

```
packages/addons-i18n/src/routing.ts       ← don't touch
packages/addons-i18n/src/config.ts        ← don't touch
packages/addons-i18n/locales/*.json       ← don't touch
apps/storefront/src/app/[locale]/         ← don't restructure
apps/storefront/next.config.ts            ← withNextIntl stays, no change needed
apps/storefront/src/i18n/request.ts       ← MODIFY (Task 2)
apps/storefront/src/proxy.ts              ← MODIFY (Task 3)
docs/addon-authoring.md                   ← EXTEND (Task 4)
```

---

## Tasks

### Task 1 — Create `apps/storefront/src/i18n/routing.ts` (NEW FILE)

This is the indirection layer. `proxy.ts` and `request.ts` import from HERE, not from the addon.

```typescript
// apps/storefront/src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

const I18N_ENABLED = (process.env.ADDONS ?? '')
  .split(',')
  .map(s => s.trim())
  .includes('i18n');

const DEFAULT_LOCALE = process.env.DEFAULT_LOCALE ?? 'en';

// ponytail: require() used intentionally — module-level conditional ESM import
// is not possible without top-level await. addons-i18n is always installed
// (workspace dep), so this never fails; it's a build-time routing switch.
export const routing = I18N_ENABLED
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? (require('@ecom-os/addons-i18n/src/routing') as { routing: ReturnType<typeof defineRouting> }).routing
  : defineRouting({
      locales: [DEFAULT_LOCALE] as [string],
      defaultLocale: DEFAULT_LOCALE,
      localePrefix: 'never', // no /en/ prefix — URLs look single-language
    });

export const i18nEnabled = I18N_ENABLED;
```

**Acceptance:** 
- `ADDONS=multi-payment` → `routing.locales` is `['en']` (or whatever `DEFAULT_LOCALE` is), `routing.localePrefix` is `'never'`
- `ADDONS=i18n,multi-payment` → `routing.locales` is `['en', 'fr', 'ar']`, `routing.localePrefix` is `'as-needed'`

---

### Task 2 — Update `apps/storefront/src/i18n/request.ts`

Replace direct addon imports with the indirection layer. Load only the default locale's messages when i18n is disabled.

**Replace the entire file:**

```typescript
// apps/storefront/src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing, i18nEnabled } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  // When disabled: always load default locale only — no dynamic locale switching
  const messageLocale = i18nEnabled ? locale : routing.defaultLocale;
  const messages = (
    await import(`@ecom-os/addons-i18n/locales/${messageLocale}.json`)
  ).default;

  return { locale, messages };
});
```

**Why dynamic import works here:** `getRequestConfig` runs server-side at request time (not at module evaluation), so async import is fine. Next.js bundles the locale JSON files via the glob pattern.

**Acceptance:**
- `ADDONS=multi-payment` → always loads `en.json` (or `DEFAULT_LOCALE.json`), locale is always the default
- `ADDONS=i18n` → loads the correct locale JSON per request

---

### Task 3 — Update `apps/storefront/src/proxy.ts`

Two changes:
1. Import `routing` from `@/i18n/routing` instead of the addon directly
2. Replace hardcoded `/fr|ar/` regex with dynamic locale list from routing config

**Replace the file:**

```typescript
// apps/storefront/src/proxy.ts
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const AUTH_COOKIE = 'ecom_auth';
const PUBLIC_ACCOUNT_PATHS = ['/account/login', '/account/register'];

const intlMiddleware = createMiddleware(routing);

// Build locale-strip regex dynamically from active routing config
// When i18n disabled: routing.locales = [defaultLocale], prefix = 'never' → regex never matches
const nonDefaultLocales = (routing.locales as string[]).filter(
  l => l !== routing.defaultLocale
);
const LOCALE_PREFIX_RE = nonDefaultLocales.length > 0
  ? new RegExp(`^/(${nonDefaultLocales.join('|')})(?=/|$)`)
  : /(?!)/; // never matches

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https://*; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com https://js.stripe.com; frame-src https://js.stripe.com;"
  );
  return response;
}

export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  const pathnameWithoutLocale = pathname.replace(LOCALE_PREFIX_RE, '') || '/';

  const isProtectedAccount = pathnameWithoutLocale.startsWith('/account') &&
    !PUBLIC_ACCOUNT_PATHS.some(p => pathnameWithoutLocale.startsWith(p));

  if (isProtectedAccount && !token) {
    const loginUrl = request.nextUrl.clone();
    const localePrefix = LOCALE_PREFIX_RE.exec(pathname)?.[0] ?? '';
    loginUrl.pathname = `${localePrefix}/account/login`;
    loginUrl.searchParams.set('from', pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.headers.set('x-request-id', requestId);
    return addSecurityHeaders(redirectResponse);
  }

  const intlResponse = intlMiddleware(request);
  intlResponse.headers.set('x-request-id', requestId);
  return addSecurityHeaders(intlResponse);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|.*\\..*).*)'],
};
```

**Key change:** `LOCALE_PREFIX_RE` is built from `routing.locales` at startup. No hardcoded `fr|ar`. When i18n is disabled and `routing.locales = ['en']`, `nonDefaultLocales = []`, regex = `/(?!)/` = never matches → auth check always reads the full pathname directly.

**Acceptance:**
- `ADDONS=i18n` + visit `/fr/catalog` → locale strip correctly finds `/fr`, auth check passes
- `ADDONS=multi-payment` + visit `/catalog` → regex doesn't match, pathname used as-is

---

### Task 4 — Update `docs/addon-authoring.md`

Append a "Deep Addons" section explaining the distinction. Do not rewrite existing content.

Append:

```markdown
## Deep Addons vs Shallow Addons

Addons fall into two categories:

### Shallow addons (hot-toggle)
Registered and unregistered entirely at runtime via `register(ctx)` / `disable()`. Examples: `addons-multi-payment`. Toggling `PAYMENT_PROVIDERS` or `ADDONS` requires only a process restart (no redeploy, no rebuild).

### Deep addons (redeploy required)
Addons that integrate at the routing or build level. They cannot be hot-removed because Next.js bakes routing and config at build time. Examples: `addons-i18n`.

**`addons-i18n` is a deep addon.** It is always installed as a workspace dependency. "Disabling" it means running in single-locale mode:

```env
ADDONS=multi-payment          # no i18n
DEFAULT_LOCALE=en
```

This produces:
- `routing.localePrefix = 'never'` → URLs look like `/products/slug` (no `/en/` prefix)
- Only `en.json` messages are loaded
- `[locale]` route param is always `'en'` — invisible to the user

What you do NOT get by "disabling":
- Removal of the next-intl package from the bundle
- Removal of the `[locale]/` route structure

To fully remove i18n (save ~30KB bundle): use a separate storefront template without `[locale]/`. This is a Sprint D concern, not v1.
```

---

### Task 5 — Update `.env.example`

Ensure these two variables are documented with clear comments about the toggle behavior:

```bash
# === i18n ===
# Set ADDONS to exclude 'i18n' for single-language deployments.
# Set LOCALES=en DEFAULT_LOCALE=en for single-locale mode (no URL prefix).
DEFAULT_LOCALE=en
LOCALES=en,fr,ar                # only read by addons-i18n when ADDONS includes i18n
ADDONS=i18n,multi-payment       # remove 'i18n' → single-locale mode, no URL prefix
```

---

## Pre-Completion Checklist

Run these before reporting done:

**Mode 1 — i18n disabled:**
```bash
ADDONS=multi-payment DEFAULT_LOCALE=en pnpm --filter storefront dev
```
- [ ] Visit `http://localhost:3000/` → renders home page (no locale prefix)
- [ ] Visit `http://localhost:3000/catalog` → renders catalog (no `/en/` prefix)
- [ ] Visit `http://localhost:3000/account` (unauthenticated) → redirects to `/account/login`
- [ ] Visit `http://localhost:3000/fr/catalog` → 404 (locale routing not active)
- [ ] `pnpm --filter storefront build` succeeds with `ADDONS=multi-payment`

**Mode 2 — i18n enabled:**
```bash
ADDONS=i18n,multi-payment DEFAULT_LOCALE=en LOCALES=en,fr,ar pnpm --filter storefront dev
```
- [ ] Visit `http://localhost:3000/` → renders in English (no prefix, default)
- [ ] Visit `http://localhost:3000/fr/catalog` → renders in French
- [ ] Visit `http://localhost:3000/ar/catalog` → renders in Arabic with `dir="rtl"`
- [ ] Click locale switcher → switches locale in URL
- [ ] Visit `http://localhost:3000/fr/account` (unauthenticated) → redirects to `/fr/account/login`
- [ ] `pnpm --filter storefront build` succeeds with `ADDONS=i18n,multi-payment`

**Type check:**
```bash
pnpm --filter storefront exec tsc --noEmit
```
- [ ] No TypeScript errors

---

## Session Report Template

```
## AGENT-PLAN-07 Session Report
**Status:** COMPLETE / PARTIAL

### Files Changed
- [ ] apps/storefront/src/i18n/routing.ts (CREATED)
- [ ] apps/storefront/src/i18n/request.ts (MODIFIED)
- [ ] apps/storefront/src/proxy.ts (MODIFIED)
- [ ] docs/addon-authoring.md (EXTENDED)
- [ ] .env.example (UPDATED)

### Checklist Results
**i18n disabled mode:**
- / → [pass/fail]
- /catalog → [pass/fail]
- /account redirect → [pass/fail]
- /fr/catalog → [404 as expected / fail]
- build → [pass/fail]

**i18n enabled mode:**
- / → [pass/fail]
- /fr/catalog → [pass/fail]
- /ar/catalog + dir=rtl → [pass/fail]
- locale switcher → [pass/fail]
- /fr/account redirect → [pass/fail]
- build → [pass/fail]

**tsc --noEmit:** [pass/fail]

### Issues Encountered
[any deviations from the plan]
```

---

## Notes for the Agent

1. **Do NOT restructure `app/[locale]/`** — the folder stays. The locale param just always receives the default locale value when i18n is disabled.
2. **`require()` in `routing.ts` is intentional** — document with the ponytail comment. TypeScript will warn; suppress with `// eslint-disable-next-line @typescript-eslint/no-require-imports`.
3. **The `next.config.ts` does NOT change** — `withNextIntl` works with single-locale configs. No conditional wrapping needed.
4. **Do not add `next-intl` or any other package** — it's already a dep of `addons-i18n` which is transpiled by Next.js via `transpilePackages`.
5. **The dynamic import in `request.ts`** (`import('@ecom-os/addons-i18n/locales/${messageLocale}.json')`) — Next.js bundler sees the static prefix and bundles all JSON files in that directory automatically. This is standard next-intl usage.
6. **Test the disabled mode first** — it's the simpler case and will catch import errors immediately.
