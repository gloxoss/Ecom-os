import { describe, expect, it } from 'vitest';
import { parseRawMoney } from '../money';
import { mapProduct } from '../mappers';

describe('canonical backend money', () => {
  it.each([
    ['1299.00', 'MAD', 129900], ['0.29', 'EUR', 29], ['9999999.99', 'MAD', 999999999],
    ['1299', 'JPY', 1299], ['1.234', 'KWD', 1234], ['0', 'MAD', 0],
  ])('maps %s %s exactly', (amount, currency, minor) => {
    expect(parseRawMoney(amount as string, currency as string)).toEqual({ amount_minor: minor, currency });
  });
  it.each(['1,299.00', '1 299,00 MAD', '1299,00 MAD', '<span>1299.00</span>', '10.00 - 20.00', '', '-1', 'NaN'])('rejects formatted or invalid price %s', value => {
    expect(() => parseRawMoney(value, 'MAD')).toThrow();
  });
  it('rejects missing prices, excess precision and unsafe integers', () => {
    expect(() => parseRawMoney(undefined, 'MAD')).toThrow();
    expect(() => parseRawMoney('1.234', 'MAD')).toThrow('precision');
    expect(() => parseRawMoney('9007199254740991', 'MAD')).toThrow('safe integer');
  });
  it('preserves backend currency on products and related items', () => {
    const raw = { databaseId: 1, slug: 'test', name: 'Test', price: '1299.00' };
    const mapped = mapProduct({ ...raw, related: { nodes: [raw] } }, 'MAD');
    expect(mapped.price).toEqual({ amount_minor: 129900, currency: 'MAD' });
    expect(mapped.relatedProducts?.[0]?.price.currency).toBe('MAD');
  });
});
