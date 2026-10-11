'use client';

import React, { useEffect, useState } from 'react';
import type { RfqQuote, OfferRevision } from '../../../../../../packages/addons-rfq/src/index';

// Expiry is evaluated against wall-clock time; re-check on this interval.
const EXPIRY_CLOCK_INTERVAL_MS = 30_000;

export interface OfferReviewProps {
  quote: RfqQuote;
  accessSecret: string;
  onStatusChange?: (newStatus: string) => void;
}

export function OfferReview({ quote, accessSecret, onStatusChange }: OfferReviewProps) {
  const [currentQuote, setCurrentQuote] = useState<RfqQuote>(quote);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Date.now() is impure and must not run during render (react-hooks/purity), so
  // seed the clock once and refresh it from the interval callback. The effect only
  // calls setState from that callback, never synchronously in its body.
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), EXPIRY_CLOCK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const currentRevision: OfferRevision | undefined =
    currentQuote.revisions?.find((r) => r.isCurrent) ||
    (currentQuote.revisions && currentQuote.revisions.length > 0
      ? currentQuote.revisions[currentQuote.revisions.length - 1]
      : undefined);

  const isExpired = Boolean(
    currentQuote.expiresAt && new Date(currentQuote.expiresAt).getTime() <= nowMs
  );

  const canRespond =
    (currentQuote.state === 'offer_created' || currentQuote.state === 'revised') && !isExpired;

  async function handleAction(action: 'accept' | 'reject' | 'revise', extraData: Record<string, unknown> = {}) {
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: Record<string, unknown> = {
        action,
        quoteId: currentQuote.id,
        accessSecret,
        ...extraData,
      };

      if (action === 'accept') {
        payload.revisionId = currentQuote.currentRevisionId || currentRevision?.revisionId;
      }

      const res = await fetch('/api/rfq/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'QUOTE_EXPIRED') {
          setErrorMsg('Cette offre a expiré et ne peut plus être acceptée. Veuillez demander une révision.');
        } else if (data.code === 'STALE_REVISION') {
          setErrorMsg('Cette révision a été remplacée par une offre plus récente. Veuillez actualiser la page.');
        } else if (data.code === 'FORBIDDEN') {
          setErrorMsg('Accès refusé : jeton de sécurité du devis invalide.');
        } else {
          setErrorMsg(data.error || 'Une erreur est survenue lors du traitement.');
        }
        return;
      }

      const updatedQuote = {
        ...currentQuote,
        state: data.state as RfqQuote['state'],
        updatedAt: new Date().toISOString(),
      };
      setCurrentQuote(updatedQuote);

      if (action === 'accept') {
        setSuccessMsg('Devis accepté avec succès ! Notre équipe commerciale prépare votre dossier.');
      } else if (action === 'reject') {
        setSuccessMsg("L'offre a été déclinée.");
      } else if (action === 'revise') {
        setSuccessMsg("Votre demande d'ajustement a été transmise à notre équipe commerciale.");
        setShowReviseModal(false);
      }

      if (onStatusChange) {
        onStatusChange(data.state);
      }
    } catch {
      setErrorMsg('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const currency = currentRevision?.currency || 'MAD';

  return (
    <section className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-200 pb-5 gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-neutral-500 font-semibold">Devis Chiffré</span>
          <h2 className="text-2xl font-bold text-neutral-900 mt-1">
            Devis {currentQuote.quoteNumber}
          </h2>
          {currentRevision && (
            <p className="text-sm text-neutral-600 mt-0.5">
              Révision n°{currentRevision.revisionNumber} ({currentRevision.revisionId})
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              currentQuote.state === 'accepted'
                ? 'bg-emerald-100 text-emerald-800'
                : currentQuote.state === 'rejected'
                ? 'bg-rose-100 text-rose-800'
                : isExpired
                ? 'bg-amber-100 text-amber-800'
                : 'bg-blue-100 text-blue-800'
            }`}
          >
            {isExpired && currentQuote.state !== 'accepted'
              ? 'Expiré'
              : currentQuote.state}
          </span>
          {currentQuote.expiresAt && (
            <span className="text-xs text-neutral-500">
              Validité : {new Date(currentQuote.expiresAt).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Honest Inventory Notice */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-xs text-neutral-600 space-y-1">
        <p className="font-semibold text-neutral-800">
          Politique de tarification et de stock EcomOS :
        </p>
        <p>
          Ce devis constitue un engagement ferme sur les tarifs indiqués jusqu&apos;à la date d&apos;échéance. Conformément aux règles d&apos;exploitation, l&apos;émission du devis ne réserve aucun inventaire physique avant validation finale et conversion en commande ferme.
        </p>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div role="alert" className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div role="status" className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
          {successMsg}
        </div>
      )}

      {/* Priced Line Items Table */}
      {currentRevision?.lines && currentRevision.lines.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-500 text-xs uppercase font-semibold">
                <th className="py-3 px-2">Désignation</th>
                <th className="py-3 px-2 text-center">Qté</th>
                <th className="py-3 px-2 text-right">P.U. HT</th>
                <th className="py-3 px-2 text-center">TVA</th>
                <th className="py-3 px-2 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {currentRevision.lines.map((line, idx) => (
                <tr key={idx} className="hover:bg-neutral-50">
                  <td className="py-3 px-2">
                    <p className="font-medium text-neutral-900">{line.title}</p>
                    {line.sku && <span className="text-xs text-neutral-400">SKU: {line.sku}</span>}
                  </td>
                  <td className="py-3 px-2 text-center text-neutral-700 font-medium">
                    {line.quantity}
                  </td>
                  <td className="py-3 px-2 text-right text-neutral-700">
                    {line.unitPriceExclTax.toFixed(2)} {currency}
                  </td>
                  <td className="py-3 px-2 text-center text-neutral-500 text-xs">
                    {(line.taxRate * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-2 text-right font-semibold text-neutral-900">
                    {line.totalInclTax.toFixed(2)} {currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-500 italic">Aucune ligne chiffrée sur cette révision.</p>
      )}

      {/* Totals Summary */}
      {currentRevision && (
        <div className="flex justify-end pt-4 border-t border-neutral-200">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-neutral-600">
              <span>Sous-total HT :</span>
              <span>{currentRevision.subtotalExclTax.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Total TVA :</span>
              <span>{currentRevision.totalTax.toFixed(2)} {currency}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-neutral-900 pt-2 border-t border-neutral-300">
              <span>Total TTC :</span>
              <span>{currentRevision.totalInclTax.toFixed(2)} {currency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {canRespond && (
        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-neutral-200">
          <button
            type="button"
            onClick={() => handleAction('reject')}
            disabled={isSubmitting}
            className="px-4 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Décliner l&apos;offre
          </button>
          <button
            type="button"
            onClick={() => setShowReviseModal(true)}
            disabled={isSubmitting}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 hover:bg-neutral-50 rounded-lg text-sm font-medium transition disabled:opacity-50"
          >
            Demander un ajustement
          </button>
          <button
            type="button"
            onClick={() => handleAction('accept')}
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            {isSubmitting ? 'Validation...' : 'Accepter le devis'}
          </button>
        </div>
      )}

      {/* Revise Modal */}
      {showReviseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-neutral-900">Demande d&apos;ajustement</h3>
            <p className="text-xs text-neutral-600">
              Précisez les modifications souhaitées (quantités, délais, conditions de livraison).
            </p>
            <textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Ex: Merci de revoir les frais de transport ou la quantité..."
              className="w-full h-28 border border-neutral-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowReviseModal(false)}
                className="px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting || !revisionNotes.trim()}
                onClick={() => handleAction('revise', { notes: revisionNotes })}
                className="px-5 py-2 text-sm font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 disabled:opacity-50"
              >
                Envoyer la demande
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
