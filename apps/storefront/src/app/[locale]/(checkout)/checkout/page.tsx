import Link from 'next/link';

export const metadata = { title: 'Checkout unavailable', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl font-bold mb-3">Checkout is currently unavailable</h1>
      <p className="mb-8">Ordering will be available after the store connection, shipping and payment checks are complete. Your cart has been kept.</p>
      <Link href="/cart">Return to cart</Link>
    </main>
  );
}
