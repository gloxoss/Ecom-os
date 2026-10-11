import { notFound } from 'next/navigation';
import { isAddonActive } from '@/lib/addon-capabilities';
import { OfferAccess } from '@/features/rfq/ui/offer-access';

// Guest-facing private offer view. Reached from the link issued with the quote;
// no account is required, the scoped access token in the link is the grant.
export const metadata = {
  title: 'Votre offre de devis | EcomOS',
  description: 'Consultez, acceptez ou déclinez votre offre de devis personnalisée.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DevisOfferPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ quoteId?: string }>;
}) {
  // Same addon gate as /devis: with `quotes` disabled this route must not exist.
  if (!isAddonActive('quotes')) {
    notFound();
  }

  const { quoteId } = await searchParams;

  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px] pb-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <OfferAccess quoteId={quoteId ?? ''} />
      </div>
    </div>
  );
}
