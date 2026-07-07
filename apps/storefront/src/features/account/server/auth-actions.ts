'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { checkRateLimit } from '@/lib/rate-limit';

const AUTH_COOKIE = 'ecom_auth';
const SESSION_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
};

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value ?? null;
}

export async function login(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  
  // SR-RATE-001: auth 10 requests / 60 seconds per IP
  const { ok, retryAfter } = checkRateLimit(`auth:${ip}`, 10, 60_000);
  if (!ok) {
    redirect(`/account/login?error=rate_limit&retry=${retryAfter}`);
  }

  const engine = await getEngine();
  try {
    const session = await engine.login({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch {
    redirect('/account/login?error=1');
  }
  redirect('/account');
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect('/');
}

export async function register(formData: FormData) {
  const headerList = await headers();
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  
  const { ok, retryAfter } = checkRateLimit(`register:${ip}`, 5, 60_000);
  if (!ok) {
    redirect(`/account/register?error=rate_limit&retry=${retryAfter}`);
  }

  const engine = await getEngine();
  try {
    const session = await engine.registerCustomer({
      email: formData.get('email') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      password: formData.get('password') as string,
    });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, session.token, SESSION_OPTIONS);
  } catch {
    redirect('/account/register?error=1');
  }
  redirect('/account');
}

export async function requestPasswordResetAction(formData: FormData) {
  const engine = await getEngine();
  const email = formData.get('email') as string;
  try {
    await engine.requestPasswordReset(email);
  } catch (err) {
    console.error(err);
  }
  // Always redirect to success to prevent email enumeration
  redirect('/account/forgot-password?success=1');
}

export async function resetPasswordAction(formData: FormData) {
  const engine = await getEngine();
  const token = formData.get('token') as string; // format: "key|login"
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Reconstruct key and login for the error redirect URL
  const separatorIndex = token?.indexOf('|') ?? -1;
  const key = separatorIndex >= 0 ? token.slice(0, separatorIndex) : '';
  const login = separatorIndex >= 0 ? token.slice(separatorIndex + 1) : '';
  const errorBase = `/account/password-reset?key=${encodeURIComponent(key)}&login=${encodeURIComponent(login)}`;

  if (password !== confirmPassword) {
    redirect(`${errorBase}&error=mismatch`);
  }

  try {
    await engine.resetPassword(token, password);
    redirect('/account/login?reset=success');
  } catch {
    redirect(`${errorBase}&error=1`);
  }
}
