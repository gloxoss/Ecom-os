import { getEngine } from '@/lib/engine';
import { PageSections } from '@/features/content/ui/page-sections';
import homeData from '@/features/landing/data/home.json';
import { getClientShell } from '@/lib/client-shell';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const Landing = getClientShell().Landing;
  if (Landing) {
    const { locale } = await params;
    return <Landing locale={locale} />;
  }

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
