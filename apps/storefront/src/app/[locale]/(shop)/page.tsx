import { getEngine } from '@/lib/engine';
import { PageSections } from '@/features/content/ui/page-sections';
import homeData from '@/features/landing/data/home.json';

export default async function HomePage() {
  const engine = await getEngine();
  const [{ items: products }, cmsSections] = await Promise.all([
    engine.listProducts({ limit: 12 }),
    typeof engine.getPageSections === 'function'
      ? engine.getPageSections('home').catch(() => null)
      : Promise.resolve(null),
  ]);

  return (
    <PageSections
      cmsSections={cmsSections}
      fallbackData={homeData}
      products={products}
    />
  );
}
