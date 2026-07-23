// MOCK — replaced by the real @/lib/engine at merge. Keep signatures identical.
import type {
  Product, Category, ProductListQuery, ProductListResult,
  ShippingMethod, CouponResult, StoreCapabilities, Money,
} from './ecom-types';

const usd = (amount_minor: number): Money => ({ amount_minor, currency: 'USD' });

const img = (file: string, altText: string) => ({ url: `/assets/beano/${file}`, altText });
const angelinaImg = (file: string, altText: string) => ({ url: `/assets/angelina/${file}`, altText });

const coffee = (
  i: number,
  slug: string,
  name: string,
  notes: string,
  amount_minor: number,
  weight: string,
  category: string,
  productImage: string,
  hoverImage: string,
): Product => ({
  id: `p-${i}`,
  slug,
  name,
  description: notes,
  price: usd(amount_minor),
  images: [
    productImage.startsWith('product-') ? angelinaImg(productImage, name) : img(productImage, name),
    hoverImage.startsWith('product-') ? angelinaImg(hoverImage, `${name} lifestyle image`) : img(hoverImage, `${name} lifestyle image`),
  ],
  categories: [category],
  variants: [{ id: `v-${i}`, sku: `SKU-${slug}`, name: weight, price: usd(amount_minor), stock_quantity: null }],
  reviewCount: 12 + i,
  averageRating: 4.5,
});

const PRODUCTS: Product[] = [
  coffee(1, 'hot-chocolate-mix', 'Hot Chocolate Mix', 'Velvety cocoa, Whipped cream, Parisian classic', 1900, '250g', 'epicerie-fine',
    'product-hot-chocolate-mix.webp', 'product-hot-chocolate-cup-lifestyle.webp'),
  coffee(2, 'signature-mont-blanc', 'Signature Mont-Blanc', 'Chestnut cream, Meringue, Whipped cream', 2200, '1 piece', 'patisseries',
    'product-mont-blanc.webp', 'product-mont-blanc-lifestyle.webp'),
  coffee(3, 'macaron-gift-box', 'Macaron Gift Box', 'Rose, Chocolate, Pistachio, Raspberry', 1400, 'Box of 12', 'macarons',
    'product-macaron-box.webp', 'product-macaron-roses-lifestyle.webp'),
  coffee(4, 'dark-chocolate-crispy-crepes', 'Dark Chocolate Crispy Crepes', 'Crispy crepe, Dark chocolate, Delicate crunch', 2500, '180g', 'epicerie-fine',
    'product-crispy-crepes.webp', 'product-crispy-crepes-lifestyle.webp'),
  coffee(5, 'mini-giandujas', 'Mini Giandujas', 'Hazelnut chocolate, Gold wrap, Gift tin', 2800, '120g', 'chocolats',
    'product-mini-giandujas.webp', 'product-mini-giandujas-lifestyle.webp'),
  coffee(6, 'salted-butter-caramels', 'Salted Butter Caramels', 'Butter caramel, Sea salt, Soft vanilla finish', 2300, '160g', 'epicerie-fine',
    'product-caramels.webp', 'product-caramels-gift-lifestyle.webp'),
  coffee(7, 'parisian-heart-praline-box', 'Parisian Heart Praline Box', 'Praline, Milk chocolate, Gift box', 2700, 'Box of 16', 'chocolats',
    'product-heart-praline-box.webp', 'product-praline-box-lifestyle.webp'),
  coffee(8, 'discovery-tea-box', 'Discovery Tea Box', 'Oolong, Black tea, Delicate florals', 1800, '20 sachets', 'thes',
    'product-discovery-tea-box.webp', 'product-tea-service-lifestyle.webp'),
  coffee(9, 'french-chestnut-spread', 'French Chestnut Spread', 'Chestnut cream, Vanilla, Toasted brioche', 2100, '220g', 'epicerie-fine',
    'product-chestnut-spread.webp', 'product-chestnut-toast-lifestyle.webp'),
  coffee(10, 'oolong-loose-tea-tin', 'Oolong Loose Tea Tin', 'Oolong tea, Soft florals, Elegant tin', 3200, '100g', 'thes',
    'product-oolong-tea-tin.webp', 'product-oolong-tea-lifestyle.webp'),
  coffee(11, 'assorted-chocolates-box', 'Assorted Chocolates Box', 'Pralines, Ganache, Dark chocolate', 2700, 'Box of 24', 'chocolats',
    'product-assorted-chocolates.webp', 'product-chocolate-box-lifestyle.webp'),
  coffee(12, 'breakfast-patisserie-set', 'Breakfast Patisserie Set', 'Croissant, Brioche, Jam, Tea-room morning', 2900, 'Set for 2', 'patisseries',
    'product-breakfast-set.webp', 'product-breakfast-salon-lifestyle.webp'),
];

const CATEGORIES: Category[] = [
  { id: 'c-1', slug: 'patisseries', name: 'Pâtisseries' },
  { id: 'c-2', slug: 'epicerie-fine', name: 'Épicerie Fine' },
  { id: 'c-3', slug: 'macarons', name: 'Macarons' },
  { id: 'c-4', slug: 'thes', name: 'Thés' },
  { id: 'c-5', slug: 'chocolats', name: 'Chocolats' },
  { id: 'c-6', slug: 'cadeaux', name: 'Cadeaux' },
];

export async function getEngine() {
  return {
    async listProducts(q: ProductListQuery = {}): Promise<ProductListResult> {
      let items = PRODUCTS;
      if (q.category) items = items.filter((p) => p.categories.includes(q.category!));
      if (q.search) items = items.filter((p) => p.name.toLowerCase().includes(q.search!.toLowerCase()));
      if (q.sort === 'price_asc') items = [...items].sort((a, b) => a.price.amount_minor - b.price.amount_minor);
      if (q.sort === 'price_desc') items = [...items].sort((a, b) => b.price.amount_minor - a.price.amount_minor);
      const offset = q.offset ?? 0;
      return { items: items.slice(offset, offset + (q.limit ?? 12)), total: items.length };
    },
    async getProduct(slug: string): Promise<Product | null> {
      return PRODUCTS.find((p) => p.slug === slug) ?? null;
    },
    async listCategories(): Promise<Category[]> {
      return CATEGORIES;
    },
    async listShippingMethods(): Promise<ShippingMethod[]> {
      return [
        { id: 'standard', title: 'Standard', cost: usd(500), description: '3–5 days' },
        { id: 'express', title: 'Express', cost: usd(1500), description: '1–2 days' },
      ];
    },
    async applyCoupon(_cartId: string, code: string): Promise<CouponResult> {
      return code === 'WELCOME10'
        ? { ok: true, discount: usd(1000), description: '10 off' }
        : { ok: false, error: 'invalid' };
    },
    async getCapabilities(): Promise<StoreCapabilities> {
      return { couponsEnabled: true, loyaltyEnabled: true, guestCheckout: true, multiCurrency: false, version: 'mock' };
    },
  };
}
