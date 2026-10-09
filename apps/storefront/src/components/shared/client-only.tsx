'use client';
import { type ReactNode } from 'react';
import { useHydrated } from '@/lib/use-hydrated';

export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useHydrated();
  return mounted ? <>{children}</> : null;
}
