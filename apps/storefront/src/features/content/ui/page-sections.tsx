import { HeroSection } from '@/features/landing/ui/hero-section';
import { CollectionSection } from '@/features/landing/ui/collection-section';
import { FeatureBlocksSection } from '@/features/landing/ui/feature-blocks-section';
import { StorySection } from '@/features/landing/ui/story-section';
import { ProcessSection } from '@/features/landing/ui/process-section';
import { QuoteSection } from '@/features/landing/ui/quote-section';
import { BrewSection } from '@/features/landing/ui/brew-section';
import { ReviewsSection } from '@/features/landing/ui/reviews-section';
import { LocationSection } from '@/components/shared/location-section';
import type { PageSectionsData } from '@ecom-os/engine';
import { sanitizeCmsMarkup } from '@ecom-os/engine';
import type { Product } from '@ecom-os/engine';

export interface PageSectionsProps {
  cmsSections: PageSectionsData | null;
  fallbackData: any;
  products: Product[];
}

/**
 * Merges WordPress CMS sections over local fallback defaults with strict sanitization.
 * Guarantees that even if CMS data is partially configured or unavailable,
 * the storefront renders completely and safely.
 */
export function resolvePageContent(cmsSections: PageSectionsData | null, fallbackData: any) {
  if (!cmsSections) {
    return fallbackData;
  }

  const hero = cmsSections.hero
    ? {
        title: sanitizeCmsMarkup(cmsSections.hero.title || fallbackData.hero.title),
        description: sanitizeCmsMarkup(cmsSections.hero.description || fallbackData.hero.description),
        image: {
          src: cmsSections.hero.image?.src || fallbackData.hero.image.src,
          alt: sanitizeCmsMarkup(cmsSections.hero.image?.alt || fallbackData.hero.image.alt),
        },
        categories:
          cmsSections.hero.categories && cmsSections.hero.categories.length > 0
            ? cmsSections.hero.categories.map((c) => ({
                id: c.id,
                label: sanitizeCmsMarkup(c.label),
                href: c.href,
              }))
            : fallbackData.hero.categories,
        cta: {
          label: sanitizeCmsMarkup(cmsSections.hero.cta?.label || fallbackData.hero.cta.label),
          href: cmsSections.hero.cta?.href || fallbackData.hero.cta.href,
        },
      }
    : fallbackData.hero;

  const collection = cmsSections.collection
    ? {
        label: sanitizeCmsMarkup(cmsSections.collection.label || fallbackData.collection.label),
        title: sanitizeCmsMarkup(cmsSections.collection.title || fallbackData.collection.title),
        tabs:
          cmsSections.collection.tabs && cmsSections.collection.tabs.length > 0
            ? cmsSections.collection.tabs.map((t) => ({
                id: t.id,
                label: sanitizeCmsMarkup(t.label),
              }))
            : fallbackData.collection.tabs,
        cta: {
          label: sanitizeCmsMarkup(cmsSections.collection.cta?.label || fallbackData.collection.cta.label),
          href: cmsSections.collection.cta?.href || fallbackData.collection.cta.href,
        },
      }
    : fallbackData.collection;

  const featureBlocks =
    cmsSections.featureBlocks && cmsSections.featureBlocks.length > 0
      ? cmsSections.featureBlocks.map((fb, idx) => {
          const fallbackFb = fallbackData.featureBlocks?.[idx] || fallbackData.featureBlocks?.[0];
          return {
            label: sanitizeCmsMarkup(fb.label || fallbackFb?.label || ''),
            title: sanitizeCmsMarkup(fb.title || fallbackFb?.title || ''),
            cta: {
              label: sanitizeCmsMarkup(fb.cta?.label || fallbackFb?.cta?.label || 'Découvrir'),
              href: fb.cta?.href || fallbackFb?.cta?.href || '/catalog',
            },
            image: {
              src: fb.image?.src || fallbackFb?.image?.src || '/placeholder.jpg',
              alt: sanitizeCmsMarkup(fb.image?.alt || fallbackFb?.image?.alt || ''),
            },
          };
        })
      : fallbackData.featureBlocks;

  const story = cmsSections.story
    ? {
        label: sanitizeCmsMarkup(cmsSections.story.label || fallbackData.story.label),
        title: sanitizeCmsMarkup(cmsSections.story.title || fallbackData.story.title),
        video: cmsSections.story.video || fallbackData.story.video,
        paragraphs:
          cmsSections.story.paragraphs && cmsSections.story.paragraphs.length > 0
            ? cmsSections.story.paragraphs.map((p) => sanitizeCmsMarkup(p))
            : fallbackData.story.paragraphs,
        cta: {
          label: sanitizeCmsMarkup(cmsSections.story.cta?.label || fallbackData.story.cta?.label || 'Notre histoire'),
          href: cmsSections.story.cta?.href || fallbackData.story.cta?.href || '/about-us',
        },
        values: cmsSections.story.values || fallbackData.story.values,
      }
    : fallbackData.story;

  const process = cmsSections.process
    ? {
        label: sanitizeCmsMarkup(cmsSections.process.label || fallbackData.process.label),
        title: sanitizeCmsMarkup(cmsSections.process.title || fallbackData.process.title),
        steps:
          cmsSections.process.steps && cmsSections.process.steps.length > 0
            ? cmsSections.process.steps.map((s) => ({
                number: s.number,
                title: sanitizeCmsMarkup(s.title),
                description: sanitizeCmsMarkup(s.description),
              }))
            : fallbackData.process.steps,
      }
    : fallbackData.process;

  const quote = cmsSections.quote
    ? {
        text: sanitizeCmsMarkup(cmsSections.quote.quote || fallbackData.quote.text),
        author: sanitizeCmsMarkup(cmsSections.quote.author || fallbackData.quote.author),
        role: sanitizeCmsMarkup(cmsSections.quote.role || fallbackData.quote.role || ''),
      }
    : fallbackData.quote;

  return {
    hero,
    collection,
    featureBlocks,
    story,
    process,
    quote,
    brew: fallbackData.brew,
    reviews: fallbackData.reviews,
    location: fallbackData.location,
  };
}

export function PageSections({ cmsSections, fallbackData, products }: PageSectionsProps) {
  const content = resolvePageContent(cmsSections, fallbackData);

  return (
    <>
      <HeroSection data={content.hero} />
      <CollectionSection data={content.collection} products={products} />
      <FeatureBlocksSection data={content.featureBlocks} />
      <StorySection data={content.story} />
      <ProcessSection data={content.process} />
      <QuoteSection data={content.quote} />
      <BrewSection data={content.brew} />
      <ReviewsSection data={content.reviews} />
      <LocationSection data={content.location} />
    </>
  );
}
