import { notFound } from 'next/navigation';
import { isAddonActive } from '@/lib/addon-capabilities';
import { QuoteReview } from '@/features/rfq/ui/quote-review';

// This is the target of the "Finaliser la demande" link in the quote builder.
export const metadata = {
  title: 'Récapitulatif et coordonnées du devis | EcomOS',
  description: 'Vérifiez vos articles, renseignez vos coordonnées et transmettez votre demande de devis.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DevisReviewPage() {
  // Same addon gate as /devis: with `quotes` disabled this route must not exist.
  if (!isAddonActive('quotes')) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px] pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <QuoteReview />
      </div>
    </div>
  );
}
