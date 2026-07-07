'use client';

import { useEffect, useState, ReactNode } from 'react';

// ponytail: Prevents hydration mismatches for Zustand persisted state.
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  
  if (!mounted) return <>{fallback}</>;
  return <>{children}</>;
}
