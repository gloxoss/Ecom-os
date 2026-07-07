import { HeroSection } from '@/features/landing/ui/hero-section';
import { ProductGrid } from '@/features/catalog/ui/product-grid';
import { getEngine } from '@/lib/engine';
import { getTranslations } from 'next-intl/server';

export const revalidate = 60;

export default async function HomePage() {
  const engine = await getEngine();
  const result = await engine.listProducts({ limit: 20 });
  const products = result.items;
  const t = await getTranslations('home');

  return (
    <main>
      <HeroSection />
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold tracking-tight mb-8">{t('featured')}</h2>
        <ProductGrid products={products} />
      </section>
    </main>
  );
}
