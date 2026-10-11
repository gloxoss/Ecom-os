'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import type { RfqQuote } from '../../../../../../packages/addons-rfq/src/index';
import { OfferReview } from './offer-review';

export interface OfferAccessProps {
  /** Quote id taken from the guest's offer link, e.g. `/devis/offer?quoteId=quote_...`. */
  quoteId: string;
}

/**
 * Guest entry point for a private offer.
 *
 * The storefront has no customer account, so the guest proves ownership with the
 * scoped access token issued at submission. The token is read from the URL
 * fragment (`#token=...`), which browsers never send to the server, keeping it
 * out of access logs, referrer headers and shared caches. A `?token=` query
 * param is accepted only as a fallback for links already handed out that way.
 * The token travels to the API in a request header, never in the request URL.
 */
export function OfferAccess({ quoteId }: OfferAccessProps) {
  const [token, setToken] = useState('');
  const [tokenResolved, setTokenResolved] = useState(false);
  const [quote, setQuote] = useState<RfqQuote | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token');
    const fromQuery = new URLSearchParams(window.location.search).get('token');
    setToken(fromHash || fromQuery || '');
    setTokenResolved(true);
  }, []);

  useEffect(() => {
    if (!tokenResolved || !quoteId || !token) return;
    let cancelled = false;
    setError(null);

    (async () => {
      try {
        const res = await fetch(`/api/rfq/offers?quoteId=${encodeURIComponent(quoteId)}`, {
          headers: { 'x-quote-token': token },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok || !data?.success) {
          setError(
            res.status === 401 || res.status === 403
              ? 'Accès refusé : ce lien de devis est invalide ou a expiré.'
              : data?.error || 'Devis introuvable.'
          );
          return;
        }
        setQuote(data.quote as RfqQuote);
      } catch {
        if (!cancelled) setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quoteId, token, tokenResolved]);

  if (!quoteId || (tokenResolved && !token)) {
    return (
      <div className="py-12 text-center space-y-3" data-testid="offer-missing-grant">
        <h1 className="text-xl font-semibold">Lien de devis incomplet</h1>
        <p className="text-muted-foreground text-sm">
          Ouvrez le lien sécurisé reçu par email pour consulter votre offre chiffrée.
        </p>
        <Link href="/" className="inline-block text-primary underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3" role="alert" data-testid="offer-access-denied">
        <h1 className="text-xl font-semibold">Offre indisponible</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Link href="/" className="inline-block text-primary underline">
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm" data-testid="offer-loading">
        Chargement de votre offre...
      </div>
    );
  }

  return <OfferReview quote={quote} accessSecret={token} />;
}
