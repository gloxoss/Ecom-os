/**
 * Product & Category SEO metadata and Schema.org JSON-LD generators.
 */

import type { Metadata } from 'next';
import type { Product, Category } from '@ecom-os/engine';
import { buildCanonicalUrl, resolveSiteUrl, resolveRobotsPolicy } from './config';
import { routing, i18nEnabled } from '@/i18n/routing';

export interface ProductMetadataOptions {
  locale?: string;
  siteUrl?: string;
  brandName?: string;
}

/**
 * Builds standard Next.js Metadata for a product page.
 */
export function buildProductMetadata(
  product: Product | null | undefined,
  options?: ProductMetadataOptions
): Metadata {
  if (!product) {
    return {
      title: 'Product Not Found',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = resolveSiteUrl(options?.siteUrl);
  const canonicalUrl = buildCanonicalUrl(`/product/${product.slug}`, {
    siteUrl,
    locale: options?.locale,
  });

  const brandName = options?.brandName || product.brand?.name || 'Maison';
  const title = `${product.name} | ${brandName}`;
  const rawDescription = product.shortDescription || product.description || '';
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim().slice(0, 160);

  // Generate alternate language links if multi-language routing is active
  const languages: Record<string, string> = {};
  if (i18nEnabled && routing.locales.length > 1) {
    for (const loc of routing.locales) {
      languages[loc] = buildCanonicalUrl(`/product/${product.slug}`, {
        siteUrl,
        locale: loc,
      });
    }
  }

  const images = (product.images || []).map((img) => ({
    url: img.url,
    alt: img.altText || product.name,
  }));

  // Removed/unlisted items that are neither in stock nor purchasable are noindexed
  const isOutOfCatalog = product.isPurchasable === false && product.inventory?.status === 'OUT_OF_STOCK';

  return {
    title,
    description: cleanDescription,
    alternates: {
      canonical: canonicalUrl,
      ...(Object.keys(languages).length > 0 ? { languages } : {}),
    },
    openGraph: {
      title,
      description: cleanDescription,
      url: canonicalUrl,
      type: 'website',
      images,
    },
    robots: resolveRobotsPolicy({ isPrivate: isOutOfCatalog }),
  };
}

export interface ProductJsonLdOptions {
  canonicalUrl: string;
  brandName?: string;
}

/**
 * Builds Schema.org Product structured data.
 * Refuse to advertise false offers: unavailable or price-less products omit fake offers.
 */
export function buildProductJsonLd(
  product: Product,
  options: ProductJsonLdOptions
): Record<string, unknown> {
  const brand =
    product.brand?.name || options.brandName
      ? {
          '@type': 'Brand',
          name: product.brand?.name || options.brandName,
        }
      : undefined;

  const rawDescription = product.shortDescription || product.description || '';
  const cleanDescription = rawDescription.replace(/<[^>]*>/g, '').trim();

  const images = (product.images || []).map((img) => img.url);

  let availabilityUri = 'https://schema.org/OutOfStock';
  if (product.inventory?.status === 'IN_STOCK') {
    availabilityUri = 'https://schema.org/InStock';
  } else if (product.inventory?.status === 'ON_BACKORDER') {
    availabilityUri = 'https://schema.org/PreOrder';
  }

  // Derive genuine decimal price from minor units only when price is defined
  let offer: Record<string, unknown> | undefined;
  if (product.price && typeof product.price.amount_minor === 'number') {
    const priceMinor = product.price.amount_minor;
    const currency = product.price.currency || 'MAD';
    const priceDecimal = (priceMinor / 100).toFixed(2);

    offer = {
      '@type': 'Offer',
      price: priceDecimal,
      priceCurrency: currency,
      availability: availabilityUri,
      url: options.canonicalUrl,
      itemCondition: 'https://schema.org/NewCondition',
    };
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: cleanDescription,
    image: images.length > 0 ? images : undefined,
    sku: product.sku || product.id,
    ...(offer ? { offers: offer } : {}),
  };


  if (brand) {
    schema.brand = brand;
  }

  return schema;
}

export interface CategoryJsonLdOptions {
  canonicalUrl: string;
  siteUrl: string;
}

/**
 * Builds Schema.org BreadcrumbList structured data for a Category page.
 */
export function buildCategoryJsonLd(
  category: { name: string; slug: string },
  options: CategoryJsonLdOptions
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: options.siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category.name,
        item: options.canonicalUrl,
      },
    ],
  };
}
