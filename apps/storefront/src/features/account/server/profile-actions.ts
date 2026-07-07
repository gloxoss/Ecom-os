'use server';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from './auth-actions';
import { redirect } from 'next/navigation';

export async function updateProfile(_formData: FormData) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  // ponytail: engine.updateCustomer not yet on interface (v1.1). Read-only profile for v1.
  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');

  redirect('/account/profile?saved=1');
}
