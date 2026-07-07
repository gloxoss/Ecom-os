import { Product, Category } from '@ecom-os/engine';

type WCImage = { sourceUrl: string; altText?: string };
type WCProduct = { databaseId: number; slug: string; name: string; description?: string; price?: string; image?: WCImage; reviewCount?: number; averageRating?: number; related?: { nodes: WCProduct[] } };
type WCCategory = { databaseId: number; slug: string; name: string };

function parsePrice(priceStr?: string | null): number {
  if (!priceStr) return 0;
  // WooCommerce GraphQL sometimes returns HTML: '<span ...>$199.00</span>'
  // or price ranges: '$199.00 – $299.00'. Strip tags, take first number.
  const stripped = priceStr.replace(/<[^>]+>/g, ' ');
  const match = stripped.match(/[\d]+(?:[.,]\d+)*/);
  if (!match) return 0;
  const num = parseFloat(match[0].replace(',', '.'));
  return isNaN(num) ? 0 : Math.round(num * 100);
}

export function mapProduct(raw: WCProduct): Product {
  return {
    id: String(raw.databaseId),
    slug: raw.slug,
    name: raw.name,
    description: raw.description || '',
    price: {
      amount_minor: parsePrice(raw.price),
      currency: 'USD',
    },
    images: raw.image ? [{ url: raw.image.sourceUrl, altText: raw.image.altText || '' }] : [],
    categories: [],
    reviewCount: raw.reviewCount,
    averageRating: raw.averageRating,
    relatedProducts: raw.related?.nodes?.map(r => ({
      id: String(r.databaseId),
      slug: r.slug,
      name: r.name,
      price: { amount_minor: parsePrice(r.price), currency: 'USD' },
      images: r.image ? [{ url: r.image.sourceUrl, altText: r.image.altText || '' }] : [],
    })) || [],
  };
}

export function mapCategory(raw: WCCategory): Category {
  return {
    id: String(raw.databaseId),
    slug: raw.slug,
    name: raw.name,
  };
}
