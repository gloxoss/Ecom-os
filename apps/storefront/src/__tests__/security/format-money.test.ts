import { describe, expect, it } from 'vitest';
import { formatMoney } from '../../lib/format-money';

describe('currency-aware display', () => {
  it.each([['MAD', 129900, 1299], ['JPY', 1299, 1299], ['KWD', 1234, 1.234]])('formats %s using its currency precision', (currency, minor, major) => {
    expect(formatMoney({ currency: currency as string, amount_minor: minor as number }, 'fr')).toBe(
      new Intl.NumberFormat('fr', { style: 'currency', currency: currency as string }).format(major as number),
    );
  });
});
