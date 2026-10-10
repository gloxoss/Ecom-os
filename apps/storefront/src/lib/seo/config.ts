/**
 * SEO configuration and URL canonicalization utilities for EcomOS storefront.
 */

import { routing, i18nEnabled } from '@/i18n/routing';

/**
 * Validates and resolves the authoritative site base URL.
 * Enforces http/https protocol and eliminates trailing slashes.
 */
export function resolveSiteUrl(override?: string): string {
  const rawUrl =
    override ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    'http://localhost:3000';

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid canonical site URL: "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Insecure or unsupported protocol in canonical site URL: "${parsed.protocol}"`);
  }

  // Remove trailing slashes and return clean origin or base pathname
  const cleaned = parsed.origin + (parsed.pathname === '/' ? '' : parsed.pathname);
  return cleaned.replace(/\/+$/, '');
}

export interface CanonicalUrlOptions {
  siteUrl?: string;
  locale?: string;
}

/**
 * Constructs an absolute, clean, canonical URL.
 * Strips all query parameters, search filters, and trailing hashes.
 */
export function buildCanonicalUrl(path: string, options?: CanonicalUrlOptions): string {
  const base = resolveSiteUrl(options?.siteUrl);
  const cleanPath = path.split('?')[0].split('#')[0];
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  // If locale is specified and i18n is enabled with multiple locales
  if (options?.locale && i18nEnabled && routing.locales.length > 1) {
    const isDefault = options.locale === routing.defaultLocale;
    // If routing has prefix 'always' or locale is not default:
    // next-intl routing default prefix rule: if prefix is not 'never' and not default:
    if (!isDefault) {
      const localizedPath = normalizedPath === '/' ? `/${options.locale}` : `/${options.locale}${normalizedPath}`;
      return `${base}${localizedPath}`;
    }
  }

  return `${base}${normalizedPath === '/' ? '' : normalizedPath}`;
}

/**
 * Inspects query params / search params to detect facet filters, pagination, or search queries.
 */
export function hasFacetOrFilterParams(
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): boolean {
  if (!searchParams) return false;

  const facetKeys = [
    'q',
    'search',
    'query',
    'category',
    'brand',
    'min_price',
    'max_price',
    'price_min',
    'price_max',
    'sort',
    'order',
    'orderby',
    'filter_',
    'attributes',
    'v_',
  ];

  if (searchParams instanceof URLSearchParams) {
    for (const [key, val] of searchParams.entries()) {
      if (!val) continue;
      if (key === 'page' && parseInt(val, 10) > 1) return true;
      if (facetKeys.some((fk) => key === fk || key.startsWith(fk))) return true;
    }
    return false;
  }

  for (const [key, val] of Object.entries(searchParams)) {
    if (val === undefined || val === '') continue;
    if (key === 'page') {
      const pageNum = typeof val === 'string' ? parseInt(val, 10) : parseInt(val[0], 10);
      if (pageNum > 1) return true;
    }
    if (facetKeys.some((fk) => key === fk || key.startsWith(fk))) {
      return true;
    }
  }

  return false;
}

export interface RobotsPolicyOptions {
  isPrivate?: boolean;
  hasFacetFilters?: boolean;
}

/**
 * Determines search engine indexing policy.
 * - Private paths: noindex, nofollow
 * - Filtered / faceted / search pages: noindex, follow (allow spidering product links without duplicate facet indexing)
 * - Standard public content: index, follow
 */
export function resolveRobotsPolicy(options?: RobotsPolicyOptions): {
  index: boolean;
  follow: boolean;
} {
  if (options?.isPrivate) {
    return { index: false, follow: false };
  }
  if (options?.hasFacetFilters) {
    return { index: false, follow: true };
  }
  return { index: true, follow: true };
}
