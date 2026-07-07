'use client';

import { useWishlist } from './use-wishlist';

export function WishlistButton({ productId }: { productId: string }) {
  const { isWishlisted, toggleWishlist, isMounted } = useWishlist();

  if (!isMounted) return <div className="w-8 h-8" />; // hydration placeholder

  const active = isWishlisted(productId);

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition ${active ? 'bg-red-50 text-red-500' : 'bg-white/80 text-foreground hover:bg-white'}`}
      aria-label="Toggle wishlist"
    >
      {active ? '♥' : '♡'}
    </button>
  );
}
