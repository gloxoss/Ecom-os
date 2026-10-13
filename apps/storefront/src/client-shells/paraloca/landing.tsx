import Link from 'next/link';
import { getEngine } from '@/lib/engine';
import { getActiveClientProfile } from '@/lib/client-profile';
import { isAddonActive } from '@/lib/addon-capabilities';
import { ProductGrid } from '@/features/catalog/ui/product-grid';

export async function ParalocaLanding() {
  const profile = getActiveClientProfile();
  const hero = profile.brand.hero;
  const engine = await getEngine();
  const [products, categories] = await Promise.all([
    engine.listProducts({ limit: 8 }).then((result) => result.items).catch(() => []),
    engine.listCategories().catch(() => []),
  ]);
  const showQuotes = isAddonActive('quotes');

  return (
    <main id="main-content" tabIndex={-1} className="focus:outline-none" data-testid="paraloca-landing">
      <section className="border-b border-border bg-muted">
        <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {hero?.headline ?? profile.brand.name}
          </h1>
          {hero?.subheadline ? (
            <p className="mt-5 max-w-2xl text-lg text-foreground/75">{hero.subheadline}</p>
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={hero?.ctaHref ?? '/catalog'}
              className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-background hover:bg-accent"
            >
              {hero?.ctaLabel ?? 'Voir le catalogue'}
            </Link>
            {showQuotes ? (
              <Link
                href="/devis"
                className="text-sm text-accent underline-offset-4 hover:underline"
                data-testid="pro-devis-link"
              >
                Espace professionnels de santé : demander un devis
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {categories.length > 0 ? (
        <section aria-labelledby="paraloca-categories" className="mx-auto max-w-[1320px] px-4 py-12 sm:px-6 lg:px-8">
          <h2 id="paraloca-categories" className="text-2xl font-semibold tracking-tight">
            Parcourir par catégorie
          </h2>
          <ul className="mt-5 flex flex-wrap gap-3">
            {categories.slice(0, 12).map((category) => (
              <li key={category.id}>
                <Link
                  href={`/catalog/${category.slug}`}
                  className="inline-block rounded-full border border-border px-4 py-2 text-sm hover:border-accent hover:text-accent"
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-labelledby="paraloca-featured" className="mx-auto max-w-[1320px] px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="paraloca-featured" className="text-2xl font-semibold tracking-tight">À la une</h2>
          <Link href="/catalog" className="text-sm text-accent underline-offset-4 hover:underline">
            Tout le catalogue
          </Link>
        </div>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <p className="rounded-lg border border-border p-8 text-center text-foreground/70">
            Le catalogue sera bientôt disponible.
          </p>
        )}
      </section>
    </main>
  );
}
