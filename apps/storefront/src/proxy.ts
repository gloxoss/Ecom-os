import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware<readonly string[], 'as-needed' | 'never'>(routing);

// Build locale-strip regex dynamically from active routing config
const nonDefaultLocales = routing.locales as string[];
const LOCALE_PREFIX_RE = nonDefaultLocales.length > 0
  ? new RegExp(`^/(${nonDefaultLocales.join('|')})(?=/|$)`)
  : /(?!)/; // never matches

const isDev = process.env.NODE_ENV === 'development';

/**
 * In development Turbopack injects many inline scripts and loads chunks from
 * ws:// / localhost. Using 'strict-dynamic' without a nonce blocks everything.
 * We use a permissive policy in dev so HMR + React DevTools work without noise.
 *
 * In production we use a per-request nonce so 'strict-dynamic' can work correctly:
 * - Next.js reads the forwarded request CSP and stamps its nonce on scripts.
 */
function buildCsp(nonce: string): string {
  if (isDev) {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://* http://*",
      // ws/wss needed for Turbopack HMR
      "connect-src 'self' ws://localhost:* wss://localhost:* https://*",
      "frame-src 'self' https://js.stripe.com",
      "font-src 'self' data: https://*",
      "worker-src 'self' blob:",
    ].join('; ');
  }

  // Production: strict nonce-based policy
  return [
    "default-src 'self'",
    // 'strict-dynamic' propagates trust from the nonce-bearing script to all
    // scripts it loads, so Next.js chunk splitting works without enumeration.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*",
    "connect-src 'self' https://api.stripe.com https://js.stripe.com",
    "frame-src https://js.stripe.com",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

function applySecurityHeaders(
  response: NextResponse,
  csp: string,
  requestId: string,
): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-request-id', requestId);
  return response;
}

export function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID();
  // Nonce must be unique per request so the CSP header and the meta tag match.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce);

  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(LOCALE_PREFIX_RE, '') || '/';
  if (/(^|\/)account(\/|$)/.test(pathnameWithoutLocale)) {
    return applySecurityHeaders(new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } }), csp, requestId);
  }

  // Run next-intl middleware (handles locale redirects + cookies).
  // Return its response directly so we don't strip the internal routing headers
  // it injects (e.g. x-nextjs-rewrite). Replacing it with a fresh
  // NextResponse.next() causes [locale] routes to 404.
  const intlResponse = intlMiddleware(request);
  // Preserve locale rewrite overrides while forwarding the rendering CSP.
  const overrides = new Set((intlResponse.headers.get('x-middleware-override-headers') ?? '').split(',').filter(Boolean));
  for (const [name, value] of [['content-security-policy', csp], ['x-nonce', nonce]]) {
    intlResponse.headers.set(`x-middleware-request-${name}`, value!);
    overrides.add(name!);
  }
  intlResponse.headers.set('x-middleware-override-headers', [...overrides].join(','));
  return applySecurityHeaders(intlResponse, csp, requestId);
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|wp-admin|wp-login\\.php|wp-content|wp-includes|.*\\..*).*)'],
};
