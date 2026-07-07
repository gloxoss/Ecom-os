import { StripePaymentForm } from '@/features/checkout/ui/stripe-payment-form';

export default async function StripeCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; secret?: string; pk?: string }>;
}) {
  const { orderId, secret, pk } = await searchParams;
  if (!secret || !pk || !orderId) {
    return <main className="max-w-xl mx-auto px-4 py-24 text-center"><p>Invalid payment session.</p></main>;
  }
  return <StripePaymentForm orderId={orderId} clientSecret={secret} />;
}
