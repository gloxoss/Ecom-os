import Link from 'next/link';
import { getEngine } from '@/lib/engine';
import { fetchCartAction, getCartToken } from '@/features/cart/server/cart-actions';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';
import { submitCheckoutFormAction } from '@/features/checkout/server/checkout-form-actions';

export const metadata = { title: 'Checkout', robots: { index: false, follow: false } };

export default async function CheckoutPage() {
  const engine = await getEngine();

  // Only read the authoritative cart when a guest session exists. Creating a new
  // Woo cart here would try to write a cookie during render, which is not allowed.
  const token = await getCartToken();
  const [cart, capabilities, gateways, shippingMethods] = await Promise.all([
    token ? fetchCartAction() : Promise.resolve(null),
    engine.getCapabilities(),
    engine.listPaymentGateways(),
    engine.listShippingMethods(),
  ]);

  // COD is the only certified gateway; Stripe/CMI must stay disabled at this boundary.
  const codGateways = gateways.filter((gateway) => gateway.id === 'cod');

  if (!cart || cart.items.length === 0) {
    return (
      <main className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
        <div className="max-w-xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>
          <p className="mb-8 text-secondary">Your cart is empty.</p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-foreground text-background font-medium rounded-md hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none"
          >
            Return to cart
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
      <CheckoutForm
        cartId={cart.id}
        action={submitCheckoutFormAction}
        gateways={codGateways}
        shippingMethods={shippingMethods}
        capabilities={capabilities}
      />
    </div>
  );
}
