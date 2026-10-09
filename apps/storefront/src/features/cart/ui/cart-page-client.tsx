'use client';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart-store';
import { useTranslations } from 'next-intl';
import { useHydrated } from '@/lib/use-hydrated';
import { CouponInput } from './coupon-input';
import { StoreCapabilities } from '@ecom-os/engine';

export function CartPageClient({ capabilities }: { capabilities: StoreCapabilities }) {
  const { items, removeItem, updateQty, getCartTotal } = useCartStore();
  const t = useTranslations('cart');
  const mounted = useHydrated();

  if (!mounted) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-secondary mb-6">{t('empty')}</p>
        <Link href="/catalog" className="underline font-medium">{t('continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="divide-y divide-foreground/10">
        {items.map(item => (
          <div key={item.id} className="flex gap-4 py-5 items-center">
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-secondary text-sm">${(item.price.amount_minor / 100).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, item.quantity - 1)}
                className="w-8 h-8 border border-foreground/20 rounded flex items-center justify-center hover:bg-muted transition"
              >−</button>
              <span className="w-8 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.id, item.quantity + 1)}
                className="w-8 h-8 border border-foreground/20 rounded flex items-center justify-center hover:bg-muted transition"
              >+</button>
            </div>
            <p className="w-20 text-end font-medium">
              ${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.id)}
              className="text-secondary hover:text-foreground text-sm underline"
            >
              {t('remove')}
            </button>
          </div>
        ))}
      </div>

      {capabilities.couponsEnabled && (
        <div className="mt-6 border-t border-foreground/10 pt-6">
          <CouponInput />
        </div>
      )}

      <div className="border-t border-foreground/10 pt-6 mt-4 flex justify-between text-lg font-bold">
        <span>{t('total')}</span>
        <span>${(getCartTotal() / 100).toFixed(2)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Link
          href="/catalog"
          className="flex-1 text-center border border-foreground/20 py-3 rounded-md font-medium hover:bg-muted transition"
        >
          {t('continueShopping')}
        </Link>
        <Link
          href="/checkout"
          className="flex-1 text-center bg-foreground text-background py-3 rounded-md font-bold hover:opacity-90 transition"
        >
          {t('proceedToCheckout')}
        </Link>
      </div>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}
