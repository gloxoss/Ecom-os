import { useState, useEffect } from 'react';

const WISHLIST_KEY = 'ecom_wishlist';

export function useWishlist() {
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isWishlisted = prev.includes(productId);
      const updated = isWishlisted 
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
      
      try {
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isWishlisted = (productId: string) => isMounted ? wishlist.includes(productId) : false;

  return { wishlist, toggleWishlist, isWishlisted, isMounted };
}
