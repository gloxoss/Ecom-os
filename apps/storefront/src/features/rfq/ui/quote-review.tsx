'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuoteStore } from '../model/quote-store';
import {
  toRfqItems,
  generateIdempotencyKey,
  submitRfqRequest,
  type RfqSubmitResponse,
} from '../../../../../../packages/addons-rfq/src/index';

export function QuoteReview() {
  const basket = useQuoteStore(state => state.basket);
  const clearBasket = useQuoteStore(state => state.clearBasket);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [termsConsent, setTermsConsent] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submissionResult, setSubmissionResult] = useState<RfqSubmitResponse | null>(null);

  const items = basket.items;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const clientErrors: string[] = [];
    if (!name.trim()) clientErrors.push('Le nom ou contact est obligatoire');
    if (!email.trim() || !email.includes('@')) clientErrors.push('Une adresse email valide est obligatoire');
    if (items.length === 0) clientErrors.push('Votre panier de devis ne contient aucun article');
    if (!termsConsent) clientErrors.push('Veuillez accepter les conditions générales de demande de devis');
    if (!privacyConsent) clientErrors.push('Veuillez accepter le traitement de vos données de contact');

    if (clientErrors.length > 0) {
      setErrors(clientErrors);
      return;
    }

    setLoading(true);

    try {
      const idempotencyKey = generateIdempotencyKey();
      const rfqItems = toRfqItems(basket);

      const response = await submitRfqRequest({
        idempotencyKey,
        contact: {
          name,
          email,
          phone: phone || undefined,
          companyName: companyName || undefined,
          taxId: taxId || undefined,
        },
        items: rfqItems,
        consents: [
          { consentId: 'terms_and_conditions', grantedAt: new Date().toISOString() },
          { consentId: 'privacy_consent', grantedAt: new Date().toISOString() },
        ],
        notes: notes || undefined,
      });

      setSubmissionResult(response);
      clearBasket();
    } catch (err: any) {
      setErrors([err.message || 'Une erreur inattendue est survenue']);
    } finally {
      setLoading(false);
    }
  };

  if (submissionResult) {
    return (
      <div className="py-12 max-w-xl mx-auto text-center space-y-6" data-testid="quote-success">
        <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✓
        </div>
        <h1 className="text-2xl font-bold">Demande de devis enregistrée !</h1>
        <p className="text-muted-foreground">
          Votre référence de devis est{' '}
          <span className="font-mono font-semibold text-foreground">{submissionResult.quoteNumber}</span>.
        </p>
        <div className="bg-card border p-4 rounded-lg text-left text-sm space-y-2">
          <p>
            <strong>Statut:</strong> {submissionResult.state} (en attente de chiffrage par nos équipes)
          </p>
          <p className="text-xs text-muted-foreground">
            Un email de confirmation contenant votre lien d&apos;accès sécurisé et votre récapitulatif a été envoyé à votre adresse.
          </p>
        </div>
        {/* Access grant travels in the URL fragment so the token never reaches the server. */}
        <Link
          href={`/devis/offer?quoteId=${encodeURIComponent(submissionResult.quoteId)}#token=${encodeURIComponent(submissionResult.accessSecret)}`}
          className="inline-block px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          Suivre ma demande de devis
        </Link>
        <div>
          <Link href="/" className="inline-block text-sm text-muted-foreground underline">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Aucun article sélectionné</h2>
        <p className="text-muted-foreground mb-4">Votre panier de devis est vide.</p>
        <Link href="/catalog" className="text-primary underline">
          Retourner au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8" data-testid="quote-review">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">Récapitulatif et coordonnées</h1>
        <p className="text-sm text-muted-foreground">
          Vérifiez vos articles et renseignez vos informations professionnelles pour recevoir une offre chiffrée.
        </p>
      </div>

      {errors.length > 0 && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm space-y-1">
          {errors.map((err, i) => (
            <p key={i}>• {err}</p>
          ))}
        </div>
      )}

      {/* Item Summary */}
      <div className="border rounded-lg p-4 bg-card space-y-3">
        <h2 className="font-semibold text-sm border-b pb-2">Articles sélectionnés ({itemCount})</h2>
        <div className="divide-y">
          {items.map(item => (
            <div key={item.key} className="py-2 flex justify-between text-sm">
              <div>
                <span className="font-medium">{item.title}</span>
                {item.notes && <p className="text-xs text-muted-foreground italic">Note: {item.notes}</p>}
              </div>
              <span className="font-mono">Qté: {item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Company Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1">Nom complet *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded bg-background"
              placeholder="ex: Youssef El Mansouri"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Email professionnel *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded bg-background"
              placeholder="ex: contact@entreprise.ma"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Téléphone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded bg-background"
              placeholder="ex: +212 6 00 00 00 00"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Entreprise / Organisation</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded bg-background"
              placeholder="ex: Atelier Medina SARL"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Identifiant Fiscal / ICE / SIRET</label>
          <input
            type="text"
            value={taxId}
            onChange={e => setTaxId(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded bg-background"
            placeholder="ex: ICE 001928374000088"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1">Notes globales / Instructions de livraison</label>
          <textarea
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded bg-background"
            placeholder="Contraintes spécifiques de livraison, conditionnement, etc."
          />
        </div>

        {/* Consents */}
        <div className="space-y-2 pt-2 border-t">
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              required
              checked={termsConsent}
              onChange={e => setTermsConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              J&apos;accepte les conditions de demande de devis et comprends que les tarifs définitifs me seront transmis par proposition sur-mesure.
            </span>
          </label>
          <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              required
              checked={privacyConsent}
              onChange={e => setPrivacyConsent(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              J&apos;autorise l&apos;enregistrement de mes données de contact pour le traitement et le suivi exclusif de cette demande.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Transmission en cours...' : 'Envoyer la demande de devis'}
        </button>
      </form>
    </div>
  );
}
