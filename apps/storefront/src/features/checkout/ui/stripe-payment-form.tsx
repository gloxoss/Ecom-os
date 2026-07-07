'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useState } from 'react';

// ponytail: module-level singleton — loadStripe is idempotent but expensive to call per render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  orderId: string;
  clientSecret: string;
  publishableKey?: string;
}

function PaymentForm({ orderId }: { orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?orderId=${orderId}`,
      },
    });
    if (error) {
      setError(error.message ?? 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button type="submit" disabled={loading || !stripe}
        className="w-full bg-foreground text-background py-4 rounded-md font-bold hover:opacity-90 transition disabled:opacity-50">
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export function StripePaymentForm({ orderId, clientSecret }: Props) {
  return (
    <main className="max-w-md mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold mb-8">Complete Payment</h1>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <PaymentForm orderId={orderId} />
      </Elements>
    </main>
  );
}
