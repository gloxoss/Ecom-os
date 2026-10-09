'use server';

import { cookies } from 'next/headers';
import { requireCustomerAccounts } from '@/lib/disabled-features';

export async function setAuthToken(_token: string) { requireCustomerAccounts(); }
export async function getAuthToken(): Promise<string | undefined> { return requireCustomerAccounts(); }
export async function clearAuthToken() { (await cookies()).delete('ecom_auth'); }
