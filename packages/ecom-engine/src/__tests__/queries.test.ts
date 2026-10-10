import { describe, it, expect } from 'vitest';
import {
  validateProductQuery,
  ProductListQuery,
  PageInfo,
  ProductListResult,
} from '../index';

describe('Product query contract and validation', () => {
  it('accepts valid simple and complex queries', () => {
    const validQuery1: ProductListQuery = {
      limit: 20,
      category: 'medical-devices',
      sort: 'price_asc',
    };
    expect(validateProductQuery(validQuery1)).toEqual({ valid: true });

    const validQuery2: ProductListQuery = {
      search: 'diagnostic',
      brand: 'acme',
      minPrice: 100,
      maxPrice: 500,
      sort: 'newest',
      cursor: 'cursor_abc123',
      limit: 50,
      inStockOnly: true,
    };
    expect(validateProductQuery(validQuery2)).toEqual({ valid: true });

    const validQuery3: ProductListQuery = {
      offset: 40,
      limit: 10,
    };
    expect(validateProductQuery(validQuery3)).toEqual({ valid: true });
  });

  it('rejects cursor and offset ambiguity when both are specified', () => {
    const ambiguousQuery: ProductListQuery = {
      cursor: 'cursor_123',
      offset: 10,
    };
    const res = validateProductQuery(ambiguousQuery);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/cannot combine cursor-based and offset-based pagination/i);
  });

  it('rejects negative limit', () => {
    const res = validateProductQuery({ limit: -5 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/limit must be a non-negative integer/i);
  });

  it('rejects non-integer limit', () => {
    const res = validateProductQuery({ limit: 12.5 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/limit must be a non-negative integer/i);
  });

  it('rejects limit exceeding maximum 100', () => {
    const res = validateProductQuery({ limit: 101 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/cannot exceed 100 items/i);
  });

  it('rejects negative offset', () => {
    const res = validateProductQuery({ offset: -1 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/offset must be a non-negative integer/i);
  });

  it('rejects negative prices', () => {
    expect(validateProductQuery({ minPrice: -10 }).valid).toBe(false);
    expect(validateProductQuery({ maxPrice: -5 }).valid).toBe(false);
  });

  it('rejects minPrice exceeding maxPrice', () => {
    const res = validateProductQuery({ minPrice: 200, maxPrice: 100 });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/minimum price cannot exceed maximum price/i);
  });

  it('rejects empty whitespace cursor', () => {
    const res = validateProductQuery({ cursor: '   ' });
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/cursor cannot be an empty string/i);
  });

  it('verifies PageInfo and ProductListResult shape conformance', () => {
    const pageInfo: PageInfo = {
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cur_start',
      endCursor: 'cur_end',
    };
    const result: ProductListResult = {
      items: [],
      total: 0,
      pageInfo,
    };
    expect(result.pageInfo?.hasNextPage).toBe(true);
    expect(result.pageInfo?.startCursor).toBe('cur_start');
    expect(result.pageInfo?.endCursor).toBe('cur_end');
  });
});
