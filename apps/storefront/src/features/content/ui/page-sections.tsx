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

// CMS + landing fallback content is a genuinely dynamic JSON boundary: the same
// blob is shaped for the engine (PageSectionsData) inside the CMS branches and
// for the landing components in the fallback/defaults, and the CMS branches
// return engine-shaped sections while the landing components read a different
// shape. No single precise type describes both, so this is a scoped escape hatch
// rather than a blanket weakening; every internal read below stays explicit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic CMS/landing content boundary
type FallbackContentData = any;

export interface PageSectionsProps {
  cmsSections: PageSectionsData | null;
  fallbackData: FallbackContentData;
  products: Product[];
}

function cleanText(cmsVal: string | undefined | null, fallbackVal: string): string {
  if (!cmsVal || !cmsVal.trim()) return sanitizeCmsMarkup(fallbackVal);
  const sanitized = sanitizeCmsMarkup(cmsVal).trim();
  return sanitized.length > 0 ? sanitized : sanitizeCmsMarkup(fallbackVal);
}

/**
 * Merges WordPress CMS sections over local fallback defaults with strict sanitization.
 * Guarantees that even if CMS data is partially configured or unavailable,
 * the storefront renders completely and safely.
 */
export function resolvePageContent(cmsSections: PageSectionsData | null, fallbackData: FallbackContentData) {
  if (!cmsSections) {
    return fallbackData;
  }

  const hero = cmsSections.hero
    ? {
        title: cleanText(cmsSections.hero.title, fallbackData.hero.title),
        description: cleanText(cmsSections.hero.description, fallbackData.hero.description),
        image: {
          src: cmsSections.hero.image?.src?.trim() || fallbackData.hero.image.src,
          alt: cleanText(cmsSections.hero.image?.alt, fallbackData.hero.image.alt),
        },
        categories:
          cmsSections.hero.categories && cmsSections.hero.categories.length > 0
            ? cmsSections.hero.categories.map((c) => ({
                id: c.id,
                label: cleanText(c.label, ''),
                href: c.href || '/catalog',
              }))
            : fallbackData.hero.categories,
        cta: {
          label: cleanText(cmsSections.hero.cta?.label, fallbackData.hero.cta.label),
          href: cmsSections.hero.cta?.href?.trim() || fallbackData.hero.cta.href,
        },
      }
    : fallbackData.hero;

  const collection = cmsSections.collection
    ? {
        label: cleanText(cmsSections.collection.label, fallbackData.collection.label),
        title: cleanText(cmsSections.collection.title, fallbackData.collection.title),
        tabs:
          cmsSections.collection.tabs && cmsSections.collection.tabs.length > 0
            ? cmsSections.collection.tabs.map((t) => ({
                id: t.id,
                label: cleanText(t.label, ''),
              }))
            : fallbackData.collection.tabs,
        cta: {
          label: cleanText(cmsSections.collection.cta?.label, fallbackData.collection.cta.label),
          href: cmsSections.collection.cta?.href?.trim() || fallbackData.collection.cta.href,
        },
      }
    : fallbackData.collection;

  const featureBlocks =
    cmsSections.featureBlocks && cmsSections.featureBlocks.length > 0
      ? cmsSections.featureBlocks.map((fb, idx) => {
          const fallbackFb = fallbackData.featureBlocks?.[idx] || fallbackData.featureBlocks?.[0];
          return {
            label: cleanText(fb.label, fallbackFb?.label || ''),
            title: cleanText(fb.title, fallbackFb?.title || ''),
            cta: {
              label: cleanText(fb.cta?.label, fallbackFb?.cta?.label || 'Découvrir'),
              href: fb.cta?.href?.trim() || fallbackFb?.cta?.href || '/catalog',
            },
            image: {
              src: fb.image?.src?.trim() || fallbackFb?.image?.src || '/placeholder.jpg',
              alt: cleanText(fb.image?.alt, fallbackFb?.image?.alt || ''),
            },
          };
        })
      : fallbackData.featureBlocks;

  const story = cmsSections.story
    ? {
        label: cleanText(cmsSections.story.label, fallbackData.story.label),
        title: cleanText(cmsSections.story.title, fallbackData.story.title),
        video: cmsSections.story.video || fallbackData.story.video,
        paragraphs: (() => {
          if (!cmsSections.story.paragraphs || cmsSections.story.paragraphs.length === 0) {
            return fallbackData.story.paragraphs;
          }
          const cleaned = cmsSections.story.paragraphs
            .map((p) => cleanText(p, ''))
            .filter((p) => p.length > 0);
          return cleaned.length > 0 ? cleaned : fallbackData.story.paragraphs;
        })(),
        cta: {
          label: cleanText(cmsSections.story.cta?.label, fallbackData.story.cta?.label || 'Notre histoire'),
          href: cmsSections.story.cta?.href?.trim() || fallbackData.story.cta?.href || '/about-us',
        },
        values: cmsSections.story.values || fallbackData.story.values,
      }
    : fallbackData.story;

  const process = cmsSections.process
    ? {
        label: cleanText(cmsSections.process.label, fallbackData.process.label),
        title: cleanText(cmsSections.process.title, fallbackData.process.title),
        steps:
          cmsSections.process.steps && cmsSections.process.steps.length > 0
            ? cmsSections.process.steps.map((s) => ({
                number: s.number,
                title: cleanText(s.title, ''),
                description: cleanText(s.description, ''),
              }))
            : fallbackData.process.steps,
      }
    : fallbackData.process;

  const quote = cmsSections.quote
    ? {
        text: cleanText(cmsSections.quote.quote, fallbackData.quote.text),
        author: cleanText(cmsSections.quote.author, fallbackData.quote.author),
        role: cleanText(cmsSections.quote.role, fallbackData.quote.role || ''),
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
