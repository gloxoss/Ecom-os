'use server';

import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from './auth-actions';

export async function createAddress(formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');
  
  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  await engine.createAddress(customer.id, {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    street: formData.get('street') as string,
    city: formData.get('city') as string,
    postalCode: formData.get('postalCode') as string,
    country: formData.get('country') as string,
    isDefaultShipping: formData.get('isDefaultShipping') === 'on',
    isDefaultBilling: formData.get('isDefaultBilling') === 'on',
  });

  redirect('/account/addresses');
}

export async function updateAddress(formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');
  
  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const addressId = formData.get('addressId') as string;

  await engine.updateAddress(customer.id, addressId, {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    street: formData.get('street') as string,
    city: formData.get('city') as string,
    postalCode: formData.get('postalCode') as string,
    country: formData.get('country') as string,
    isDefaultShipping: formData.get('isDefaultShipping') === 'on',
    isDefaultBilling: formData.get('isDefaultBilling') === 'on',
  });

  redirect('/account/addresses');
}

export async function deleteAddress(formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');
  
  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  const addressId = formData.get('addressId') as string;
  await engine.deleteAddress(customer.id, addressId);

  redirect('/account/addresses');
}
