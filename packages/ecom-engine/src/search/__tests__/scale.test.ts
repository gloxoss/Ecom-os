import { describe, it, expect } from 'vitest';
import {
  NativeWooSearchProvider,
  SearchSyncManager,
  sanitizeSearchDocument,
  normalizeText,
  computeRelevanceScore,
  allowsTypoCorrection,
  type SearchDocument,
  type SearchProvider,
  type SearchQuery,
  type SearchResult,
  type IndexSyncResult,
} from '../index';
import type { Product } from '../../types';

/**
 * ECO-1211: catalog scale and search freshness acceptance at the provider
 * level. Staging holds 2 fixture products, so 100-product scale, 110-category
 * breadth, a 60-variation product, and sync freshness are proven here against
 * a deterministic 120-document synthetic corpus through the same provider
 * contract the storefront uses. Live traversal of a 100-product staging
 * catalog remains a fixture-scale task (php-staging scope), covered by the
 * gated e2e spec, not invented here.
 */

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASES = [
  'Crème Hydratante',
  'Huile d\u2019Argan',
  'Savon Noir Beldi',
  'Théière Artisanale',
  'Coffret Rituel Hammam',
  'Parfum Fleur d\u2019Oranger',
  'Tapis Berbère',
  'Lanterne Ciselée',
  'Caftan Brodé',
  'Babouche Cuir',
  'Crème Solaire Minérale',
  'Masque Rhassoul',
];
const MODIFIERS = ['Bio', 'de Fès', 'Artisanal', 'Pure', 'Traditionnel', 'du Terroir', 'Royal', 'Fes Export'];
const BRANDS = [
  { id: 'brand-0', name: 'Dar Botanica', slug: 'dar-botanica' },
  { id: 'brand-1', name: 'Atlas Pure', slug: 'atlas-pure' },
  { id: 'brand-2', name: 'Maison Fès', slug: 'maison-fes' },
  { id: 'brand-3', name: 'Terroir du Maroc', slug: 'terroir-du-maroc' },
  { id: 'brand-4', name: 'Sahara & Co', slug: 'sahara-co' },
  { id: 'brand-5', name: 'Atelier Médina', slug: 'atelier-medina' },
];

function buildCorpus(): SearchDocument[] {
  const rand = mulberry32(20261011);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)] as T;
  const docs: SearchDocument[] = [];
  for (let i = 0; i < 120; i += 1) {
    const base = pick(BASES);
    const mod = pick(MODIFIERS);
    const brand = pick(BRANDS);
    // Two categories per document on a stride that covers all 110 exactly.
    const categories = [0, 1].map((k) => {
      const n = (i * 2 + k) % 110;
      const name = n % 10 === 0 ? `Catégorie Spéciale ${n}` : `Category ${n}`;
      return { id: `cat-${n}`, name, slug: `category-${n}` };
    });
    const isVariable = i % 3 === 0;
    const variationTotal = i === 0 ? 60 : isVariable ? 2 + Math.floor(rand() * 3) : 0;
    const sku = `ECOMOS-SCALE-${1000 + i}`;
    const raw: Record<string, unknown> = {
      id: `scale-${i}`,
      slug: `scale-product-${i}`,
      title: `${base} ${mod} ${i}`,
      description: `Descriptif artisanal ${base} numéro ${i}, fait à Fès`,
      sku,
      priceMinor: 1000 + Math.floor(rand() * 90000),
      currency: 'MAD',
      brand: { ...brand },
      categories,
      inStock: rand() > 0.2,
      tags: ['terroir', 'maroc', mod.toLowerCase()],
      attributes: { couleur: i % 2 === 0 ? 'crème' : 'noir', taille: 'M' },
      createdAt: new Date(Date.UTC(2026, i % 12, (i % 27) + 1)).toISOString(),
      ...(variationTotal > 0
        ? {
            variationCount: variationTotal,
            variations: Array.from({ length: variationTotal }, (_, k) => ({
              id: `scale-${i}-v${k}`,
              sku: `${sku}-V${k}`,
              name: `${base} ${mod} ${i} variante ${k}`,
              priceMinor: 1000 + k * 100,
              inStock: k % 3 !== 0,
              attributes: { taille: k % 2 === 0 ? 'S' : 'M' },
            })),
          }
        : {}),
    };
    docs.push(sanitizeSearchDocument(raw));
  }
  return docs;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)] as number;
}

describe('Catalog scale and search freshness (ECO-1211)', () => {
  it('ingests a 120-document mixed corpus with 110 categories intact', async () => {
    const provider = new NativeWooSearchProvider();
    const result = await provider.sync(buildCorpus());
    expect(result.indexed).toBe(120);
    const health = await provider.health();
    expect(health.documentCount).toBe(120);
    expect(health.status).toBe('healthy');
    const facets = await provider.search({ term: '', pageSize: 1, facets: ['categories'] });
    expect(Object.keys(facets.facets?.categories?.counts ?? {}).length).toBeGreaterThanOrEqual(100);
  });

  it('ranks an exact SKU first and resolves variation SKUs to the parent', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const exact = await provider.search({ term: 'ECOMOS-SCALE-1042', pageSize: 10 });
    expect(exact.total).toBe(1);
    expect(exact.items[0]?.id).toBe('scale-42');
    expect(exact.items[0]?.sku).toBe('ECOMOS-SCALE-1042');

    const byVariation = await provider.search({ term: 'ECOMOS-SCALE-1000-V7', pageSize: 10 });
    expect(byVariation.items[0]?.id).toBe('scale-0');
    expect(byVariation.items[0]?.variations?.length).toBe(60);
  });

  it('folds French accents both directions without false technical hijack', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const folded = await provider.search({ term: 'creme', pageSize: 100 });
    expect(folded.total).toBeGreaterThan(0);
    expect(folded.items.some((d) => d.title.includes('Crème'))).toBe(true);

    const accented = await provider.search({ term: 'Fès', pageSize: 100 });
    expect(accented.total).toBeGreaterThan(0);

    // Technical identifiers must never fuzzy-match the wrong item.
    expect(allowsTypoCorrection('creme')).toBe(true);
    expect(allowsTypoCorrection('ECOMOS-SCALE-1042')).toBe(false);
    const skuDoc = (await provider.search({ term: 'ECOMOS-SCALE-1042', pageSize: 5 })).items[0];
    expect(skuDoc).toBeDefined();
    if (skuDoc) {
      expect(computeRelevanceScore(skuDoc, 'ECOMOS-SCALE-1042').matchType).toBe('exact_sku');
    }
    // The native provider has no fuzzy engine: a true typo matches nothing
    // rather than the wrong product. Typo tolerance is provider-side
    // (Meilisearch/Typesense) and is not claimed here.
    expect(normalizeText('Crème')).toBe('creme');
    const typo = await provider.search({ term: 'cremme', pageSize: 100 });
    expect(typo.total).toBe(0);
  });

  it('pages beyond 20 with stable, non-repeating, complete traversal', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const seen = new Set<string>();
    const totalPages = 6;
    for (let page = 1; page <= totalPages; page += 1) {
      const res = await provider.search({ term: '', page, pageSize: 20 });
      expect(res.page).toBe(page);
      expect(res.total).toBe(120);
      expect(res.totalPages).toBe(6);
      expect(res.items).toHaveLength(20);
      for (const item of res.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
    expect(seen.size).toBe(120);
    const again = await provider.search({ term: '', page: 2, pageSize: 20 });
    const second = await provider.search({ term: '', page: 2, pageSize: 20 });
    expect(again.items.map((d) => d.id)).toEqual(second.items.map((d) => d.id));
  });

  it('applies combined filters and sorts truthfully', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const res = await provider.search({
      term: '',
      categorySlug: 'category-4',
      inStockOnly: true,
      minPriceMinor: 0,
      maxPriceMinor: 100000,
      sort: 'price_asc',
      pageSize: 100,
    });
    expect(res.total).toBeGreaterThan(0);
    for (const item of res.items) {
      expect(item.categories.some((c) => c.slug === 'category-4')).toBe(true);
      expect(item.inStock).toBe(true);
      expect(item.priceMinor).toBeGreaterThanOrEqual(0);
      expect(item.priceMinor).toBeLessThanOrEqual(100000);
    }
    const prices = res.items.map((d) => d.priceMinor);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);

    const desc = await provider.search({ term: '', sort: 'price_desc', pageSize: 100 });
    const descPrices = desc.items.map((d) => d.priceMinor);
    expect([...descPrices].sort((a, b) => b - a)).toEqual(descPrices);
  });

  it('synchronizes updates and deletes, then retries failures into a rebuild', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const updated = await provider.search({ term: 'ECOMOS-SCALE-1005', pageSize: 1 });
    const doc = updated.items[0];
    if (!doc) throw new Error('scale fixture missing');
    await provider.sync([{ ...doc, priceMinor: doc.priceMinor + 100, inStock: false }]);
    const reread = await provider.search({ term: 'ECOMOS-SCALE-1005', pageSize: 1 });
    expect(reread.items[0]?.priceMinor).toBe(doc.priceMinor + 100);
    expect(reread.items[0]?.inStock).toBe(false);

    await provider.delete([doc.id]);
    expect((await provider.search({ term: 'ECOMOS-SCALE-1005', pageSize: 1 })).total).toBe(0);
    expect((await provider.health()).documentCount).toBe(119);

    let calls = 0;
    const flaky: SearchProvider = {
      name: 'flaky',
      search: (q: SearchQuery) => provider.search(q),
      suggest: (t: string, l?: number) => provider.suggest(t, l),
      health: () => provider.health(),
      sync: async (docs): Promise<IndexSyncResult> => {
        calls += 1;
        if (calls === 1) throw new Error('transient index outage');
        return provider.sync(docs);
      },
      delete: (ids: string[]) => provider.delete(ids),
      clear: () => provider.clear(),
    };
    const manager = new SearchSyncManager({ provider: flaky, maxRetries: 3, initialBackoffMs: 1, maxBackoffMs: 5 });
    const minimal = {
      id: 'scale-retry',
      slug: 'scale-retry',
      name: 'Retry Probe',
      description: '',
      price: { amount_minor: 100, currency: 'MAD' },
      images: [],
      categories: [],
    } as unknown as Product;
    manager.enqueue({ type: 'product.created', entityId: 'scale-retry', version: 1, product: minimal });
    const first = await manager.processAll();
    expect(first.failed).toBe(0);
    const metrics = manager.getFreshnessMetrics();
    expect(metrics.totalEventsProcessed).toBe(1);
    expect((await provider.search({ term: 'Retry Probe', pageSize: 5 })).total).toBe(1);

    const alwaysFail: SearchProvider = { ...flaky, sync: async () => { throw new Error('down'); } };
    const doomed = new SearchSyncManager({ provider: alwaysFail, maxRetries: 1 });
    doomed.enqueue({ type: 'product.created', entityId: 'x', version: 1, product: minimal });
    await doomed.processAll();
    expect(doomed.getDeadLetterQueue()).toHaveLength(1);
    expect(doomed.getFreshnessMetrics().totalEventsFailed).toBe(1);
  });

  it('reconciles missing, stale-stock, and orphaned documents', async () => {
    const corpus = buildCorpus();
    const provider = new NativeWooSearchProvider(corpus);
    const manager = new SearchSyncManager({ provider });
    // Simulate drift: drop one document, flip one stock flag, plant one orphan.
    await provider.delete(['scale-7']);
    const stale = await provider.search({ term: 'ECOMOS-SCALE-1009', pageSize: 1 });
    const staleDoc = stale.items[0];
    if (!staleDoc) throw new Error('scale fixture missing');
    await provider.sync([{ ...staleDoc, inStock: !staleDoc.inStock }]);
    await provider.sync([
      {
        id: 'orphan-1',
        slug: 'orphan-1',
        title: 'Orphan',
        description: '',
        priceMinor: 1,
        currency: 'MAD',
        categories: [],
        inStock: true,
      },
    ]);
    const report = await manager.reconcile(
      corpus.map(
        (d) =>
          ({
            id: d.id,
            slug: d.slug,
            name: d.title,
            description: d.description,
            price: { amount_minor: d.priceMinor, currency: d.currency },
            images: [],
            categories: d.categories.map((c) => c.slug),
            inventory: { status: d.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK' },
          }) as unknown as Product
      )
    );
    expect(report.missingCount).toBe(1);
    expect(report.staleStockCount).toBe(1);
    expect(report.orphanedCount).toBe(1);
    expect(report.repairedCount).toBe(3);
    const rereconciled = await manager.reconcile(
      corpus.map(
        (d) =>
          ({
            id: d.id,
            slug: d.slug,
            name: d.title,
            description: d.description,
            price: { amount_minor: d.priceMinor, currency: d.currency },
            images: [],
            categories: d.categories.map((c) => c.slug),
            inventory: { status: d.inStock ? 'IN_STOCK' : 'OUT_OF_STOCK' },
          }) as unknown as Product
      )
    );
    expect(rereconciled.healthy).toBe(true);
  });

  it('measures search latency percentiles without inventing budgets', async () => {
    const provider = new NativeWooSearchProvider(buildCorpus());
    const terms = ['creme', 'ECOMOS-SCALE-1055', 'Fès', 'terroir', 'category-42', 'huile', 'savon', 'tapis'];
    const samples: number[] = [];
    for (let i = 0; i < 200; i += 1) {
      const start = performance.now();
      const res = await provider.search({ term: terms[i % terms.length] as string, pageSize: 20 });
      samples.push(performance.now() - start);
      expect(res.total).toBeGreaterThanOrEqual(0);
    }
    samples.sort((a, b) => a - b);
    const p50 = percentile(samples, 50);
    const p95 = percentile(samples, 95);
    const max = samples[samples.length - 1] as number;
    console.log(`[ECO-1211] native search latency over 120 docs, 200 queries: p50=${p50.toFixed(2)}ms p95=${p95.toFixed(2)}ms max=${max.toFixed(2)}ms (measured, no budget asserted)`);
    expect(samples.length).toBe(200);
    const freshness = new SearchSyncManager({ provider }).getFreshnessMetrics();
    expect(freshness.totalEventsProcessed).toBe(0);
  });
});
