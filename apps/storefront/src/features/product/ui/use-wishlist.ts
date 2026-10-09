import { useMemo, useSyncExternalStore } from 'react';
import { useHydrated } from '@/lib/use-hydrated';

const WISHLIST_KEY = 'ecom_wishlist';
const CHANGE_EVENT = 'ecom-wishlist-change';

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(CHANGE_EVENT, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(CHANGE_EVENT, listener);
  };
}

function snapshot(): string | null {
  try { return localStorage.getItem(WISHLIST_KEY); } catch { return null; }
}
const serverSnapshot = () => null;

export function useWishlist() {
  const stored = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const isMounted = useHydrated();
  const wishlist = useMemo<string[]>(() => {
    try {
      const parsed: unknown = JSON.parse(stored ?? '[]');
      return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
    } catch { return []; }
  }, [stored]);

  const toggleWishlist = (productId: string) => {
    const updated = wishlist.includes(productId)
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId];
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event(CHANGE_EVENT));
    } catch { /* Saving favorites may be unavailable in restricted browsers. */ }
  };

  return { wishlist, toggleWishlist, isWishlisted: (id: string) => isMounted && wishlist.includes(id), isMounted };
}
