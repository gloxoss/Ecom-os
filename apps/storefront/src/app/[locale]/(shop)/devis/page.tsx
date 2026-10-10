import { notFound } from 'next/navigation';
import { isAddonActive } from '@/lib/addon-capabilities';
import { QuoteBuilder } from '@/features/rfq/ui/quote-builder';

export const metadata = {
  title: 'Demande de devis personnalisé | EcomOS',
  description: 'Sélectionnez des articles pour constituer votre demande de devis sur mesure.',
};

export default async function DevisPage() {
  // Addon off-state security gate: if quotes addon is inactive, render 404
  if (!isAddonActive('quotes')) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px] pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <QuoteBuilder />
      </div>
    </div>
  );
}
