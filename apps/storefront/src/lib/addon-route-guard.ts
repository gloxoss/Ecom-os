/**
 * Storefront Addon Route Guard & Side-Effect Barrier
 *
 * Intercepts requests to addon routes and API endpoints.
 * Guarantees that disabled services return 404/403 and never trigger side effects.
 */

import { getStorefrontRegistry } from './addon-capabilities';

export interface GuardedResponse {
  allowed: boolean;
  status: 200 | 403 | 404;
  body?: {
    error: string;
    code: string;
  };
}

/**
 * Guards an API or route handler against the authoritative addon registry.
 */
export function guardAddonRoute(
  addonId: string,
  requiredCapability?: string
): GuardedResponse {
  const registry = getStorefrontRegistry();
  const guard = registry.guardService(addonId, requiredCapability);

  if (!guard.authorized) {
    return {
      allowed: false,
      status: guard.statusCode,
      body: {
        error: guard.reason || 'Service unavailable',
        code: guard.statusCode === 404 ? 'ADDON_DISABLED' : 'CAPABILITY_DENIED',
      },
    };
  }

  return {
    allowed: true,
    status: 200,
  };
}

/**
 * Higher-order function wrapping route handlers with the authoritative addon guard.
 * If disabled, returns a standard Next.js Response with 404 status without executing handler.
 */
export function withAddonGuard<A extends unknown[], R>(
  addonId: string,
  handler: (...args: A) => R,
  requiredCapability?: string
): (...args: A) => Promise<Response | R> {
  return async (...args: A) => {
    const check = guardAddonRoute(addonId, requiredCapability);
    if (!check.allowed) {
      return new Response(JSON.stringify(check.body), {
        status: check.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return handler(...args);
  };
}
