import type { MetadataRoute } from 'next';
import { resolveSiteUrl } from '@/lib/seo/config';

/**
 * Generates robots.txt policy for EcomOS storefront.
 * Disallows private flows (cart, checkout, order tracking, RFQ quotes, user account, internal APIs)
 * and parameterized dynamic search endpoints.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/cart',
          '/*/cart',
          '/checkout',
          '/*/checkout',
          '/order',
          '/*/order',
          '/quote',
          '/*/quote',
          '/account',
          '/*/account',
          '/search',
          '/*/search',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
