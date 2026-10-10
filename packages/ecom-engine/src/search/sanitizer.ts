import { SearchDocument } from './types';

const DISALLOWED_PRIVATE_KEYS = [
  'customer',
  'customerId',
  'email',
  'customerEmail',
  'password',
  'token',
  'cartToken',
  'sessionToken',
  'orderKey',
  'quoteSecret',
  'quoteId',
  'quote',
  'quotes',
  'rfq',
  'rfqId',
  'billing',
  'shipping',
  'phone',
  'ipAddress',
  'cost',
  'margin',
  'wholesaleSecret',
];

/**
 * Validates and sanitizes a candidate product document before indexation.
 * Invariant: Index public fields only. Never index customers, quotes, orders, or private tokens.
 */
export function sanitizeSearchDocument(doc: Record<string, unknown>): SearchDocument {
  // Guard against accidental private payload leakage
  for (const key of DISALLOWED_PRIVATE_KEYS) {
    if (key in doc && doc[key] !== undefined && doc[key] !== null) {
      throw new Error(`Security violation: private field "${key}" detected in search document payload.`);
    }
  }

  if (!doc.id || typeof doc.id !== 'string') {
    throw new Error('Search document requires a non-empty string "id".');
  }
  if (!doc.slug || typeof doc.slug !== 'string') {
    throw new Error('Search document requires a non-empty string "slug".');
  }
  if (!doc.title || typeof doc.title !== 'string') {
    throw new Error('Search document requires a non-empty string "title".');
  }
  if (typeof doc.priceMinor !== 'number' || isNaN(doc.priceMinor)) {
    throw new Error('Search document requires a valid numeric "priceMinor".');
  }

  const categories = Array.isArray(doc.categories)
    ? (doc.categories as Array<{ id?: string; name?: string; slug?: string }>)
        .filter((c) => c && typeof c === 'object')
        .map((c) => ({
          id: String(c.id || ''),
          name: String(c.name || ''),
          slug: String(c.slug || ''),
        }))
    : [];

  const brand =
    doc.brand && typeof doc.brand === 'object'
      ? {
          id: String((doc.brand as { id?: string }).id || ''),
          name: String((doc.brand as { name?: string }).name || ''),
          slug: String((doc.brand as { slug?: string }).slug || ''),
        }
      : undefined;

  const image =
    doc.image && typeof doc.image === 'object'
      ? {
          url: String((doc.image as { url?: string }).url || ''),
          alt: (doc.image as { alt?: string }).alt ? String((doc.image as { alt?: string }).alt) : undefined,
        }
      : undefined;

  const thumbnail = doc.thumbnail
    ? String(doc.thumbnail)
    : image?.url
    ? image.url
    : undefined;

  return {
    id: String(doc.id),
    slug: String(doc.slug),
    title: String(doc.title),
    description: String(doc.description || ''),
    ...(doc.sku ? { sku: String(doc.sku) } : {}),
    priceMinor: doc.priceMinor,
    currency: String(doc.currency || 'MAD'),
    ...(brand ? { brand } : {}),
    categories,
    inStock: Boolean(doc.inStock),
    ...(doc.attributes ? { attributes: doc.attributes as Record<string, string | string[]> } : {}),
    ...(Array.isArray(doc.tags) ? { tags: (doc.tags as string[]).map(String) } : {}),
    ...(image ? { image } : {}),
    ...(thumbnail ? { thumbnail } : {}),
    ...(doc.createdAt ? { createdAt: String(doc.createdAt) } : {}),
    ...(doc.parentId ? { parentId: String(doc.parentId) } : {}),
    ...(typeof doc.isVariation === 'boolean' ? { isVariation: doc.isVariation } : {}),
    ...(typeof doc.variationCount === 'number' ? { variationCount: doc.variationCount } : {}),
    ...(Array.isArray(doc.variations) ? { variations: doc.variations as SearchDocument['variations'] } : {}),
    ...(doc.availabilityStatus ? { availabilityStatus: doc.availabilityStatus as SearchDocument['availabilityStatus'] } : {}),
    ...(typeof doc.isPurchasable === 'boolean' ? { isPurchasable: doc.isPurchasable } : {}),
  };
}

