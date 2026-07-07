import { Product } from '@ecom-os/engine';
import { ProductGridAnimated } from './product-grid-client';
import { getTranslations } from 'next-intl/server';

// Server component wrapper — fetches translations on the server, then passes
// them down to the client component (which can't use async/await itself).
export async function ProductGrid({ products }: { products: Product[] }) {
  const t = await getTranslations('catalog');

  return <ProductGridAnimated products={products} emptyText={t('empty')} />;
}
