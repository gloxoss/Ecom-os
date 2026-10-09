import { Product, Category } from '@ecom-os/engine';
import { parseRawMoney } from './money';

type WCImage = { sourceUrl: string; altText?: string };
type WCProduct = { databaseId: number; slug: string; name: string; description?: string; price?: string; image?: WCImage; reviewCount?: number; averageRating?: number; related?: { nodes: WCProduct[] } };
type WCCategory = { databaseId: number; slug: string; name: string };

export function mapProduct(raw: WCProduct, currency: string): Product {
  return {
    id: String(raw.databaseId),
    slug: raw.slug,
    name: raw.name,
    description: raw.description || '',
    price: parseRawMoney(raw.price, currency),
    images: raw.image ? [{ url: raw.image.sourceUrl, altText: raw.image.altText || '' }] : [],
    categories: [],
    ...(raw.reviewCount !== undefined ? { reviewCount: raw.reviewCount } : {}),
    ...(raw.averageRating !== undefined ? { averageRating: raw.averageRating } : {}),
    relatedProducts: raw.related?.nodes?.map(r => ({
      id: String(r.databaseId),
      slug: r.slug,
      name: r.name,
      price: parseRawMoney(r.price, currency),
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
