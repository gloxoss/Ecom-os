import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { AddToCart } from '@/features/cart/ui/add-to-cart';
import { Breadcrumb } from '@/features/catalog/ui/breadcrumb';
import { ProductGrid } from '@/features/catalog/ui/product-grid';

export async function generateStaticParams() {
  const engine = await getEngine();
  const result = await engine.listProducts({ limit: 100 });
  return result.items.map(p => ({ slug: p.slug }));
}

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const engine = await getEngine();
  
  let product = null;
  try {
    product = await engine.getProduct(slug);
  } catch {
    notFound();
  }

  if (!product) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images.map(i => i.url),
    description: product.description.replace(/<[^>]+>/g, ''), // strip html
    offers: {
      '@type': 'Offer',
      price: (product.price.amount_minor / 100).toFixed(2),
      priceCurrency: product.price.currency,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-2 gap-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden">
        {product.images[0] && (
          <Image 
            src={product.images[0].url} 
            alt={product.images[0].altText || product.name}
            fill 
            className="object-cover" 
          />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <Breadcrumb crumbs={[
          { label: 'Home', href: '/' },
          { label: 'Catalog', href: '/catalog' },
          { label: product.name },
        ]} />
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{product.name}</h1>
        {product.reviewCount !== undefined && product.reviewCount > 0 && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <span className="text-yellow-500">★ {product.averageRating?.toFixed(1)}</span>
            <span className="text-secondary">({product.reviewCount} reviews)</span>
          </div>
        )}
        <p className="text-2xl text-secondary mb-8">${(product.price.amount_minor / 100).toFixed(2)}</p>
        <div className="text-lg text-foreground/80 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: product.description }} />
        <AddToCart product={product} />
      </div>

      {product.relatedProducts && product.relatedProducts.length > 0 && (
        <div className="col-span-1 md:col-span-2 mt-16 pt-16 border-t border-foreground/10">
          <h2 className="text-3xl font-bold mb-8">Related Products</h2>
          <ProductGrid products={product.relatedProducts as any} />
        </div>
      )}
    </main>
  );
}
