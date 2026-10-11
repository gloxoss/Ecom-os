import type { MetadataRoute } from 'next';
import { getEngine } from '@/lib/engine';
import { resolveSiteUrl, buildCanonicalUrl, isStagingEnvironment } from '@/lib/seo/config';
import { routing, i18nEnabled } from '@/i18n/routing';

/**
 * Generates sitemap.xml for EcomOS storefront.
 * Includes published public catalog, category, and informational pages.
 * Excludes private transactions, checkout, order grants, RFQ quotes, and draft items.
 * Returns empty sitemap in staging environments to prevent unintended crawling.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteUrl();

  if (isStagingEnvironment(siteUrl)) {
    return [];
  }

  const engine = await getEngine();
  const entries: MetadataRoute.Sitemap = [];

  const buildAlternates = (path: string) => {
    if (!i18nEnabled || routing.locales.length <= 1) return undefined;
    const languages: Record<string, string> = {};
    for (const loc of routing.locales) {
      languages[loc] = buildCanonicalUrl(path, { siteUrl, locale: loc });
    }
    return { languages };
  };

  // 1. Static public routes
  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  }> = [
    { path: '/', priority: 1.0, changeFrequency: 'daily' },
    { path: '/catalog', priority: 0.8, changeFrequency: 'daily' },
    { path: '/about-us', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/contact-us', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/stores', priority: 0.5, changeFrequency: 'monthly' },
    { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ];

  for (const route of staticRoutes) {
    entries.push({
      url: buildCanonicalUrl(route.path, { siteUrl }),
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: buildAlternates(route.path),
    });
  }

  // 2. Published Categories
  try {
    const categories = await engine.listCategories();
    for (const cat of categories) {
      const catPath = `/catalog/${cat.slug}`;
      entries.push({
        url: buildCanonicalUrl(catPath, { siteUrl }),
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: buildAlternates(catPath),
      });
    }
  } catch (err) {
    console.error('Failed to enumerate categories for sitemap:', err);
  }

  // 3. Published Products (excluding draft, archived or non-public products)
  try {
    const { items: products } = await engine.listProducts({ limit: 100 });
    for (const prod of products) {
      // Exclude completely unavailable/removed products if desired, or include active products
      if (prod.isPurchasable === false && prod.inventory?.status === 'OUT_OF_STOCK') {
        continue;
      }
      const prodPath = `/product/${prod.slug}`;
      entries.push({
        url: buildCanonicalUrl(prodPath, { siteUrl }),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: buildAlternates(prodPath),
      });
    }
  } catch (err) {
    console.error('Failed to enumerate products for sitemap:', err);
  }

  return entries;
}
