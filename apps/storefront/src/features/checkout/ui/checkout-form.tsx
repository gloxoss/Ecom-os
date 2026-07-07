'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { validateCouponAction, listShippingMethodsAction } from '../server/checkout-actions';
import type { ShippingMethod, StoreCapabilities } from '@ecom-os/engine';

interface CheckoutFormProps {
  cartId: string;
  action: (formData: FormData) => void;
  gateways: Array<{ id: string; name: string }>;
  shippingMethods: ShippingMethod[];
  capabilities: StoreCapabilities;
}

export function CheckoutForm({ cartId, action, gateways, shippingMethods, capabilities }: CheckoutFormProps) {
  const { items, getCartTotal, coupon, applyCoupon, removeCoupon, shippingMethod, setShippingMethod } = useCartStore();
  const cartItemsRef = useRef<HTMLInputElement>(null);
  const t = useTranslations('checkout');
  const [selectedGateway, setSelectedGateway] = useState(gateways[0]?.id ?? 'cod');

  // Initialize shipping method if not set
  useEffect(() => {
    if (!shippingMethod && shippingMethods.length > 0) {
      const first = shippingMethods[0];
      setShippingMethod({ id: first.id, title: first.title, cost_minor: first.cost.amount_minor });
    }
  }, [shippingMethod, shippingMethods, setShippingMethod]);

  // Serialize cart items for server — IDs + slugs + quantities only, never prices
  useEffect(() => {
    if (!cartItemsRef.current) return;
    const payload = items.map(item => ({
      productId: item.id,
      slug: item.slug,
      quantity: item.quantity,
    }));
    cartItemsRef.current.value = JSON.stringify(payload);
  }, [items]);

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-secondary mb-6 text-lg">{t('cartEmpty')}</p>
        <Link href="/catalog" className="underline font-medium">{t('browse')}</Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">{t('title')}</h1>

      <form action={action} className="space-y-8">
        <input type="hidden" name="cartItems" ref={cartItemsRef} />
        <input type="hidden" name="cartId" value={cartId} />
        <input type="hidden" name="couponCode" value={coupon?.code ?? ''} />
        <input type="hidden" name="shippingMethod" value={shippingMethod?.id ?? ''} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('contact')}</h2>
          <input
            type="email" name="email" placeholder="Email address" required
            className="w-full border border-foreground/20 p-3 rounded-md bg-background"
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t('shipping')}</h2>
          {shippingMethods.length > 0 ? (
            <div className="space-y-3">
              {shippingMethods.map(method => (
                <label key={method.id} className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition ${shippingMethod?.id === method.id ? 'border-foreground' : 'border-foreground/20 hover:bg-muted/50'}`}>
                  <input type="radio" name="shippingMethod" value={method.id}
                    checked={shippingMethod?.id === method.id}
                    onChange={() => setShippingMethod({ id: method.id, title: method.title, cost_minor: method.cost.amount_minor })} />
                  <div className="flex-1 flex justify-between">
                    <span className="font-medium">{method.title}</span>
                    <span>${(method.cost.amount_minor / 100).toFixed(2)}</span>
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-secondary">No shipping methods available.</p>
          )}

          <div className="grid grid-cols-2 gap-4 mt-4">
            <input name="firstName" placeholder="First name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
            <input name="lastName" placeholder="Last name" required className="border border-foreground/20 p-3 rounded-md bg-background" />
          </div>
          <textarea
            name="address" placeholder="Full address" required rows={3}
            className="w-full border border-foreground/20 p-3 rounded-md bg-background"
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t('payment')}</h2>
          {gateways.map(g => (
            <label key={g.id} className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer transition ${selectedGateway === g.id ? 'border-foreground' : 'border-foreground/20 hover:bg-muted/50'}`}>
              <input type="radio" name="paymentMethod" value={g.id}
                checked={selectedGateway === g.id}
                onChange={() => setSelectedGateway(g.id)} />
              <div>
                <span className="font-medium">{g.name}</span>
                {g.id === 'cod' && <p className="text-secondary text-sm">{t('codDescription')}</p>}
              </div>
            </label>
          ))}
          {gateways.length === 0 && (
            <p className="text-secondary text-sm">No payment methods available. Contact support.</p>
          )}
        </section>

        <section className="bg-muted rounded-md p-5 space-y-3">
          <h2 className="font-semibold">{t('summary')}</h2>
          {items.map(item => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-secondary">
                {item.name} <span className="text-foreground font-medium">× {item.quantity}</span>
              </span>
              <span>${((item.price.amount_minor * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          
          <div className="pt-2">
            {capabilities.couponsEnabled && (
              <CouponInput 
                coupon={coupon} 
                onApply={async (code) => {
                  const res = await validateCouponAction(code);
                  if (res) {
                    applyCoupon({ 
                      code: res.code, 
                      // This is naive: assuming fixed_cart for simple integration
                      discount_minor: Math.round(parseFloat(res.amount) * 100), 
                      description: res.description || `Coupon ${res.code}` 
                    });
                  } else {
                    alert('Invalid or expired coupon');
                  }
                }} 
                onRemove={removeCoupon} 
              />
            )}
          </div>
          {coupon && (
            <div className="flex justify-between text-sm text-green-600 font-medium">
              <span>Discount ({coupon.code})</span>
              <span>-${(coupon.discount_minor / 100).toFixed(2)}</span>
            </div>
          )}
          {shippingMethod && (
            <div className="flex justify-between text-sm">
              <span>Shipping ({shippingMethod.title})</span>
              <span>${(shippingMethod.cost_minor / 100).toFixed(2)}</span>
            </div>
          )}
          <input type="hidden" name="couponCode" value={coupon?.code || ''} />

          <div className="border-t border-foreground/10 pt-3 flex justify-between font-bold">
            <span>{t('estimatedTotal')}</span>
            <span>${(getCartTotal() / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-secondary">{t('priceNote')}</p>
        </section>

        <button
          type="submit"
          disabled={gateways.length === 0}
          className="w-full bg-foreground text-background py-4 rounded-md font-bold text-lg hover:opacity-90 transition disabled:opacity-50"
        >
          {t('placeOrder')}
        </button>
      </form>
    </main>
  );
}

function CouponInput({ 
  coupon, 
  onApply, 
  onRemove 
}: { 
  coupon: { code: string; discount_minor: number; description: string } | null;
  onApply: (code: string) => void;
  onRemove: () => void;
}) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (coupon) {
    return (
      <div className="flex items-center justify-between bg-background p-3 rounded-md border border-foreground/10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm bg-foreground text-background px-2 py-1 rounded">{coupon.code}</span>
          <span className="text-xs text-secondary">{coupon.description}</span>
        </div>
        <button type="button" onClick={onRemove} className="text-xs font-medium underline text-red-500">Remove</button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <input 
        type="text" 
        value={code}
        onChange={e => setCode(e.target.value)}
        placeholder="Gift card or discount code" 
        className="flex-1 border border-foreground/20 p-2 rounded-md bg-background text-sm"
      />
      <button 
        type="button" 
        disabled={!code || loading}
        onClick={async () => {
          setLoading(true);
          await onApply(code);
          setLoading(false);
          setCode('');
        }}
        className="bg-foreground/10 px-4 py-2 rounded-md text-sm font-medium hover:bg-foreground/20 transition disabled:opacity-50"
      >
        {loading ? 'Applying...' : 'Apply'}
      </button>
    </div>
  );
}
