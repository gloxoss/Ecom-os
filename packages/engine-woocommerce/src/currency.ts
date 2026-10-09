import { restFetch } from './rest';

export async function fetchCurrency(): Promise<string> {
  const setting = await restFetch('/settings/general/woocommerce_currency');
  if (typeof setting.value !== 'string' || !/^[A-Z]{3}$/.test(setting.value)) {
    throw new Error('WooCommerce did not return a valid store currency.');
  }
  return setting.value;
}
