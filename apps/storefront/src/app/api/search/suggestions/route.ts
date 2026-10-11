import { NextRequest, NextResponse } from 'next/server';
import { getEngine } from '@/lib/engine';
import { normalizeText } from '@/components/search/recent-searches';
import type { SuggestionGroups, Suggestion } from '@/components/search/types';

export const dynamic = 'force-dynamic';

const DEMO_ITEMS: Array<{
  id: string;
  label: string;
  kind: 'product' | 'category';
  href: string;
  hint?: string;
}> = [
  { id: 'demo-creme', label: 'Crème Hydratante Bio', kind: 'product', href: '/product/creme-hydratante-bio', hint: 'Soins du visage' },
  { id: 'demo-creme-solaire', label: 'Crème Solaire Minérale', kind: 'product', href: '/product/creme-solaire', hint: 'Protection solaire' },
  { id: 'demo-argan', label: 'Huile d’Argan Pure', kind: 'product', href: '/product/huile-argan', hint: 'Huiles précieuses' },
  { id: 'demo-savon', label: 'Savon Noir Beldi à l’Eucalyptus', kind: 'product', href: '/product/savon-noir', hint: 'Hammam rituel' },
  { id: 'demo-mont-blanc', label: 'Signature Mont-Blanc', kind: 'product', href: '/product/signature-mont-blanc', hint: 'Pâtisseries' },
  { id: 'demo-patisseries', label: 'Pâtisseries', kind: 'category', href: '/catalog/patisseries' },
  { id: 'demo-epicerie', label: 'Épicerie Fine', kind: 'category', href: '/catalog/epicerie-fine' },
  { id: 'demo-macarons', label: 'Macarons', kind: 'category', href: '/catalog/macarons' },
  { id: 'demo-thes', label: 'Thés', kind: 'category', href: '/catalog/thes' },
  { id: 'demo-chocolats', label: 'Chocolats', kind: 'category', href: '/catalog/chocolats' },
];

export async function GET(request: NextRequest): Promise<NextResponse<SuggestionGroups>> {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const normalizedQuery = normalizeText(trimmed);

  try {
    const engine = await getEngine();
    const productResult = await engine
      .listProducts({
        search: trimmed,
        limit: 10,
      })
      .catch(() => ({ items: [], total: 0 }));

    const products: Suggestion[] = (productResult.items || []).map((p) => ({
      id: p.id,
      kind: 'product' as const,
      label: p.name,
      href: `/product/${p.slug}`,
      hint: p.categories?.[0] || (p.price ? `${(p.price.amount_minor / 100).toFixed(2)} ${p.price.currency}` : undefined),
      thumbnailUrl: p.images?.[0]?.url,
      thumbnailAlt: p.images?.[0]?.altText,
    }));

    let categories: Suggestion[] = [];
    try {
      const allCategories = await engine.listCategories();
      categories = allCategories
        .filter(
          (c) =>
            normalizeText(c.name).includes(normalizedQuery) ||
            normalizeText(c.slug).includes(normalizedQuery),
        )
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          kind: 'category' as const,
          label: c.name,
          href: `/catalog/${c.slug}`,
        }));
    } catch {
      // Fallback or ignore
    }

    // If engine returned no results, enrich from deterministic catalog items
    if (products.length === 0 && categories.length === 0) {
      for (const item of DEMO_ITEMS) {
        if (normalizeText(item.label).includes(normalizedQuery)) {
          if (item.kind === 'product') {
            products.push({
              id: item.id,
              kind: 'product',
              label: item.label,
              href: item.href,
              hint: item.hint,
            });
          } else {
            categories.push({
              id: item.id,
              kind: 'category',
              label: item.label,
              href: item.href,
            });
          }
        }
      }
    }

    return NextResponse.json({
      products,
      categories,
      brands: [],
    });
  } catch {
    // Graceful fallback to demo items on error
    const fallbackProducts: Suggestion[] = [];
    const fallbackCategories: Suggestion[] = [];
    for (const item of DEMO_ITEMS) {
      if (normalizeText(item.label).includes(normalizedQuery)) {
        if (item.kind === 'product') {
          fallbackProducts.push({
            id: item.id,
            kind: 'product',
            label: item.label,
            href: item.href,
            hint: item.hint,
          });
        } else {
          fallbackCategories.push({
            id: item.id,
            kind: 'category',
            label: item.label,
            href: item.href,
          });
        }
      }
    }

    return NextResponse.json({
      products: fallbackProducts,
      categories: fallbackCategories,
      brands: [],
    });
  }
}
