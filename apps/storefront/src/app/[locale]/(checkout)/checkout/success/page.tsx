'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/stores/cart-store';

/**
 * Guest order confirmation.
 *
 * An order number in a URL proves nothing, so this page does not trust one. It takes
 * the HMAC-signed guest grant from the URL **fragment** (which a browser never sends
 * to a server) and exchanges it for the order at the ownership-checked
 * `/api/orders/status` endpoint. If that exchange fails the page says so rather than
 * showing a plausible-looking confirmation.
 */
interface VerifiedOrder {
  orderId: string;
  status: string;
  currency?: string;
  total_minor?: number;
}

function Confirmation() {
  const params = useSearchParams();
  const orderId = params.get('order');
  const [state, setState] = useState<
    { kind: 'verifying' } | { kind: 'verified'; order: VerifiedOrder } | { kind: 'unverified'; reason: string }
  >({ kind: 'verifying' });

  useEffect(() => {
    let cancelled = false;
    // The grant lives in the URL fragment, which only exists on the client, so this
    // cannot be derived during render. Everything below runs off the effect's
    // synchronous path (hence the initial yield) so no state update is issued while
    // the effect body itself is executing.
    (async () => {
      await Promise.resolve();
      const token = window.location.hash.startsWith('#token=') ? decodeURIComponent(window.location.hash.slice(7)) : '';
      if (!orderId || !token) {
        setState({ kind: 'unverified', reason: 'missing_grant' });
        return;
      }
      try {
        const response = await fetch(`/api/orders/status?orderId=${encodeURIComponent(orderId)}`, {
          headers: { 'x-order-token': token },
        });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok || !body?.ok) {
          setState({ kind: 'unverified', reason: body?.error || `http_${response.status}` });
          return;
        }
        setState({
          kind: 'verified',
          order: {
            orderId: String(body.orderId ?? orderId),
            status: String(body.status ?? 'processing'),
            ...(body.currency ? { currency: body.currency } : {}),
            ...(typeof body.total_minor === 'number' ? { total_minor: body.total_minor } : {}),
          },
        });
        // The order is confirmed, so the optimistic client cart is spent. It is cleared
        // here rather than at submit time because the cart cookie is dropped by the
        // order, and clearing earlier would empty the form before it could be submitted.
        useCartStore.getState().clearCart();
      } catch {
        if (!cancelled) setState({ kind: 'unverified', reason: 'network_error' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (state.kind === 'verifying') {
    return (
      <main className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
        <div className="max-w-xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
          <h1 className="text-2xl font-bold mb-4">Vérification de la commande…</h1>
        </div>
      </main>
    );
  }

  if (state.kind === 'unverified') {
    return (
      <main className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
        <div className="max-w-xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
          <h1 className="text-2xl font-bold mb-4">Commande non vérifiable</h1>
          <p className="mb-8 text-secondary">
            Cette page ne peut pas confirmer la commande. Le lien de vérification est incomplet ou expiré.
          </p>
          <Link
            href="/cart"
            className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-foreground text-background font-medium rounded-md hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none"
          >
            Retour au panier
          </Link>
        </div>
      </main>
    );
  }

  const { order } = state;
  const total =
    typeof order.total_minor === 'number' ? `${(order.total_minor / 100).toFixed(2)} ${order.currency ?? ''}`.trim() : null;

  return (
    <main className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
      <div className="max-w-xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
        <h1 className="text-3xl font-bold mb-4">Commande enregistrée</h1>
        <p className="mb-2 text-lg">Votre commande n° {order.orderId} a été créée.</p>
        <p className="mb-2 text-secondary">Statut WooCommerce : {order.status}</p>
        {total && <p className="mb-2 text-secondary">Total : {total}</p>}
        <p className="text-sm text-muted-foreground mb-8">
          Paiement à la livraison : le règlement reste dû au moment de la réception.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-foreground text-background font-medium rounded-md hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none"
        >
          Continuer mes achats
        </Link>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
          <div className="max-w-xl mx-auto px-4 py-16 text-center" role="status" aria-live="polite">
            <h1 className="text-2xl font-bold mb-4">Vérification de la commande…</h1>
          </div>
        </main>
      }
    >
      <Confirmation />
    </Suspense>
  );
}
