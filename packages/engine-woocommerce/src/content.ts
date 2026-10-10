import {
  PageSectionsData,
  parseAndValidatePageSections,
  sanitizeCmsMarkup,
} from '@ecom-os/engine';

export function resolveWordPressCmsBaseUrl(): string | null {
  const wpUrl = process.env.WORDPRESS_URL || process.env.WP_URL;
  if (wpUrl && wpUrl.trim().length > 0) {
    try {
      const parsed = new URL(wpUrl.trim());
      return parsed.origin;
    } catch {
      // Invalid URL
    }
  }

  const wcRestUrl = process.env.WC_REST_URL;
  if (wcRestUrl && wcRestUrl.trim().length > 0) {
    try {
      const parsed = new URL(wcRestUrl.trim());
      return parsed.origin;
    } catch {
      // Invalid URL
    }
  }

  return null;
}

/**
 * Fetches arbitrary structured CMS content for a given slot.
 * Returns null gracefully if WordPress is unavailable or slot is not configured.
 */
export async function fetchCmsContent(
  slot: string,
  locale?: string
): Promise<Record<string, unknown> | null> {
  const baseUrl = resolveWordPressCmsBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const endpoint = new URL(`/wp-json/epioso/v1/content/${encodeURIComponent(slot)}`, baseUrl);
  if (locale) {
    endpoint.searchParams.set('locale', locale);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(endpoint.toString(), {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (!json || typeof json !== 'object') {
      return null;
    }

    return (json.data ?? json) as Record<string, unknown>;
  } catch {
    // Network failure, timeout, or abort - gracefully return null for fallback handling
    return null;
  }
}

/**
 * Fetches and validates page sections for a page (e.g. 'home').
 * Ensures content is strictly validated and safe from XSS.
 * Returns null if CMS is unreachable or returns malformed payload.
 */
export async function fetchPageSections(
  pageSlug: string,
  locale?: string
): Promise<PageSectionsData | null> {
  const raw = await fetchCmsContent(pageSlug, locale);
  if (!raw) {
    return null;
  }

  return parseAndValidatePageSections(raw);
}
