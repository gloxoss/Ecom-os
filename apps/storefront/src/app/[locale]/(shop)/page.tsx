import { getEngine } from '@/lib/engine';
import { HeroSection } from '@/features/landing/ui/hero-section';
import { CollectionSection } from '@/features/landing/ui/collection-section';
import { FeatureBlocksSection } from '@/features/landing/ui/feature-blocks-section';
import { StorySection } from '@/features/landing/ui/story-section';
import { ProcessSection } from '@/features/landing/ui/process-section';
import { QuoteSection } from '@/features/landing/ui/quote-section';
import { BrewSection } from '@/features/landing/ui/brew-section';
import { ReviewsSection } from '@/features/landing/ui/reviews-section';
import { LocationSection } from '@/components/shared/location-section';
import homeData from '@/features/landing/data/home.json';

export default async function HomePage() {
  const engine = await getEngine();
  const { items: products } = await engine.listProducts({ limit: 12 });

  return (
    <>
      <HeroSection data={homeData.hero} />
      <CollectionSection data={homeData.collection} products={products} />
      <FeatureBlocksSection data={homeData.featureBlocks} />
      <StorySection data={homeData.story} />
      <ProcessSection data={homeData.process} />
      <QuoteSection data={homeData.quote} />
      <BrewSection data={homeData.brew} />
      <ReviewsSection data={homeData.reviews} />
      <LocationSection data={homeData.location} />
    </>
  );
}
