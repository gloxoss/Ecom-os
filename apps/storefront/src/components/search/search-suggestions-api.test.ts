import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/search/suggestions/route';
import { NextRequest } from 'next/server';
import { defaultFetchSuggestions } from './fetch-suggestions';
import { getEngine } from '@/lib/engine';

vi.mock('@/lib/engine', () => ({
  getEngine: vi.fn(),
}));

describe('Search suggestions API route & fetcher', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns empty groups when query length is less than 2', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=a');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products).toHaveLength(0);
    expect(data.categories).toHaveLength(0);
  });

  it('resolves suggestions with French accent-insensitivity (creme matches Crème)', async () => {
    vi.mocked(getEngine).mockResolvedValue({
      listProducts: async () => ({
        items: [
          {
            id: 'prod-1',
            name: 'Crème Hydratante Bio',
            slug: 'creme-hydratante-bio',
            price: { amount_minor: 12000, currency: 'MAD' },
            images: [],
            categories: ['Soins du visage'],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
          } as any,
        ],
        total: 1,
      }),
      listCategories: async () => [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
    } as any);

    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=creme');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products.some((p: { label: string }) => p.label.toLowerCase().includes('crème'))).toBe(true);
  });

  it('matches category suggestions (e.g. patisseries)', async () => {
    vi.mocked(getEngine).mockResolvedValue({
      listProducts: async () => ({ items: [], total: 0 }),
      listCategories: async () => [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
        { id: 'cat-1', name: 'Pâtisseries', slug: 'patisseries' } as any,
      ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
    } as any);

    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=patisseries');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.categories.length).toBe(1);
    expect(data.categories[0].label).toBe('Pâtisseries');
  });

  it('must not invent products when upstream initialization fails', async () => {
    vi.mocked(getEngine).mockRejectedValue(new Error('synthetic upstream unavailable'));
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=creme');
    const res = await GET(req);
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.categories).toEqual([]);
  });

  it('reports unavailable (503), not an empty 200, when the product lookup fails', async () => {
    vi.mocked(getEngine).mockResolvedValue({
      listProducts: async () => {
        throw new Error('synthetic product lookup failure');
      },
      listCategories: async () => [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
    } as any);
    const res = await GET(new NextRequest('http://localhost:3000/api/search/suggestions?q=creme'));
    expect(res.status).toBe(503);
  });

  it('must preserve a genuinely empty upstream catalog', async () => {
    vi.mocked(getEngine).mockResolvedValue({
      listProducts: async () => ({ items: [], total: 0 }),
      listCategories: async () => [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loosely typed test fixture
    } as any);
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=creme');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toEqual([]);
    expect(body.categories).toEqual([]);
  });

  it('defaultFetchSuggestions handles short queries without making network calls', async () => {
    const res = await defaultFetchSuggestions('x');
    expect(res).toEqual({ products: [], categories: [], brands: [] });
  });
});
