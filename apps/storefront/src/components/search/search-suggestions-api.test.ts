import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/search/suggestions/route';
import { NextRequest } from 'next/server';
import { defaultFetchSuggestions } from './fetch-suggestions';

describe('Search suggestions API route & fetcher', () => {
  it('returns empty groups when query length is less than 2', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=a');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products).toHaveLength(0);
    expect(data.categories).toHaveLength(0);
  });

  it('resolves suggestions with French accent-insensitivity (creme matches Crème)', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=creme');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.products.length).toBeGreaterThan(0);
    expect(data.products.some((p: { label: string }) => p.label.toLowerCase().includes('crème'))).toBe(true);
  });

  it('matches category suggestions (e.g. patisseries or chocolat)', async () => {
    const req = new NextRequest('http://localhost:3000/api/search/suggestions?q=chocolat');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    const hasCategoryOrProduct = data.categories.length > 0 || data.products.length > 0;
    expect(hasCategoryOrProduct).toBe(true);
  });

  it('defaultFetchSuggestions handles short queries without making network calls', async () => {
    const res = await defaultFetchSuggestions('x');
    expect(res).toEqual({ products: [], categories: [], brands: [] });
  });
});
