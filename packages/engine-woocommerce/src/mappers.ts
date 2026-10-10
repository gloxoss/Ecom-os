import {
  Product,
  Category,
  Variation,
  InventoryAvailability,
  StockStatus,
  Media,
  ProductType,
  RelatedProductReference,
  Money,
  Brand,
} from '@ecom-os/engine';
import { parseRawMoney } from './money';

export type WCImage = {
  sourceUrl: string;
  altText?: string | null;
  title?: string | null;
};

export type WCBrand = {
  databaseId?: number;
  id?: string | number;
  slug: string;
  name: string;
  description?: string | null;
  websiteUrl?: string | null;
  isOwned?: boolean | null;
  count?: number | null;
  image?: WCImage | null;
};

export type WCCategory = {
  databaseId: number;
  id?: string;
  slug: string;
  name: string;
  description?: string | null;
  count?: number | null;
  parentDatabaseId?: number | null;
  parent?: { node?: { databaseId: number; slug: string; name: string } } | null;
  image?: WCImage | null;
};

export type WCAttributeNode = {
  name: string;
  value: string;
  label?: string | null;
};

export type WCVariation = {
  databaseId: number;
  sku?: string | null;
  name?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
  stockQuantity?: number | null;
  image?: WCImage | null;
  attributes?: { nodes?: WCAttributeNode[] } | null;
};

export type WCRelatedProduct = {
  databaseId: number;
  slug: string;
  name: string;
  price?: string | null;
  image?: WCImage | null;
};

export type WCProduct = {
  databaseId: number;
  id?: string;
  slug: string;
  name: string;
  sku?: string | null;
  __typename?: string;
  description?: string | null;
  shortDescription?: string | null;
  price?: string | null;
  regularPrice?: string | null;
  salePrice?: string | null;
  stockStatus?: string | null;
  stockQuantity?: number | null;
  image?: WCImage | null;
  galleryImages?: { nodes?: WCImage[] } | null;
  productCategories?: { nodes?: WCCategory[] } | null;
  variations?: { nodes?: WCVariation[] } | null;
  related?: { nodes?: WCRelatedProduct[] } | null;
  brands?: WCBrand[] | null;
  productBrands?: { nodes?: WCBrand[] } | null;
  reviewCount?: number;
  averageRating?: number;
};

export function mapStockStatus(rawStatus?: string | null): StockStatus {
  if (!rawStatus) return 'OUT_OF_STOCK';
  const norm = rawStatus.toUpperCase().replace(/\s+/g, '_');
  if (norm === 'IN_STOCK' || norm === 'INSTOCK') return 'IN_STOCK';
  if (norm === 'ON_BACKORDER' || norm === 'ONBACKORDER') return 'ON_BACKORDER';
  return 'OUT_OF_STOCK';
}

export function mapInventory(raw: { stockStatus?: string | null; stockQuantity?: number | null }): InventoryAvailability {
  const status = mapStockStatus(raw.stockStatus);
  const qty = typeof raw.stockQuantity === 'number' && Number.isFinite(raw.stockQuantity) ? raw.stockQuantity : null;
  return {
    status,
    quantity: qty,
    backordersAllowed: status === 'ON_BACKORDER',
    lowStockThreshold: null,
    isPurchasable: status !== 'OUT_OF_STOCK',
  };
}

export function mapImages(image?: WCImage | null, galleryImages?: { nodes?: WCImage[] } | null): Media[] {
  const mediaList: Media[] = [];
  const seenUrls = new Set<string>();

  if (image?.sourceUrl) {
    seenUrls.add(image.sourceUrl);
    const media: Media = {
      url: image.sourceUrl,
      altText: image.altText || '',
    };
    if (image.title) {
      media.title = image.title;
    }
    mediaList.push(media);
  }

  if (galleryImages?.nodes && Array.isArray(galleryImages.nodes)) {
    for (const g of galleryImages.nodes) {
      if (g?.sourceUrl && !seenUrls.has(g.sourceUrl)) {
        seenUrls.add(g.sourceUrl);
        const media: Media = {
          url: g.sourceUrl,
          altText: g.altText || '',
        };
        if (g.title) {
          media.title = g.title;
        }
        mediaList.push(media);
      }
    }
  }

  return mediaList;
}

export function mapVariations(rawVariations: WCVariation[] | undefined | null, currency: string): Variation[] {
  if (!rawVariations || !Array.isArray(rawVariations)) return [];
  return rawVariations.map((v) => {
    const inv = mapInventory(v);
    const variation: Variation = {
      id: String(v.databaseId),
      sku: v.sku || '',
      name: v.name || '',
      price: parseRawMoney(v.price, currency),
      inventory: inv,
      stock_quantity: inv.quantity,
      attributes: (v.attributes?.nodes || []).map((a) => ({
        name: a.name || '',
        value: a.value || '',
        label: a.label || a.name || '',
      })),
      isPurchasable: inv.isPurchasable,
    };
    if (v.regularPrice) {
      variation.regularPrice = parseRawMoney(v.regularPrice, currency);
    }
    if (v.salePrice) {
      variation.salePrice = parseRawMoney(v.salePrice, currency);
    }
    if (v.image?.sourceUrl) {
      const img: Media = {
        url: v.image.sourceUrl,
        altText: v.image.altText || '',
      };
      if (v.image.title) {
        img.title = v.image.title;
      }
      variation.image = img;
    }
    return variation;
  });
}

export function mapCategory(raw: WCCategory): Category {
  const parentId = raw.parentDatabaseId
    ? String(raw.parentDatabaseId)
    : raw.parent?.node?.databaseId
    ? String(raw.parent.node.databaseId)
    : null;
  const category: Category = {
    id: String(raw.databaseId),
    slug: raw.slug,
    name: raw.name,
    parentId,
  };
  if (raw.description) {
    category.description = raw.description;
  }
  if (typeof raw.count === 'number') {
    category.count = raw.count;
  }
  if (raw.image?.sourceUrl) {
    const img: Media = {
      url: raw.image.sourceUrl,
      altText: raw.image.altText || '',
    };
    if (raw.image.title) {
      img.title = raw.image.title;
    }
    category.image = img;
  }
  return category;
}

export function mapBrand(raw: WCBrand): Brand {
  const brand: Brand = {
    id: String(raw.databaseId ?? raw.id ?? raw.slug),
    slug: raw.slug,
    name: raw.name,
  };
  if (raw.description) {
    brand.description = raw.description;
  }
  if (raw.websiteUrl) {
    brand.websiteUrl = raw.websiteUrl;
  }
  if (typeof raw.isOwned === 'boolean') {
    brand.isOwned = raw.isOwned;
  }
  if (raw.image?.sourceUrl) {
    brand.logo = {
      url: raw.image.sourceUrl,
      altText: raw.image.altText || raw.name,
    };
  }
  return brand;
}

export function buildCategoryTree(flatCategories: Category[]): Category[] {
  const map = new Map<string, Category>();
  const listWithChildren: Category[] = [];

  for (const cat of flatCategories) {
    const copy = { ...cat, children: [] as Category[] };
    map.set(cat.id, copy);
    listWithChildren.push(copy);
  }

  for (const cat of listWithChildren) {
    if (cat.parentId && map.has(cat.parentId)) {
      map.get(cat.parentId)!.children!.push(cat);
    }
  }

  return listWithChildren;
}

export function mapProduct(raw: WCProduct, currency: string): Product {
  const images = mapImages(raw.image, raw.galleryImages);
  const variations = mapVariations(raw.variations?.nodes, currency);
  const inv = mapInventory(raw);

  let type: ProductType = 'simple';
  if (raw.__typename === 'VariableProduct' || variations.length > 0) {
    type = 'variable';
  } else if (raw.__typename === 'ExternalProduct') {
    type = 'external';
  } else if (raw.__typename === 'GroupedProduct') {
    type = 'grouped';
  }

  let priceRange: { min: Money; max: Money } | undefined;
  if (variations.length > 0) {
    const amounts = variations.map((v) => v.price.amount_minor);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    priceRange = {
      min: { amount_minor: minAmount, currency },
      max: { amount_minor: maxAmount, currency },
    };
  }

  const rawCats = raw.productCategories?.nodes || [];
  const categorySlugs = rawCats.map((c) => c.slug);
  const categoryDetails = rawCats.map(mapCategory);

  const relatedProducts: RelatedProductReference[] = (raw.related?.nodes || []).map((r) => ({
    id: String(r.databaseId),
    slug: r.slug,
    name: r.name,
    price: parseRawMoney(r.price, currency),
    images: r.image ? [{ url: r.image.sourceUrl, altText: r.image.altText || '' }] : [],
  }));

  const product: Product = {
    id: String(raw.databaseId),
    slug: raw.slug,
    name: raw.name,
    type,
    description: raw.description || '',
    price: parseRawMoney(raw.price, currency),
    inventory: inv,
    images,
    categories: categorySlugs,
    categoryDetails,
    relatedProducts,
    isPurchasable: inv.isPurchasable,
  };

  if (raw.sku) {
    product.sku = raw.sku;
  }
  if (raw.shortDescription) {
    product.shortDescription = raw.shortDescription;
  }
  if (raw.regularPrice) {
    product.regularPrice = parseRawMoney(raw.regularPrice, currency);
  }
  if (raw.salePrice) {
    product.salePrice = parseRawMoney(raw.salePrice, currency);
  }
  if (priceRange) {
    product.priceRange = priceRange;
  }
  if (variations.length > 0) {
    product.variants = variations;
    product.variations = variations;
  }
  if (typeof raw.reviewCount === 'number') {
    product.reviewCount = raw.reviewCount;
  }
  if (typeof raw.averageRating === 'number') {
    product.averageRating = raw.averageRating;
  }

  const rawBrand = (raw.productBrands?.nodes && raw.productBrands.nodes[0]) || (raw.brands && raw.brands[0]);
  if (rawBrand) {
    product.brand = mapBrand(rawBrand);
  }

  return product;
}
