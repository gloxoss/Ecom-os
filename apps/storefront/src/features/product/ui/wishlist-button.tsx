'use client';

import { useWishlist } from './use-wishlist';

export function WishlistButton({
  productId,
  productName = 'ce produit',
}: {
  productId: string;
  productName?: string;
}) {
  const { isWishlisted, toggleWishlist, isMounted } = useWishlist();

  if (!isMounted) return <div className="w-8 h-8" aria-hidden="true" />;

  const active = isWishlisted(productId);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(productId);
      }}
      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition focus:outline-none focus:ring-2 focus:ring-ring ${
        active
          ? 'bg-red-50 text-red-500 border border-red-200'
          : 'bg-white/90 text-foreground hover:bg-white border border-border shadow-sm'
      }`}
      aria-label={active ? `Retirer ${productName} des favoris` : `Ajouter ${productName} aux favoris`}
      aria-pressed={active}
    >
      <span aria-hidden="true">{active ? '♥' : '♡'}</span>
    </button>
  );
}
