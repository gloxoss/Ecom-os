import { NextRequest, NextResponse } from 'next/server';
import { getEngine } from '@/lib/engine';
import { normalizeText } from '@/components/search/recent-searches';
import type { SuggestionGroups, Suggestion } from '@/components/search/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse<SuggestionGroups>> {
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const trimmed = q.trim();
  if (trimmed.length < 2) {
    return NextResponse.json({ products: [], categories: [], brands: [] });
  }

  const normalizedQuery = normalizeText(trimmed);

  try {
    const engine = await getEngine();
    // A failed product lookup must surface as unavailable (503), not an empty 200.
    const productResult = await engine.listProducts({
      search: trimmed,
      limit: 10,
    });

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
      // Ignored: category listing unavailable
    }

    return NextResponse.json({
      products,
      categories,
      brands: [],
    });
  } catch {
    // Upstream engine error: no invented products, and the status says search is
    // unavailable so callers can tell it apart from a genuinely empty result.
    return NextResponse.json(
      { products: [], categories: [], brands: [] },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
