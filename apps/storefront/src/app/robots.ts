import type { MetadataRoute } from 'next';
import { resolveSiteUrl, isStagingEnvironment } from '@/lib/seo/config';

/**
 * Generates robots.txt policy for EcomOS storefront.
 * Disallows private flows (cart, checkout, order tracking, RFQ quotes, user account, internal APIs)
 * and parameterized dynamic search endpoints.
 * Staging environments explicitly disallow all indexing.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = resolveSiteUrl();

  if (isStagingEnvironment(siteUrl)) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
      sitemap: `${siteUrl}/sitemap.xml`,
    };
  }

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
