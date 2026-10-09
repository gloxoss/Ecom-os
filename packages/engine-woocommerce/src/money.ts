import type { Money } from '@ecom-os/engine';

export function parseRawMoney(value: string | undefined | null, currency: string): Money {
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid backend currency.');
  if (typeof value !== 'string' || !/^\d+(?:\.\d+)?$/.test(value)) {
    throw new Error('A canonical backend price is required; formatted prices and ranges are unsupported.');
  }
  const decimals = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits;
  if (decimals === undefined) throw new Error('Currency precision is unavailable.');
  const [whole = '0', fraction = ''] = value.split('.');
  if (fraction.slice(decimals).replace(/0/g, '')) throw new Error('Backend price exceeds currency precision.');
  const amount = BigInt(whole + fraction.slice(0, decimals).padEnd(decimals, '0'));
  if (amount > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Backend price exceeds safe integer range.');
  return { amount_minor: Number(amount), currency };
}
