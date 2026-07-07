'use client';

import { useWishlist } from './use-wishlist';
import Link from 'next/link';

export function WishlistCounter() {
  const { wishlist, isMounted } = useWishlist();

  if (!isMounted) return <div className="w-8 h-8" />;

  return (
    <Link href="/wishlist" className="relative text-secondary hover:text-foreground">
      ♡
      {wishlist.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-foreground text-background text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
          {wishlist.length}
        </span>
      )}
    </Link>
  );
}
