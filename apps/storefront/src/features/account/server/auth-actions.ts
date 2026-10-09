'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireCustomerAccounts } from '@/lib/disabled-features';

export async function getSessionToken(): Promise<string | null> { return requireCustomerAccounts(); }
export async function login(_formData: FormData) { requireCustomerAccounts(); }
export async function register(_formData: FormData) { requireCustomerAccounts(); }
export async function requestPasswordResetAction(_formData: FormData) { requireCustomerAccounts(); }
export async function resetPasswordAction(_formData: FormData) { requireCustomerAccounts(); }

export async function logout() {
  (await cookies()).delete('ecom_auth');
  redirect('/');
}
