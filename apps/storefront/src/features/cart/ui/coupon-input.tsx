'use client';

import { useState } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { applyCouponAction } from '../server/coupon-actions';
import { useTranslations } from 'next-intl';

export function CouponInput() {
  const t = useTranslations('cart');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const coupon = useCartStore(s => s.coupon);
  const applyCoupon = useCartStore(s => s.applyCoupon);
  const removeCoupon = useCartStore(s => s.removeCoupon);
  // Get cart subtotal (ignoring coupon)
  const cartSubtotal = useCartStore(s => s.items.reduce((sum, item) => sum + item.price.amount_minor * item.quantity, 0));

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await applyCouponAction(code.trim(), cartSubtotal);
      if (result.ok) {
        applyCoupon({
          code: code.trim(),
          discount_minor: result.discount.amount_minor,
          description: result.description,
        });
        setCode('');
      } else {
        setError(t(`couponErrors.${result.error}`) || t('couponInvalid'));
      }
    } catch (err) {
      setError(t('couponInvalid'));
    } finally {
      setLoading(false);
    }
  }

  if (coupon) {
    return (
      <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-md border border-secondary/20 mt-4">
        <div>
          <p className="text-sm font-medium">Coupon applied: <span className="uppercase">{coupon.code}</span></p>
          <p className="text-xs text-secondary mt-0.5">{coupon.description}</p>
        </div>
        <button 
          onClick={removeCoupon}
          className="text-xs font-semibold text-red-500 hover:text-red-700 uppercase tracking-wide"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleApply} className="mt-4">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={code} 
          onChange={e => setCode(e.target.value)}
          placeholder={t('couponPlaceholder') || 'Enter coupon code'} 
          className="flex-1 bg-transparent border border-foreground/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-foreground"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading || !code.trim()}
          className="bg-foreground text-background px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-50"
        >
          {loading ? '...' : t('applyCoupon') || 'Apply'}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
    </form>
  );
}
