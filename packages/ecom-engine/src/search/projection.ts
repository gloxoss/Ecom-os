import type { Product, Variation } from '../types';
import type { SearchDocument, SearchVariationReference, ProductProjectionOptions } from './types';
import { sanitizeSearchDocument } from './sanitizer';

/**
 * Extracts safe public attributes from product and technical attributes.
 * Technical specs (volume, size, material, wattage) are preserved.
 * Private metadata is stripped.
 */
function extractSafeAttributes(product: Product): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {};

  if (Array.isArray(product.attributes)) {
    for (const attr of product.attributes) {
      if (attr.name && Array.isArray(attr.options) && attr.options.length > 0) {
        result[attr.name] = attr.options.length === 1 ? attr.options[0]! : attr.options;
      }
    }
  }

  if (Array.isArray(product.technicalAttributes)) {
    for (const tech of product.technicalAttributes) {
      if (tech.name && tech.value !== undefined && tech.value !== null) {
        result[tech.name] = tech.value;
      }
    }
  }

  return result;
}

/**
 * Maps variation attributes into a key-value record.
 */
function extractVariationAttributes(variation: Variation): Record<string, string> {
  const result: Record<string, string> = {};
  if (Array.isArray(variation.attributes)) {
    for (const attr of variation.attributes) {
      if (attr.name && attr.value) {
        result[attr.name] = String(attr.value);
      }
    }
  }
  return result;
}

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
 * Projects an authoritative Product into a normalized, public SearchDocument.
 *
 * Invariants:
 * - SKU exact-match priority data is preserved.
 * - Public prices are sourced strictly from Money (amount_minor, currency).
 * - Private customer, quote, RFQ, and token data are never included and fail-closed.
 */
export function projectProduct(
  product: Product,
  _options: ProductProjectionOptions = {}
): SearchDocument {
  const rawInput = product as unknown as Record<string, unknown>;
  for (const key of DISALLOWED_PRIVATE_KEYS) {
    if (key in rawInput && rawInput[key] !== undefined && rawInput[key] !== null) {
      throw new Error(`Security violation: private field "${key}" detected in product payload.`);
    }
  }

  const variationsSource = product.variations || product.variants || [];
  for (const v of variationsSource) {
    const rawV = v as unknown as Record<string, unknown>;
    for (const key of DISALLOWED_PRIVATE_KEYS) {
      if (key in rawV && rawV[key] !== undefined && rawV[key] !== null) {
        throw new Error(`Security violation: private field "${key}" detected in variation payload.`);
      }
    }
  }
  const variationRefs: SearchVariationReference[] = variationsSource.map((v) => {
    const isVarInStock = v.inventory
      ? v.inventory.status === 'IN_STOCK'
      : (v.stock_quantity ?? 0) > 0;
    return {
      id: v.id,
      ...(v.sku ? { sku: v.sku } : {}),
      ...(v.name ? { name: v.name } : {}),
      priceMinor: v.price.amount_minor,
      inStock: isVarInStock,
      attributes: extractVariationAttributes(v),
    };
  });

  const categories = product.categoryDetails && product.categoryDetails.length > 0
    ? product.categoryDetails.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      }))
    : (product.categories || []).map((slug) => ({
        id: slug,
        name: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
        slug,
      }));

  const brand = product.brand
    ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      }
    : undefined;

  const firstImage = product.images && product.images.length > 0 ? product.images[0] : undefined;
  const image = firstImage
    ? {
        url: firstImage.url,
        ...(firstImage.altText ? { alt: firstImage.altText } : {}),
      }
    : undefined;

  const inStock = product.inventory
    ? product.inventory.status === 'IN_STOCK'
    : true;

  const safeAttributes = extractSafeAttributes(product);

  const rawDocument: Record<string, unknown> = {
    id: product.id,
    slug: product.slug,
    title: product.name,
    description: product.description || product.shortDescription || '',
    ...(product.sku ? { sku: product.sku } : {}),
    priceMinor: product.price.amount_minor,
    currency: product.price.currency || 'MAD',
    categories,
    ...(brand ? { brand } : {}),
    inStock,
    ...(product.inventory?.status ? { availabilityStatus: product.inventory.status } : {}),
    ...(typeof product.inventory?.isPurchasable === 'boolean'
      ? { isPurchasable: product.inventory.isPurchasable }
      : { isPurchasable: true }),
    ...(Object.keys(safeAttributes).length > 0 ? { attributes: safeAttributes } : {}),
    ...(image ? { image } : {}),
    ...(firstImage ? { thumbnail: firstImage.url } : {}),
    ...(variationRefs.length > 0 ? { variations: variationRefs, variationCount: variationRefs.length } : {}),
  };

  return sanitizeSearchDocument(rawDocument);
}

/**
 * Projects a specific Product Variation into an independent SearchDocument.
 */
export function projectVariation(
  product: Product,
  variation: Variation,
  options: ProductProjectionOptions = {}
): SearchDocument {
  const isVarInStock = variation.inventory
    ? variation.inventory.status === 'IN_STOCK'
    : (variation.stock_quantity ?? 0) > 0;

  const parentDoc = projectProduct(product, options);

  const varImage = variation.image
    ? {
        url: variation.image.url,
        ...(variation.image.altText ? { alt: variation.image.altText } : {}),
      }
    : parentDoc.image;

  const varAttributes = {
    ...(parentDoc.attributes || {}),
    ...extractVariationAttributes(variation),
  };

  const rawDocument: Record<string, unknown> = {
    id: `${product.id}:${variation.id}`,
    parentId: product.id,
    isVariation: true,
    slug: `${product.slug}-${variation.slug || variation.id}`,
    title: `${product.name} - ${variation.name}`,
    description: product.shortDescription || product.description || '',
    sku: variation.sku || product.sku,
    priceMinor: variation.price.amount_minor,
    currency: variation.price.currency || parentDoc.currency,
    categories: parentDoc.categories,
    ...(parentDoc.brand ? { brand: parentDoc.brand } : {}),
    inStock: isVarInStock,
    availabilityStatus: variation.inventory?.status ?? (isVarInStock ? 'IN_STOCK' : 'OUT_OF_STOCK'),
    isPurchasable: variation.isPurchasable ?? true,
    ...(Object.keys(varAttributes).length > 0 ? { attributes: varAttributes } : {}),
    ...(varImage ? { image: varImage, thumbnail: varImage.url } : {}),
  };

  return sanitizeSearchDocument(rawDocument);
}

/**
 * Projects an entire catalog of products, with optional standalone variation documents.
 */
export function projectCatalog(
  products: Product[],
  options: ProductProjectionOptions = {}
): SearchDocument[] {
  const result: SearchDocument[] = [];

  for (const product of products) {
    result.push(projectProduct(product, options));

    if (options.includeVariationsAsSeparateDocuments) {
      const variations = product.variations || product.variants || [];
      for (const variation of variations) {
        result.push(projectVariation(product, variation, options));
      }
    }
  }

  return result;
}
