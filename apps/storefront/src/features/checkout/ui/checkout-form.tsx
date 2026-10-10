'use client';

import { useCartStore } from '@/stores/cart-store';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Initialize shipping method if not set
  useEffect(() => {
    if (!shippingMethod && shippingMethods.length > 0) {
      const first = shippingMethods[0];
      if (first) {
        setShippingMethod({ id: first.id, title: first.title, cost_minor: first.cost.amount_minor });
      }
    }
  }, [shippingMethod, shippingMethods, setShippingMethod]);

  // Serialize cart items for server — IDs + slugs + quantities only, never prices
  useEffect(() => {
    if (!cartItemsRef.current) return;
    const payload = items.map((item) => ({
      productId: item.id,
      slug: item.slug,
      quantity: item.quantity,
    }));
    cartItemsRef.current.value = JSON.stringify(payload);
  }, [items]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (isSubmitting) {
      e.preventDefault();
      return;
    }

    const form = e.currentTarget;
    const errors: Record<string, string> = {};

    const email = (form.elements.namedItem('email') as HTMLInputElement)?.value;
    const firstName = (form.elements.namedItem('firstName') as HTMLInputElement)?.value;
    const lastName = (form.elements.namedItem('lastName') as HTMLInputElement)?.value;
    const address = (form.elements.namedItem('address') as HTMLTextAreaElement)?.value;

    if (!email || !email.includes('@')) {
      errors.email = 'Veuillez saisir une adresse email valide.';
    }
    if (!firstName || firstName.trim().length === 0) {
      errors.firstName = 'Le prénom est requis.';
    }
    if (!lastName || lastName.trim().length === 0) {
      errors.lastName = 'Le nom est requis.';
    }
    if (!address || address.trim().length === 0) {
      errors.address = 'L’adresse de livraison est requise.';
    }

    if (Object.keys(errors).length > 0) {
      e.preventDefault();
      setFormErrors(errors);
      // Focus the first invalid input for keyboard and screen reader accessibility
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        (form.elements.namedItem(firstErrorField) as HTMLElement)?.focus();
      }
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
  };

  if (items.length === 0) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-24 text-center" role="status" aria-live="polite">
        <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>
        <p className="text-secondary mb-6 text-lg">{t('cartEmpty')}</p>
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-foreground text-background font-medium rounded-md hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none"
        >
          {t('browse')}
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-10">{t('title')}</h1>

      <form action={action} onSubmit={handleSubmit} noValidate className="space-y-8">
        <input type="hidden" name="cartItems" ref={cartItemsRef} />
        <input type="hidden" name="cartId" value={cartId} />
        <input type="hidden" name="couponCode" value={coupon?.code ?? ''} />
        <input type="hidden" name="shippingMethod" value={shippingMethod?.id ?? ''} />

        {/* Contact Information */}
        <section className="space-y-4" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-lg font-semibold">{t('contact')}</h2>
          <div>
            <label htmlFor="checkout-email" className="block text-sm font-medium mb-1">
              Adresse email <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              aria-required="true"
              aria-invalid={Boolean(formErrors.email)}
              aria-describedby={formErrors.email ? 'email-error' : undefined}
              className={`w-full min-h-[44px] border p-3 rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none ${
                formErrors.email ? 'border-destructive' : 'border-foreground/20'
              }`}
            />
            {formErrors.email && (
              <p id="email-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                {formErrors.email}
              </p>
            )}
          </div>
        </section>

        {/* Shipping Information */}
        <section className="space-y-4" aria-labelledby="shipping-heading">
          <h2 id="shipping-heading" className="text-lg font-semibold">{t('shipping')}</h2>

          {shippingMethods.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-muted-foreground mb-2">Options de livraison</legend>
              {shippingMethods.map((method) => (
                <label
                  key={method.id}
                  htmlFor={`shipping-${method.id}`}
                  className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer min-h-[44px] transition motion-reduce:transition-none ${
                    shippingMethod?.id === method.id ? 'border-foreground bg-muted/30' : 'border-foreground/20 hover:bg-muted/20'
                  }`}
                >
                  <input
                    id={`shipping-${method.id}`}
                    type="radio"
                    name="shippingMethodOption"
                    value={method.id}
                    checked={shippingMethod?.id === method.id}
                    onChange={() =>
                      setShippingMethod({ id: method.id, title: method.title, cost_minor: method.cost.amount_minor })
                    }
                    className="w-4 h-4 text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                  />
                  <div className="flex-1 flex justify-between items-center text-sm">
                    <span className="font-medium">{method.title}</span>
                    <span className="font-semibold">${(method.cost.amount_minor / 100).toFixed(2)}</span>
                  </div>
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="text-sm text-secondary" role="status">Aucune méthode de livraison disponible.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="checkout-firstName" className="block text-sm font-medium mb-1">
                Prénom <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="checkout-firstName"
                name="firstName"
                autoComplete="given-name"
                required
                aria-required="true"
                aria-invalid={Boolean(formErrors.firstName)}
                aria-describedby={formErrors.firstName ? 'firstName-error' : undefined}
                className={`w-full min-h-[44px] border p-3 rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none ${
                  formErrors.firstName ? 'border-destructive' : 'border-foreground/20'
                }`}
              />
              {formErrors.firstName && (
                <p id="firstName-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {formErrors.firstName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="checkout-lastName" className="block text-sm font-medium mb-1">
                Nom <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                id="checkout-lastName"
                name="lastName"
                autoComplete="family-name"
                required
                aria-required="true"
                aria-invalid={Boolean(formErrors.lastName)}
                aria-describedby={formErrors.lastName ? 'lastName-error' : undefined}
                className={`w-full min-h-[44px] border p-3 rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none ${
                  formErrors.lastName ? 'border-destructive' : 'border-foreground/20'
                }`}
              />
              {formErrors.lastName && (
                <p id="lastName-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                  {formErrors.lastName}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="checkout-address" className="block text-sm font-medium mb-1">
              Adresse complète <span className="text-destructive" aria-hidden="true">*</span>
            </label>
            <textarea
              id="checkout-address"
              name="address"
              autoComplete="street-address"
              required
              rows={3}
              aria-required="true"
              aria-invalid={Boolean(formErrors.address)}
              aria-describedby={formErrors.address ? 'address-error' : undefined}
              className={`w-full border p-3 rounded-md bg-background text-sm focus-visible:ring-2 focus-visible:ring-foreground focus-visible:outline-none transition motion-reduce:transition-none ${
                formErrors.address ? 'border-destructive' : 'border-foreground/20'
              }`}
            />
            {formErrors.address && (
              <p id="address-error" role="alert" className="text-xs text-destructive mt-1 font-medium">
                {formErrors.address}
              </p>
            )}
          </div>
        </section>

        {/* Payment Gateways */}
        <section className="space-y-3" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="text-lg font-semibold">{t('payment')}</h2>
          <fieldset className="space-y-3">
            <legend className="sr-only">Moyens de paiement acceptés</legend>
            {gateways.map((g) => (
              <label
                key={g.id}
                htmlFor={`payment-${g.id}`}
                className={`flex items-center gap-3 p-4 border rounded-md cursor-pointer min-h-[44px] transition motion-reduce:transition-none ${
                  selectedGateway === g.id ? 'border-foreground bg-muted/30' : 'border-foreground/20 hover:bg-muted/20'
                }`}
              >
                <input
                  id={`payment-${g.id}`}
                  type="radio"
                  name="paymentMethod"
                  value={g.id}
                  checked={selectedGateway === g.id}
                  onChange={() => setSelectedGateway(g.id)}
                  className="w-4 h-4 text-foreground focus-visible:ring-2 focus-visible:ring-foreground"
                />
                <div className="flex-1">
                  <span className="font-medium text-sm">{g.name}</span>
                  {g.id === 'cod' && (
                    <p className="text-muted-foreground text-xs mt-0.5">{t('codDescription')}</p>
                  )}
                </div>
              </label>
            ))}
            {gateways.length === 0 && (
              <p className="text-secondary text-sm" role="status">
                Aucun moyen de paiement disponible. Veuillez contacter le support.
              </p>
            )}
          </fieldset>
        </section>

        {/* Order Summary */}
        <section className="bg-muted rounded-md p-5 space-y-3" aria-labelledby="summary-heading">
          <h2 id="summary-heading" className="font-semibold text-base">{t('summary')}</h2>
          <ul className="divide-y divide-foreground/10" aria-label="Articles de la commande">
            {items.map((item) => (
              <li key={item.id} className="py-2.5 flex justify-between text-sm">
                <span>
                  {item.name} <span className="text-muted-foreground">× {item.quantity}</span>
                </span>
                <span className="font-medium">${(item.price.amount_minor / 100).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          {coupon && (
            <div className="flex justify-between text-sm text-green-600 font-medium pt-2" role="status">
              <span>Remise ({coupon.code})</span>
              <span>-${(coupon.discount_minor / 100).toFixed(2)}</span>
            </div>
          )}

          {shippingMethod && (
            <div className="flex justify-between text-sm pt-1">
              <span>Livraison ({shippingMethod.title})</span>
              <span>${(shippingMethod.cost_minor / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-foreground/10 pt-3 flex justify-between font-bold text-base">
            <span>{t('estimatedTotal')}</span>
            <span>${(getCartTotal() / 100).toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('priceNote')}</p>
        </section>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={gateways.length === 0 || isSubmitting}
          aria-busy={isSubmitting}
          className="w-full min-h-[48px] bg-foreground text-background py-3.5 px-6 rounded-md font-bold text-base hover:opacity-90 focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:outline-none transition motion-reduce:transition-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-background motion-reduce:animate-none"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Traitement en cours...</span>
            </>
          ) : (
            t('placeOrder')
          )}
        </button>
      </form>
    </main>
  );
}
