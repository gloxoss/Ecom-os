import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getCartId, ensureCartId, clearCartCookie } from '@/features/cart/server/cart-actions';
import { CheckoutForm } from '@/features/checkout/ui/checkout-form';
import { getEnabledGateways } from '@ecom-os/addons-multi-payment';

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  // Read-only: safe in RSC render. Returns null if cart cookie doesn't exist yet.
  const cartId = await getCartId();
  const engine = await getEngine();
  const remoteGateways = await engine.listPaymentGateways?.() ?? [];
  const localGateways = getEnabledGateways().map(g => ({ id: g.id, name: g.name }));
  const shippingMethods = await engine.listShippingMethods?.() ?? [];
  const capabilities = await engine.getCapabilities?.() ?? {
    couponsEnabled: false,
    loyaltyEnabled: false,
    guestCheckout: false,
    multiCurrency: false,
    version: '1.0.0'
  };

  const combined = [...localGateways];
  for (const rg of remoteGateways) {
    if (!combined.some(g => g.id === rg.id)) {
      combined.push({ id: rg.id, name: rg.name });
    }
  }
  const gateways = combined.length > 0 ? combined : [{ id: 'cod', name: 'Cash on delivery' }];

  async function submitOrder(formData: FormData) {
    'use server';

    const { headers } = await import('next/headers');
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const { checkRateLimit } = await import('@/lib/rate-limit');
    const { ok } = checkRateLimit(`checkout:${ip}`, 5, 60_000);
    if (!ok) throw new Error('Too many checkout attempts. Please wait and try again.');

    const cartJson = formData.get('cartItems') as string;
    let clientItems: Array<{ productId: string; slug: string; quantity: number }> = [];
    try {
      clientItems = JSON.parse(cartJson ?? '[]');
    } catch {
      throw new Error('Malformed cart data');
    }
    if (clientItems.length === 0) throw new Error('Cart is empty');

    const paymentMethod = formData.get('paymentMethod') as string;
    // ensureCartId is a Server Action call — cookie writes allowed here.
    const cartCookieId = await ensureCartId();
    const engine = await getEngine();

    const session = await engine.initCheckout(
      cartCookieId,
      {
        email: formData.get('email') as string,
        firstName: formData.get('firstName') as string,
        lastName: formData.get('lastName') as string,
        address: formData.get('address') as string,
        paymentMethod,
        couponCode: formData.get('couponCode') as string | undefined,
        shippingMethod: formData.get('shippingMethod') as string | undefined,
      },
      clientItems,
    );

    // placeOrder re-fetches prices server-side — client prices IGNORED
    const order = await engine.placeOrder(session);

    // Route to payment gateway
    const { getGateway } = await import('@ecom-os/addons-multi-payment');
    const gateway = getGateway(paymentMethod);
    if (gateway) {
      const result = await gateway.initiate(order);
      if (result.type === 'redirect') {
        await clearCartCookie();
        redirect(result.url); // CMI: redirect to hosted page
      }
      if (result.type === 'client_secret') {
        // Stripe: redirect to payment page with client_secret in query
        await clearCartCookie();
        redirect(`/checkout/stripe?orderId=${order.id}&secret=${result.secret}&pk=${result.publicKey}`);
      }
    }

    // COD or fallback: go to success
    await clearCartCookie();
    redirect(`/checkout/success?orderId=${order.id}`);
  }

  // No early redirect. CheckoutForm handles empty client state natively.
  // ensureCartId will mint a cookie when the form is actually submitted.

  return <CheckoutForm cartId={cartId ?? ''} action={submitOrder} gateways={gateways} shippingMethods={shippingMethods} capabilities={capabilities} />;
}
