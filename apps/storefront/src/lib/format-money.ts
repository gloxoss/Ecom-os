import type { Money } from '@ecom-os/engine';

export function formatMoney(money: Money, locale = 'en'): string {
  const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency: money.currency });
  const decimals = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(money.amount_minor / (10 ** decimals));
}
