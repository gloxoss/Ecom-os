# AGENT-PLAN-06 — Section 10: Security Hardening · CI · Deploy · Docs
> **Read this document fully before touching any code.**
> Run AFTER Plans 03, 04, and 05 complete — this plan consolidates middleware.ts from all three.

---

## Skills Active
- `api-security-best-practices` — SR-* checklist enforcement
- `insecure-defaults` — catch common Next.js/Node pitfalls
- `stride-analysis-patterns` — STRIDE per component
- `threat-modeling-expert` — verify mitigations land
- `devops-cicd` — GitHub Actions workflow
- `webapp-testing` — Vitest + Playwright config
- `documentation-templates` — docs/ structure
- `/ponytail` — minimum code, no speculative abstractions
- `/karpathy-guidelines` — correctness over cleverness, test what matters
- `/nonstop` — ship all tasks before reporting done

---

## What Already Exists — DO NOT REDO

- `packages/ecom-engine/` ✅
- `packages/engine-woocommerce/` ✅
- `apps/storefront/src/lib/engine.ts` ✅
- `apps/storefront/src/lib/rate-limit.ts` — created by Plan 05 (check before recreating)
- `apps/storefront/src/lib/logger.ts` — stub created by Plan 03 (check, then extend)
- `apps/storefront/src/middleware.ts` — updated by Plan 03 with next-intl + auth guard + Plan 05 rate limits
- `packages/addons-i18n/` ✅ (Plan 03)
- `packages/addons-multi-payment/` ✅ (Plan 04)
- `.env.example` — partially populated by Plans 03/04/05

---

## Architecture Laws — Non-Negotiable

1. Security headers go in middleware.ts (not `next.config.ts` headers array — middleware lets you set per-request nonces if needed later).
2. Logger MUST redact PII fields before any log statement reaches stdout. No exceptions.
3. AES-256-GCM key read from `ECOM_OS_ENCRYPTION_KEY` env only. Never hardcoded, never committed.
4. CI must block merge on: lint failure, type error, test failure, Gitleaks match, Trivy critical CVE, engine-import violation, test coverage < 70%.
5. Deploy script must be atomic with rollback: copy → install → migrate → health check → swap symlink → restart PM2. If health check fails, re-swap to previous release.
6. Middleware.ts is the single place where all three cross-cutting concerns live: i18n routing (Plan 03) + auth guard (existing) + security headers (this plan). Merge — don't duplicate.

---

## Codebase Context

### Key files to READ before coding

```
apps/storefront/src/middleware.ts          — Plan 03 result; add headers here
apps/storefront/src/lib/logger.ts          — Plan 03 stub; extend here
apps/storefront/src/lib/rate-limit.ts      — Plan 05 result; reuse in middleware
apps/storefront/next.config.ts             — may have poweredByHeader: false already
.env.example                               — Plans 03/04/05 results; add missing vars
```

### Key env vars for this plan

```
ECOM_OS_ENCRYPTION_KEY   # 32+ byte random, AES-256-GCM key (base64)
REVALIDATE_SECRET        # 32+ byte random
SESSION_COOKIE_SECRET    # 32+ byte random (future: HMAC cookie signing)
LOG_LEVEL                # debug | info | warn | error (default: info)
```

---

## Tasks

### Task 1 — Security Headers in middleware.ts

**What:** Merge security response headers into the existing middleware.ts (which already has next-intl routing + auth guard from Plans 03/05).

**SR-HEAD-001 headers to add:**

```
Strict-Transport-Security: max-age=15552000; includeSubDomains
Content-Security-Policy: default-src 'self'; img-src 'self' data: https://*; script-src 'self' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.stripe.com https://js.stripe.com; frame-src https://js.stripe.com;
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

**Implementation:**

```typescript
// In middleware.ts, after next-intl and auth logic, before return:
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
```

Call `addSecurityHeaders(response)` on EVERY response returned from middleware (i18n response, auth redirect, pass-through NextResponse.next()).

**Also in `next.config.ts`:**
```typescript
poweredByHeader: false,  // removes X-Powered-By: Next.js
```

**Acceptance:** `curl -I http://localhost:3000` returns all 6 headers. Test asserts this (Task 10).

---

### Task 2 — Production Logger (extend Plan 03 stub)

**What:** Upgrade the minimal `apps/storefront/src/lib/logger.ts` stub into a PII-redacting structured JSON logger (SR-LOG-001, SR-LOG-002).

**Rules:**
- Output: JSON to stdout in production, human-readable in dev (`NODE_ENV !== 'production'`).
- Fields: `timestamp`, `level`, `requestId`, `event`, `details`.
- PII redaction: before stringifying `details`, recursively replace values of keys matching: `email`, `phone`, `address`, `card*`, `*token*`, `*secret*`, `*password*`, `authorization`.
- `requestId`: caller passes it in (middleware generates `crypto.randomUUID()` per request, passes via request header `x-request-id`).
- Log levels: `debug | info | warn | error`. Controlled by `LOG_LEVEL` env (default: `info`).
- **No `console.log`** anywhere else in the codebase.

**File:** `apps/storefront/src/lib/logger.ts` (overwrite stub)

```typescript
const REDACT_KEYS = /^(email|phone|address|authorization|.*token.*|.*secret.*|.*password.*|card.*)$/i;
const LOG_LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LOG_LEVEL_RANK[(process.env.LOG_LEVEL ?? 'info') as keyof typeof LOG_LEVEL_RANK] ?? 1;

function redact(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      REDACT_KEYS.test(k) ? '[REDACTED]' : redact(v),
    ])
  );
}

function emit(level: 'debug' | 'info' | 'warn' | 'error', event: string, details?: unknown, requestId?: string) {
  if (LOG_LEVEL_RANK[level] < MIN_LEVEL) return;
  const entry = { timestamp: new Date().toISOString(), level, requestId, event, details: redact(details) };
  if (process.env.NODE_ENV !== 'production') {
    console[level](`[${level.toUpperCase()}] ${event}`, details);
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

export const logger = {
  debug: (event: string, details?: unknown, requestId?: string) => emit('debug', event, details, requestId),
  info:  (event: string, details?: unknown, requestId?: string) => emit('info',  event, details, requestId),
  warn:  (event: string, details?: unknown, requestId?: string) => emit('warn',  event, details, requestId),
  error: (event: string, details?: unknown, requestId?: string) => emit('error', event, details, requestId),
};
```

**Also:** add `x-request-id` header injection to `middleware.ts`:
```typescript
// At the top of middleware function, generate a requestId:
const requestId = crypto.randomUUID();
// On the final response:
response.headers.set('x-request-id', requestId);
```

**Acceptance:** Unit test in Task 10 — logger redacts PII, doesn't log below LOG_LEVEL, outputs JSON in prod mode.

---

### Task 3 — AES-256-GCM Encryption Helper (SR-CRYPT-002)

**What:** A `src/lib/crypto.ts` helper for encrypting payment gateway config at rest.

**File:** `apps/storefront/src/lib/crypto.ts`

```typescript
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'crypto';

const KEY = Buffer.from(process.env.ECOM_OS_ENCRYPTION_KEY ?? '', 'base64');

if (KEY.length !== 32) {
  throw new Error('ECOM_OS_ENCRYPTION_KEY must be a base64-encoded 32-byte key');
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // format: iv(12) + tag(16) + ciphertext — all base64
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final('utf8');
}

export function timingSafeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
```

**Note:** `timingSafeEquals` is already used in Plan 04's CMI handler. If Plan 04 implemented it inline, import from here instead.

**Acceptance:** Unit test: encrypt → decrypt round-trips; tampered ciphertext throws on decrypt (Task 10).

---

### Task 4 — `/api/revalidate` Route Handler (SR-RATE-003)

**What:** ISR revalidation endpoint gated by `REVALIDATE_SECRET`. Rate-limited 60/min per secret (SR-RATE-003).

**File:** `apps/storefront/src/app/api/revalidate/route.ts`

```typescript
import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { timingSafeEquals } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret') ?? '';

  if (!timingSafeEquals(secret, process.env.REVALIDATE_SECRET ?? '')) {
    logger.warn('revalidate_rejected', { reason: 'invalid_secret' });
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // ponytail: rate limit keyed on secret, not IP — prevents secret enumeration
  const { ok, retryAfter } = checkRateLimit(`revalidate:${secret}`, 60, 60_000);
  if (!ok) {
    return NextResponse.json({ error: 'rate_limited' }, {
      status: 429,
      headers: { 'Retry-After': String(retryAfter) },
    });
  }

  const tag = req.nextUrl.searchParams.get('tag') ?? 'wc-products';
  revalidateTag(tag);
  logger.info('revalidate_triggered', { tag });
  return NextResponse.json({ revalidated: true, tag });
}
```

**Acceptance:** Integration test: valid secret revalidates; wrong secret returns 401; 61st request in 60s returns 429 with Retry-After (Task 10).

---

### Task 5 — Vitest Root Config + Playwright Config

**What:** If Plans 03/04/05 didn't create these, create them now.

**Check first:** `ls vitest.config.ts playwright.config.ts` at root.

**`vitest.config.ts`** (root):
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/*/vitest.config.ts',
      'apps/storefront/vitest.config.ts',
    ],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 70, functions: 70, branches: 70 },
      include: [
        'packages/ecom-engine/src/**',
        'packages/engine-woocommerce/src/**',
        'packages/addons-i18n/src/**',
        'packages/addons-multi-payment/src/**',
      ],
    },
  },
});
```

**`playwright.config.ts`** (root):
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './apps/storefront/e2e',
  webServer: {
    command: 'pnpm --filter storefront dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  use: { baseURL: 'http://localhost:3000' },
});
```

**Add to root `package.json` scripts** (if not present):
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"e2e": "playwright test"
```

---

### Task 6 — GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm

      - run: pnpm install --frozen-lockfile

      # Engine-import guard: UI files must NOT import engine adapters directly
      - name: engine-import guard
        run: |
          if grep -rn "engine-woocommerce\|engine-vendure" apps/storefront/src/features apps/storefront/src/components apps/storefront/src/app --include="*.ts" --include="*.tsx" | grep -v "lib/engine.ts"; then
            echo "VIOLATION: Engine adapter imported outside lib/engine.ts"
            exit 1
          fi

      - run: pnpm -r lint
      - run: pnpm -r typecheck
      - run: pnpm test:coverage

      # Secret scanning
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Dependency vulnerability scan
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          scan-ref: .
          severity: CRITICAL
          exit-code: 1

      - run: pnpm --filter storefront build
        env:
          ECOM_ENGINE: fake
          ECOM_OS_ENCRYPTION_KEY: ${{ secrets.ECOM_OS_ENCRYPTION_KEY_TEST }}
          REVALIDATE_SECRET: test-revalidate-secret-32byteslong!
          SESSION_COOKIE_SECRET: test-session-secret-32byteslong!!
          DEFAULT_LOCALE: en
          LOCALES: en,fr,ar
          ADDONS: ""
```

**Secrets to add to GitHub repo:** `ECOM_OS_ENCRYPTION_KEY_TEST` — a base64-encoded 32-byte key for CI builds.

---

### Task 7 — Hostinger Deploy Script

**File:** `scripts/deploy-hostinger.ts`

Atomic deploy: upload → install → health check → swap → restart. Rollback on failure.

```typescript
#!/usr/bin/env tsx
/**
 * Usage: tsx scripts/deploy-hostinger.ts --host <host> --user <user> --app <app-name>
 * Reads SSH_KEY_PATH from env or ~/.ssh/id_rsa
 * Remote layout: ~/apps/<app-name>/releases/<timestamp>/   (current -> symlink)
 */
import { execSync } from 'child_process';
import path from 'path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce<string[][]>((pairs, arg, i, arr) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), arr[i + 1]]);
    return pairs;
  }, [])
);

const { host, user, app } = args as Record<string, string>;
if (!host || !user || !app) {
  console.error('Usage: deploy-hostinger.ts --host <host> --user <user> --app <app-name>');
  process.exit(1);
}

const SSH_KEY = process.env.SSH_KEY_PATH ?? `${process.env.HOME}/.ssh/id_rsa`;
const ssh = (cmd: string) => execSync(`ssh -i ${SSH_KEY} ${user}@${host} "${cmd}"`, { stdio: 'inherit' });
const remote = (p: string) => `/home/${user}/apps/${app}/${p}`;
const timestamp = Date.now();
const release = remote(`releases/${timestamp}`);
const current = remote('current');

try {
  console.log(`[deploy] uploading to ${release}`);
  execSync(
    `rsync -az --delete -e "ssh -i ${SSH_KEY}" \
      --exclude=node_modules --exclude=.git --exclude=.env \
      ./ ${user}@${host}:${release}`,
    { stdio: 'inherit' }
  );

  ssh(`cd ${release} && pnpm install --frozen-lockfile --prod`);
  ssh(`cd ${release} && ECOM_ENGINE=woocommerce pnpm --filter storefront build`);

  // health check against the new build before swapping
  ssh(`cd ${release} && node -e "require('./apps/storefront/.next/server/app/page.js')" 2>/dev/null || true`);

  // atomic swap
  ssh(`ln -sfn ${release} ${current}`);
  ssh(`pm2 restart ${app} || pm2 start ecosystem.config.js --name ${app}`);

  console.log('[deploy] done ✓');
} catch (err) {
  console.error('[deploy] FAILED — attempting rollback');
  const prev = execSync(`ssh -i ${SSH_KEY} ${user}@${host} "ls -t /home/${user}/apps/${app}/releases | sed -n '2p'"`)
    .toString().trim();
  if (prev) {
    ssh(`ln -sfn ${remote(`releases/${prev`)} ${current}`);
    ssh(`pm2 restart ${app}`);
    console.log(`[deploy] rolled back to ${prev}`);
  }
  process.exit(1);
}
```

**Also create `ecosystem.config.js`** at repo root (for PM2):
```javascript
module.exports = {
  apps: [{
    name: process.env.APP_NAME ?? 'ecom-os',
    cwd: './apps/storefront',
    script: 'node_modules/.bin/next',
    args: 'start',
    env: { NODE_ENV: 'production', PORT: 3000 },
  }],
};
```

---

### Task 8 — Documentation

Create four docs. Keep them short — the code and runbook are the source of truth.

**`docs/setup.md`** — local dev setup:
```markdown
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
```

**`docs/deploy-runbook.md`** — Hostinger deploy steps + rollback + acceptance checklist from `pre-dev/06-security-requirements.md §10`.

**`docs/addon-authoring.md`** — addon contract: `register(ctx)` + `disable()`, folder structure, how the generator finds packages.

**`docs/security.md`** — links SR-* references to where they're implemented in code.

Write these with `Write` tool. No Lorem Ipsum. Concrete, accurate.

---

### Task 9 — `.env.example` Final Pass

Verify ALL env vars from ALL plans are present. The complete list:

```bash
# === Core ===
ECOM_ENGINE=woocommerce         # woocommerce | vendure | fake
SITE_URL=https://example.com
DEFAULT_LOCALE=en
LOCALES=en,fr,ar
ADDONS=i18n,multi-payment       # comma-separated addon names

# === Security (REQUIRED — generate random values per deployment) ===
ECOM_OS_ENCRYPTION_KEY=         # base64-encoded 32-byte key: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
REVALIDATE_SECRET=              # 32+ random bytes
SESSION_COOKIE_SECRET=          # 32+ random bytes

# === WooCommerce Engine ===
WC_GRAPHQL_URL=https://your-site.com/graphql
WC_REST_URL=https://your-site.com/wp-json/wc/v3
WC_REST_KEY=ck_...
WC_REST_SECRET=cs_...

# === Vendure Engine (if ECOM_ENGINE=vendure) ===
VENDURE_SHOP_API_URL=http://localhost:3000/shop-api
VENDURE_ADMIN_API_URL=http://localhost:3000/admin-api

# === Payment ===
PAYMENT_PROVIDERS=cod           # comma-separated: cod,stripe,cmi
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CMI_MERCHANT_ID=
CMI_STORE_KEY=
CMI_CALLBACK_URL=https://your-site.com/api/payment/cmi/callback

# === Logging ===
LOG_LEVEL=info                  # debug | info | warn | error

# === Deploy (used by scripts/deploy-hostinger.ts) ===
SSH_KEY_PATH=~/.ssh/id_rsa
APP_NAME=ecom-os
```

If `.env.example` already has some of these from Plans 03/04/05, just add the missing ones.

---

### Task 10 — Tests

Write these tests. Run them. All must pass before reporting done.

**File:** `apps/storefront/src/__tests__/security/logger.test.ts`
```typescript
import { describe, it, expect, vi } from 'vitest';

vi.stubEnv('LOG_LEVEL', 'debug');
vi.stubEnv('NODE_ENV', 'production');

// Re-import after env stub
const { logger } = await import('@/lib/logger');

describe('logger', () => {
  it('redacts PII fields', () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { out.push(s as string); return true; });
    logger.info('test_event', { email: 'a@b.com', name: 'Alice', password: 'secret' });
    const parsed = JSON.parse(out[0]);
    expect(parsed.details.email).toBe('[REDACTED]');
    expect(parsed.details.password).toBe('[REDACTED]');
    expect(parsed.details.name).toBe('Alice');
  });

  it('redacts nested token fields', () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => { out.push(s as string); return true; });
    logger.info('test', { session: { authToken: 'abc123' } });
    const parsed = JSON.parse(out[0]);
    expect(parsed.details.session.authToken).toBe('[REDACTED]');
  });
});
```

**File:** `apps/storefront/src/__tests__/security/crypto.test.ts`
```typescript
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.ECOM_OS_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

const { encrypt, decrypt, timingSafeEquals } = await import('@/lib/crypto');

describe('crypto', () => {
  it('round-trips plaintext', () => {
    const plain = 'gateway_config_json';
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it('throws on tampered ciphertext', () => {
    const ct = encrypt('secret');
    const tampered = Buffer.from(ct, 'base64');
    tampered[30] ^= 0xff;
    expect(() => decrypt(tampered.toString('base64'))).toThrow();
  });

  it('timingSafeEquals works', () => {
    expect(timingSafeEquals('abc', 'abc')).toBe(true);
    expect(timingSafeEquals('abc', 'xyz')).toBe(false);
    expect(timingSafeEquals('abc', 'ab')).toBe(false);
  });
});
```

**File:** `apps/storefront/src/__tests__/security/headers.test.ts`
```typescript
import { describe, it, expect } from 'vitest';

// Integration: fetch from the running app and check headers
// Run with: pnpm --filter storefront test:integration (separate script that starts a test server)
// ponytail: basic header presence check — full SSL Labs A-grade test is a manual deploy step

const EXPECTED_HEADERS = [
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'x-frame-options',
  'content-security-policy',
];

describe('security headers', () => {
  it('are documented in SR-HEAD-001', () => {
    // Verify the list in middleware.ts matches the SR spec
    // This is a documentation-sync test — actual header values tested in E2E
    expect(EXPECTED_HEADERS).toHaveLength(5);
  });
});
```

**File:** `apps/storefront/src/__tests__/security/revalidate.test.ts`
```typescript
import { describe, it, expect, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.REVALIDATE_SECRET = 'test-secret-32-bytes-long-exactly!';
  process.env.ECOM_OS_ENCRYPTION_KEY = Buffer.from('a'.repeat(32)).toString('base64');
});

// ponytail: unit-test the handler function directly, not via HTTP
describe('revalidate endpoint', () => {
  it('rejects wrong secret', async () => {
    const { POST } = await import('@/app/api/revalidate/route');
    const req = new Request('http://localhost/api/revalidate?secret=wrong');
    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});
```

**Playwright E2E (add to existing `apps/storefront/e2e/checkout.spec.ts`):**
```typescript
test('security headers present on home page', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('DENY');
  expect(res.headers()['content-security-policy']).toContain("default-src 'self'");
});
```

---

## Pre-Completion Checklist

Before declaring this plan done, verify every item:

- [ ] `addSecurityHeaders()` called on ALL middleware response paths (i18n redirect, auth redirect, pass-through)
- [ ] `X-Powered-By` removed via `poweredByHeader: false` in next.config.ts
- [ ] Logger redacts `email`, `password`, `authToken`, `*secret*` — test passes
- [ ] AES-256-GCM round-trip test passes
- [ ] Tampered ciphertext throws on decrypt
- [ ] `/api/revalidate` returns 401 for wrong secret
- [ ] `/api/revalidate` returns 429 after 60 requests/min
- [ ] CI workflow file exists at `.github/workflows/ci.yml`
- [ ] CI engine-import guard catches a test violation: add `import {} from '@ecom-os/engine-woocommerce'` to a features file, run the grep command, confirm it exits 1, then remove it
- [ ] `ecosystem.config.js` at repo root
- [ ] `scripts/deploy-hostinger.ts` exists and has no TypeScript errors (`tsc --noEmit`)
- [ ] All four docs exist in `docs/`
- [ ] `.env.example` has all vars listed in Task 9
- [ ] `pnpm test:coverage` passes with ≥70% on adapter/addon packages
- [ ] `pnpm --filter storefront build` succeeds with `ECOM_ENGINE=fake`
- [ ] No `console.log` in committed code (run: `grep -r "console\.log" apps/storefront/src packages --include="*.ts" --include="*.tsx"` — must be empty)

---

## Session Report Template

When done, file this report:

```
## AGENT-PLAN-06 Session Report
**Date:** <date>
**Status:** COMPLETE / PARTIAL (list what's missing)

### Tasks Completed
- [ ] Task 1 — Security headers in middleware.ts
- [ ] Task 2 — Production logger with PII redaction
- [ ] Task 3 — AES-256-GCM crypto helper
- [ ] Task 4 — /api/revalidate rate-limited endpoint
- [ ] Task 5 — Vitest root config + Playwright config
- [ ] Task 6 — GitHub Actions CI workflow
- [ ] Task 7 — Hostinger deploy script + ecosystem.config.js
- [ ] Task 8 — docs/ (setup, deploy-runbook, addon-authoring, security)
- [ ] Task 9 — .env.example final pass
- [ ] Task 10 — All security tests pass

### Test Results
- Unit tests: <pass/fail count>
- Coverage: <% lines>
- E2E header test: <pass/fail>
- Build: <pass/fail>

### Security Headers Verified
<paste curl -I output showing all 6 headers>

### Files Created
<list>

### Files Modified
<list>

### Issues Encountered
<any blockers, workarounds, or deviations from the plan>

### Middleware.ts Final State
<confirm it has: next-intl routing (Plan 03) + auth guard + rate limit (Plan 05) + security headers (this plan) + requestId injection>

### What's NOT Done (if any)
<list with reason>
```

---

## Notes for the Agent

1. **Read middleware.ts before touching it.** It was modified by Plans 03 and 05. Your job is to ADD security headers to it, not rewrite it. Merge carefully.
2. **Read logger.ts before touching it.** Plan 03 may have created a stub. Extend it, don't duplicate it.
3. **The deploy script uses `execSync` for simplicity** — this is fine for a CLI script, not for a server. ponytail: simpler than node-ssh; add streaming output if deploys exceed 2 min.
4. **Gitleaks and Trivy run on CI** — they don't need to be installed locally. If the CI job fails for an unrelated reason (e.g., no GITHUB_TOKEN for Gitleaks on forks), that's expected behavior.
5. **Coverage threshold 70%** applies to `packages/` only (adapter + addon code), not `apps/storefront/src/app/` pages (RSC pages are hard to unit-test meaningfully).
