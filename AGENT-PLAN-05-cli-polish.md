# AGENT-PLAN-05 — Section 04 (CLI) + Section 05 Gaps (Animations/Skeletons) + Section 07 Gaps (Rate Limiting)
> **Read this document fully before touching any code.**
> Parallel with Plans 03 and 04. Does NOT touch middleware.ts security headers (Plan D handles that).

---

## Skills Active
- `ecom-storefront-features` — RSC-first, Zod validation, performance targets
- `ecom-brand-theming` — no hardcoded colors, design tokens
- `/ponytail` — minimum code, no speculative abstractions
- `/karpathy-guidelines` — correctness, test what matters
- `/nonstop` — ship all three sections before reporting done

---

## What Already Exists — DO NOT REDO

- All packages under `packages/` ✅
- Full storefront pages (home, catalog, PDP, checkout, account) ✅
- `features/landing/ui/hero-client.tsx` — GSAP entrance animation ✅
- `features/catalog/ui/product-card.tsx`, `product-grid.tsx` ✅
- `apps/storefront/src/middleware.ts` — auth guard (DO NOT TOUCH — Plan D owns security headers)
- `apps/storefront/src/lib/engine.ts` — engine gateway ✅
- `apps/storefront/src/stores/cart-store.ts` ✅
- `apps/storefront/src/features/account/server/auth-actions.ts` ✅
- `scripts/generate-addons.ts` (may be updated by Plan A — check current state before editing)
- `scripts/generate-tokens.ts` ✅

---

## Architecture Laws

1. No UI component imports engine adapters. Only `@ecom-os/engine` in UI.
2. Server Components by default. `'use client'` only for GSAP, Zustand, events.
3. No hardcoded colors. Only design tokens (`text-foreground`, `bg-background`, etc.).
4. No `any` types without `// ponytail:` justification.
5. No `console.log` in committed code — use `src/lib/logger.ts` (Plan A creates it; if not yet created, create the same stub here).
6. `next/image` for all raster images. `next/link` for internal routes.
7. CLI must not modify the monorepo at install time — it scaffolds a SEPARATE deployment directory.
8. Performance: catalog page hydrated JS ≤ 180KB gzipped, LCP ≤ 2.0s.

---

## Codebase Context

### Key files to READ before coding

```
apps/storefront/src/app/(shop)/page.tsx               — home page
apps/storefront/src/app/(shop)/catalog/page.tsx        — catalog page
apps/storefront/src/app/(shop)/product/[slug]/page.tsx — PDP
apps/storefront/src/features/landing/ui/hero-client.tsx — existing GSAP animation
apps/storefront/src/features/catalog/ui/product-grid.tsx
apps/storefront/src/features/catalog/ui/product-card.tsx
apps/storefront/src/middleware.ts                       — DO NOT ADD security headers here
apps/storefront/src/lib/engine.ts
apps/storefront/brand.config.ts
apps/storefront/package.json                           — gsap already installed
scripts/generate-addons.ts
scripts/generate-tokens.ts
.env.example                                           — expand with new vars
package.json                                           — scripts + bin entry
```

---

## Part A — Section 04: `create-ecom-os` CLI

### A1 — Template skeleton

**Directory:** `templates/deployment/` (create full structure)

This is the minimal deployment a client gets when they run `npx create-ecom-os`. It is a standalone project, NOT the monorepo itself.

```
templates/deployment/
├── package.json             ← minimal Next.js app
├── pnpm-workspace.yaml      ← workspace
├── .env.example             ← all required vars
├── brand.config.ts          ← placeholder brand
├── apps/
│   └── storefront/
│       ├── package.json
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts   ← v4, empty (tokens from CSS)
│       └── src/
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── globals.css
│           │   └── (shop)/
│           │       └── page.tsx   ← "Hello from Ecom OS" placeholder
│           ├── lib/
│           │   └── engine.ts      ← same gateway pattern
│           └── components/
│               └── shared/
│                   └── site-header.tsx
```

**`templates/deployment/package.json`:**
```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "predev": "npx tsx scripts/generate-tokens.ts && npx tsx scripts/generate-addons.ts",
    "prebuild": "npx tsx scripts/generate-tokens.ts && npx tsx scripts/generate-addons.ts",
    "dev": "pnpm --filter storefront dev",
    "build": "pnpm --filter storefront build",
    "deploy:hostinger": "npx tsx scripts/deploy-hostinger.ts"
  },
  "engines": { "node": ">=22", "pnpm": ">=9" },
  "devDependencies": { "tsx": "^4.22.4" }
}
```

**`templates/deployment/.env.example`:**
```
# Core
ECOM_ENGINE=woocommerce
SITE_URL=https://yourdomain.com
ADDONS=

# WooCommerce Engine
WC_GRAPHQL_URL=https://cms.yourdomain.com/graphql
WC_REST_URL=https://cms.yourdomain.com/wp-json/wc/v3
WC_REST_KEY=ck_your_key
WC_REST_SECRET=cs_your_secret

# Security (generate with: openssl rand -base64 32)
ECOM_OS_ENCRYPTION_KEY=
REVALIDATE_SECRET=
SESSION_COOKIE_SECRET=

# Brand
BRAND_NAME=My Store
DEFAULT_LOCALE=en
LOCALES=en

# Payment
PAYMENT_PROVIDERS=cod
NOTIFICATION_EMAIL=

# Deploy
ECOM_DEPLOY_MODE=
```

**`templates/deployment/brand.config.ts`:**
```typescript
import type { BrandConfig } from '@ecom-os/brand-config';

export const brandConfig: BrandConfig = {
  name: '{{BRAND_NAME}}',
  colors: {
    primary: '#1a1a1a',
    secondary: '#6b7280',
    background: '#ffffff',
    foreground: '#1a1a1a',
    muted: '#f9fafb',
    border: '#e5e7eb',
  },
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  radii: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
  hero: {
    headline: 'Welcome to {{BRAND_NAME}}',
    subheadline: 'Discover our collection.',
    ctaLabel: 'Shop Now',
    ctaHref: '/catalog',
  },
};
```

**`templates/deployment/apps/storefront/src/app/(shop)/page.tsx`:**
```typescript
import { getEngine } from '@/lib/engine';

export const revalidate = 60;

export default async function HomePage() {
  const engine = await getEngine();
  const result = await engine.listProducts({ limit: 20 });

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Welcome</h1>
      <p className="text-secondary">Your store has {result.total} products. Customize this page.</p>
    </main>
  );
}
```

**`templates/deployment/apps/storefront/src/lib/engine.ts`:** (same as main app)

### A2 — CLI script

**File:** `scripts/create-ecom-os.ts` (create)

```typescript
#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import readline from 'readline';

const args = process.argv.slice(2);
const projectName = args[0];
const engineFlag = args.find(a => a.startsWith('--engine='))?.split('=')[1] ?? 'woocommerce';

if (!projectName) {
  console.error('Usage: npx create-ecom-os <project-name> [--engine=woocommerce|fake]');
  process.exit(1);
}

if (!/^[a-z0-9-]+$/.test(projectName)) {
  console.error('Project name must be lowercase alphanumeric with hyphens only');
  process.exit(1);
}

const validEngines = ['woocommerce', 'fake'];
if (!validEngines.includes(engineFlag)) {
  console.error(`Unknown engine: "${engineFlag}". Valid: ${validEngines.join(', ')}`);
  process.exit(1);
}

const targetDir = path.resolve(process.cwd(), projectName);
if (fs.existsSync(targetDir)) {
  console.error(`Directory "${projectName}" already exists`);
  process.exit(1);
}

const templateDir = path.join(__dirname, '../templates/deployment');
if (!fs.existsSync(templateDir)) {
  console.error('Template directory not found. Is this run from the Ecom OS monorepo?');
  process.exit(1);
}

console.log(`Creating Ecom OS project: ${projectName} (engine: ${engineFlag})`);

// Copy template
copyDir(templateDir, targetDir);

// Substitute placeholders
substitutePlaceholders(targetDir, { PROJECT_NAME: projectName, BRAND_NAME: projectName });

// Write .env with engine
const envExample = path.join(targetDir, '.env.example');
const envOut = path.join(targetDir, '.env');
let envContent = fs.readFileSync(envExample, 'utf-8');
envContent = envContent.replace('ECOM_ENGINE=woocommerce', `ECOM_ENGINE=${engineFlag}`);
fs.writeFileSync(envOut, envContent);

console.log('Template copied. Installing dependencies...');
execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });

console.log(`
✅ Done! Your Ecom OS project is ready:

  cd ${projectName}
  cp .env.example .env   (already copied — fill in your WC credentials)
  pnpm dev

Documentation: https://github.com/gloxoss/Ecom-os
`);

function copyDir(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function substitutePlaceholders(dir: string, vars: Record<string, string>) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) { substitutePlaceholders(fullPath, vars); continue; }
    if (!['.ts', '.tsx', '.json', '.md', '.env', '.env.example'].some(ext => entry.name.endsWith(ext))) continue;
    let content = fs.readFileSync(fullPath, 'utf-8');
    for (const [k, v] of Object.entries(vars)) {
      content = content.replaceAll(`{{${k}}}`, v);
    }
    fs.writeFileSync(fullPath, content);
  }
}
```

### A3 — Wire `bin` entry in root `package.json`

Edit `package.json` (root), add to `scripts` and add `bin`:
```json
{
  "bin": {
    "create-ecom-os": "scripts/create-ecom-os.ts"
  },
  "scripts": {
    "create": "npx tsx scripts/create-ecom-os.ts"
  }
}
```

### A4 — Deploy script stub

**File:** `scripts/deploy-hostinger.ts` (create stub — Plan D completes it)

```typescript
#!/usr/bin/env tsx
// ponytail: stub — Plan D (Section 10) implements SSH+rsync+PM2 deploy
console.log('Deploy script not yet implemented. See AGENT-PLAN-06-security-deploy.md');
process.exit(0);
```

---

## Part B — Section 05 Gaps: Scroll Animations + Skeletons + Error States

### B1 — ScrollTrigger on product grid

**File:** `apps/storefront/src/features/catalog/ui/product-grid-client.tsx` (create — client island)

```typescript
'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@ecom-os/engine';
import { ProductCard } from './product-card';

gsap.registerPlugin(ScrollTrigger);

export function ProductGridAnimated({ products }: { products: Product[] }) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;
    gsap.from(container.current.querySelectorAll('.product-card-item'), {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 85%',
        once: true,
      },
    });
  }, { scope: container });

  if (!products.length) {
    return <div className="text-center text-secondary py-20">No products found.</div>;
  }

  return (
    <div ref={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {products.map(product => (
        <div key={product.id} className="product-card-item">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
```

Update `apps/storefront/src/features/catalog/ui/product-grid.tsx` to use the animated version:
```typescript
import { Product } from '@ecom-os/engine';
import { ProductGridAnimated } from './product-grid-client';

export function ProductGrid({ products }: { products: Product[] }) {
  return <ProductGridAnimated products={products} />;
}
```

### B2 — Loading skeleton components

**File:** `apps/storefront/src/features/catalog/ui/product-card-skeleton.tsx` (create)

```typescript
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-muted rounded-lg mb-4" />
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/4" />
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

**File:** `apps/storefront/src/app/(shop)/catalog/loading.tsx` (create — Next.js loading UI)

```typescript
import { ProductGridSkeleton } from '@/features/catalog/ui/product-card-skeleton';

export default function CatalogLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <div className="h-10 bg-muted rounded w-48 mb-8 animate-pulse" />
      <div className="flex gap-3 mb-10">
        {[1,2,3].map(i => <div key={i} className="h-9 w-20 bg-muted rounded-full animate-pulse" />)}
      </div>
      <ProductGridSkeleton count={8} />
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(shop)/product/[slug]/loading.tsx` (create)

```typescript
export default function PDPLoading() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-16 animate-pulse">
      <div className="aspect-square bg-muted rounded-xl" />
      <div className="flex flex-col justify-center space-y-4">
        <div className="h-8 bg-muted rounded w-3/4" />
        <div className="h-6 bg-muted rounded w-1/4" />
        <div className="h-32 bg-muted rounded" />
        <div className="h-14 bg-muted rounded mt-8" />
      </div>
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(shop)/loading.tsx` (create — home page)

```typescript
import { ProductGridSkeleton } from '@/features/catalog/ui/product-card-skeleton';

export default function HomeLoading() {
  return (
    <main>
      <div className="min-h-[70vh] bg-muted animate-pulse" />
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="h-8 bg-muted rounded w-56 mb-8 animate-pulse" />
        <ProductGridSkeleton count={4} />
      </section>
    </main>
  );
}
```

### B3 — Error boundaries

**File:** `apps/storefront/src/app/(shop)/error.tsx` (create — Next.js error boundary)

```typescript
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[shop error]', error.message);
  }, [error]);

  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
      <p className="text-secondary mb-8">We couldn't load this page. Please try again.</p>
      <div className="flex gap-4 justify-center">
        <button onClick={reset} className="bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition">
          Try again
        </button>
        <Link href="/" className="border border-foreground/20 px-6 py-3 rounded-md font-medium hover:bg-muted transition">
          Go home
        </Link>
      </div>
    </main>
  );
}
```

**File:** `apps/storefront/src/app/(shop)/catalog/error.tsx` (same pattern, reuse)

```typescript
'use client';
export { default } from '@/app/(shop)/error';
```

---

## Part C — Section 07 Gaps: Rate Limiting

### C1 — In-memory rate limiter

**File:** `apps/storefront/src/lib/rate-limit.ts` (create)

```typescript
// ponytail: in-memory per-IP counters. For multi-instance deploys, replace with Redis in v1.1.
type WindowEntry = { count: number; resetAt: number };

const windows = new Map<string, WindowEntry>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

// Evict expired entries periodically to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (now > entry.resetAt) windows.delete(key);
  }
}, 60_000);
```

### C2 — Wire rate limiting into auth server actions

**File:** `apps/storefront/src/features/account/server/auth-actions.ts` (edit — add rate limiting to login)

```typescript
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { checkRateLimit } from '@/lib/rate-limit';

const AUTH_COOKIE = 'ecom_auth';
const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

export async function login(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  
  // SR-RATE-001: auth 10 requests / 60 seconds per IP
  const { allowed, retryAfterMs } = checkRateLimit(`auth:${ip}`, 10, 60_000);
  if (!allowed) {
    redirect(`/account/login?error=rate_limit&retry=${Math.ceil(retryAfterMs / 1000)}`);
  }

  const engine = await getEngine();
  try {
    const session = await engine.login({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch {
    redirect('/account/login?error=1');
  }
  redirect('/account');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/');
}

export async function register(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  
  const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!allowed) {
    redirect(`/account/register?error=rate_limit&retry=${Math.ceil(retryAfterMs / 1000)}`);
  }

  const engine = await getEngine();
  try {
    const session = await engine.registerCustomer({
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch {
    redirect('/account/register?error=1');
  }
  redirect('/account');
}
```

Update the login page to show rate-limit message:

**`apps/storefront/src/app/(account)/account/login/page.tsx`** — add rate limit error:

```typescript
{error === 'rate_limit' && (
  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-md mb-6 text-sm">
    Too many login attempts. Please wait {searchParams.retry ?? 60} seconds and try again.
  </div>
)}
```

### C3 — Rate limiting for checkout server action

Edit `apps/storefront/src/app/(checkout)/checkout/page.tsx` to add rate limit inside the server action:

```typescript
// At the top of submitOrder server action:
const { headers } = await import('next/headers');
const headerList = await headers();
const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
const { checkRateLimit } = await import('@/lib/rate-limit');
const { allowed } = checkRateLimit(`checkout:${ip}`, 5, 60_000);
if (!allowed) throw new Error('Too many checkout attempts. Please wait and try again.');
```

### C4 — Password reset (note)

Password reset (FR screens S-33/S-34) requires WPGraphQL JWT Authentication plugin's `sendPasswordResetEmail` mutation. This cannot be implemented without a running WP instance with the plugin installed.

**Create a placeholder page** that explains this clearly:

**File:** `apps/storefront/src/app/(account)/account/forgot-password/page.tsx` (create)

```typescript
import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl font-bold mb-4">Reset Password</h1>
      <p className="text-secondary mb-6">
        Password reset emails are sent via WordPress. Visit your WordPress admin or
        use the WordPress login page to reset your password.
      </p>
      <a
        href={`${process.env.NEXT_PUBLIC_WP_URL ?? '#'}/wp-login.php?action=lostpassword`}
        className="inline-block bg-foreground text-background px-6 py-3 rounded-md font-medium hover:opacity-90 transition mb-4"
      >
        Reset via WordPress
      </a>
      <br />
      <Link href="/account/login" className="text-secondary text-sm underline">
        Back to sign in
      </Link>
    </main>
  );
}
```

Add `NEXT_PUBLIC_WP_URL` to `.env.example`:
```
NEXT_PUBLIC_WP_URL=https://cms.yourdomain.com
```

---

## Part D — Update `.env.example` with all new vars

Final `.env.example` should include everything needed for a fresh deployment:

```
# Core
ECOM_ENGINE=woocommerce
SITE_URL=https://yourdomain.com
ADDONS=
DEFAULT_LOCALE=en
LOCALES=en,fr,ar

# WooCommerce Engine
WC_GRAPHQL_URL=https://cms.yourdomain.com/graphql
WC_REST_URL=https://cms.yourdomain.com/wp-json/wc/v3
WC_REST_KEY=ck_your_key
WC_REST_SECRET=cs_your_secret
NEXT_PUBLIC_WP_URL=https://cms.yourdomain.com

# Security (generate: openssl rand -base64 32)
ECOM_OS_ENCRYPTION_KEY=
REVALIDATE_SECRET=
SESSION_COOKIE_SECRET=

# Payment
PAYMENT_PROVIDERS=cod
NOTIFICATION_EMAIL=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
CMI_MERCHANT_ID=
CMI_STORE_KEY=
CMI_GATEWAY_URL=https://testpayment.cmi.co.ma/fim/est3Dgate

# Deploy
ECOM_DEPLOY_MODE=
```

---

## Pre-Completion Checklist — ALL must pass before reporting done

### CLI
```bash
# 1. Template structure complete
ls templates/deployment/
ls templates/deployment/apps/storefront/src/

# 2. CLI runs without error
npx tsx scripts/create-ecom-os.ts --help 2>&1 || true

# 3. Scaffold test
cd /tmp && npx tsx /path/to/scripts/create-ecom-os.ts test-project --engine=fake
ls test-project/
ls test-project/apps/storefront/src/
```

### Animations
```bash
# 4. Type check
pnpm --filter storefront typecheck

# 5. Loading files exist
ls apps/storefront/src/app/\(shop\)/loading.tsx
ls apps/storefront/src/app/\(shop\)/catalog/loading.tsx
ls apps/storefront/src/app/\(shop\)/product/\[slug\]/loading.tsx

# 6. No hardcoded colors (bg-gray-*, text-gray-*)
grep -rn "bg-gray-\|text-gray-\|border-gray-" apps/storefront/src/
# → FAIL if any non-muted color references; replace with bg-muted, text-secondary, border-border
```

### Rate Limiting
```bash
# 7. Rate limit module exists
ls apps/storefront/src/lib/rate-limit.ts

# 8. Auth actions import rate limit
grep -n "checkRateLimit" apps/storefront/src/features/account/server/auth-actions.ts

# 9. Build passes
pnpm --filter storefront build
```

**Manual verification:**
- [ ] `/catalog` shows skeleton loading state while data loads
- [ ] `/product/[slug]` shows skeleton loading state
- [ ] Product grid fades in from bottom when scrolled into view
- [ ] 11+ login attempts in 60s → rate limit error message on login page
- [ ] 6+ checkout attempts in 60s → error message
- [ ] `npx create-ecom-os my-store --engine=fake` creates a `my-store/` directory with `pnpm install && pnpm dev` working

---

## Session Report Template

```
## AGENT-PLAN-05 Session Report — CLI + Animations + Rate Limiting

### Part A — CLI Scaffold
- [ ] templates/deployment/ created with all required files
- [ ] scripts/create-ecom-os.ts implemented and tested
- [ ] bin entry in package.json
- [ ] scripts/deploy-hostinger.ts stub created
- CLI test: npx tsx scripts/create-ecom-os.ts test-project --engine=fake → [PASS/FAIL]

### Part B — Animations + Skeletons
- [ ] ProductGridAnimated with ScrollTrigger created
- [ ] Loading skeletons: home, catalog, PDP
- [ ] Error boundaries: shop, catalog
- typecheck: [PASS/FAIL — errors]

### Part C — Rate Limiting
- [ ] src/lib/rate-limit.ts created
- [ ] Auth login rate limited (10/min per IP)
- [ ] Register rate limited (5/min per IP)
- [ ] Checkout rate limited (5/min per IP)
- [ ] Forgot password placeholder page created
- [ ] .env.example updated with all vars

### What was NOT done and why
[Password reset: needs WP plugin — placeholder created instead]
[Other items]

### Files modified
[Every file created/modified/deleted]

### Conflicts to note
- No middleware.ts changes (Plan D owns security headers)
- checkout/page.tsx modified for rate limit — Plan 04 may also modify this file for payment routing; merge carefully
```
