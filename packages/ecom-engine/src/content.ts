export interface ImageRef {
  src: string;
  alt: string;
}

export interface LinkCta {
  label: string;
  href: string;
}

export interface CategoryNavItem {
  id: string;
  label: string;
  href: string;
}

export interface HeroContentData {
  title: string;
  description: string;
  image: ImageRef;
  categories: CategoryNavItem[];
  cta: LinkCta;
}

export interface CollectionSectionData {
  label: string;
  title: string;
  tabs: Array<{ id: string; label: string }>;
  cta: LinkCta;
}

export interface FeatureBlockData {
  label: string;
  title: string;
  cta: LinkCta;
  image: ImageRef;
}

export interface StorySectionData {
  label: string;
  title: string;
  paragraphs: string[];
  video?: {
    mp4?: string | undefined;
    webm?: string | undefined;
    poster?: string | undefined;
    alt?: string | undefined;
  } | undefined;
  cta?: LinkCta | undefined;
  values?: Array<{ number: string; title: string }> | undefined;
}

export interface ProcessSectionData {
  label: string;
  title: string;
  steps: Array<{ number: string; title: string; description: string }>;
}

export interface QuoteSectionData {
  quote: string;
  author: string;
  role?: string | undefined;
}

export interface BrewSectionData {
  label: string;
  title: string;
  steps?: Array<{ title: string; description: string }> | undefined;
}

export interface ReviewsSectionData {
  label: string;
  title: string;
  reviews?: Array<{ id: string; author: string; rating: number; comment: string }> | undefined;
}

export interface LocationSectionData {
  label: string;
  title: string;
  address: string;
  hours?: string | undefined;
}

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  children?: NavigationItem[] | undefined;
}

export interface BannerData {
  id: string;
  title: string;
  message: string;
  ctaLabel?: string | undefined;
  ctaHref?: string | undefined;
  dismissible: boolean;
}

export interface SeoMetadata {
  title: string;
  description: string;
  canonical?: string | undefined;
  ogImage?: string | undefined;
  noIndex?: boolean | undefined;
}

export interface PageSectionsData {
  hero?: HeroContentData | undefined;
  collection?: CollectionSectionData | undefined;
  featureBlocks?: FeatureBlockData[] | undefined;
  story?: StorySectionData | undefined;
  process?: ProcessSectionData | undefined;
  quote?: QuoteSectionData | undefined;
  brew?: BrewSectionData | undefined;
  reviews?: ReviewsSectionData | undefined;
  location?: LocationSectionData | undefined;
  navigation?: NavigationItem[] | undefined;
  banners?: BannerData[] | undefined;
  seo?: SeoMetadata | undefined;
}

/**
 * Strips script tags, iframes, javascript: URI handlers, and inline event handlers from CMS markup.
 */
export function sanitizeCmsMarkup(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<iframe\b[^>]*>(?:.*?<\/iframe>)?/gi, '');
  sanitized = sanitized.replace(/<object\b[^>]*>(?:.*?<\/object>)?/gi, '');
  sanitized = sanitized.replace(/<embed\b[^>]*>(?:.*?<\/embed>)?/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '');
  return sanitized;
}

/**
 * Validates whether an object conforms to ImageRef.
 */
export function isValidImageRef(val: unknown): val is ImageRef {
  if (!val || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return typeof o.src === 'string' && o.src.trim().length > 0 && typeof o.alt === 'string';
}

/**
 * Validates whether an object conforms to LinkCta.
 */
export function isValidLinkCta(val: unknown): val is LinkCta {
  if (!val || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return typeof o.label === 'string' && o.label.trim().length > 0 && typeof o.href === 'string' && o.href.trim().length > 0;
}

/**
 * Validates whether an object conforms to HeroContentData.
 */
export function isValidHeroContent(val: unknown): val is HeroContentData {
  if (!val || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    o.title.trim().length > 0 &&
    typeof o.description === 'string' &&
    isValidImageRef(o.image) &&
    Array.isArray(o.categories) &&
    isValidLinkCta(o.cta)
  );
}

/**
 * Validates whether an object conforms to StorySectionData.
 */
export function isValidStorySection(val: unknown): val is StorySectionData {
  if (!val || typeof val !== 'object') return false;
  const o = val as Record<string, unknown>;
  return (
    typeof o.label === 'string' &&
    typeof o.title === 'string' &&
    o.title.trim().length > 0 &&
    Array.isArray(o.paragraphs)
  );
}

/**
 * Validates and sanitizes raw CMS section payloads.
 * Returns clean PageSectionsData if valid, or null if corrupt.
 */
export function parseAndValidatePageSections(raw: unknown): PageSectionsData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const obj = raw as Record<string, unknown>;

  const result: PageSectionsData = {};

  if (obj.hero !== undefined) {
    if (!isValidHeroContent(obj.hero)) return null;
    result.hero = {
      title: sanitizeCmsMarkup(obj.hero.title),
      description: sanitizeCmsMarkup(obj.hero.description),
      image: {
        src: obj.hero.image.src,
        alt: sanitizeCmsMarkup(obj.hero.image.alt),
      },
      categories: obj.hero.categories.map((c) => ({
        id: String(c.id),
        label: sanitizeCmsMarkup(c.label),
        href: String(c.href),
      })),
      cta: {
        label: sanitizeCmsMarkup(obj.hero.cta.label),
        href: String(obj.hero.cta.href),
      },
    };
  }

  if (obj.collection !== undefined) {
    if (typeof obj.collection !== 'object' || obj.collection === null) return null;
    const col = obj.collection as Record<string, unknown>;
    if (typeof col.title !== 'string' || typeof col.label !== 'string') return null;
    result.collection = {
      label: sanitizeCmsMarkup(col.label),
      title: sanitizeCmsMarkup(col.title),
      tabs: Array.isArray(col.tabs)
        ? col.tabs.map((t: Record<string, unknown>) => ({
            id: String(t.id ?? ''),
            label: sanitizeCmsMarkup(String(t.label ?? '')),
          }))
        : [],
      cta: isValidLinkCta(col.cta) ? col.cta : { label: 'Voir tout', href: '/catalog' },
    };
  }

  if (obj.featureBlocks !== undefined) {
    if (!Array.isArray(obj.featureBlocks)) return null;
    result.featureBlocks = obj.featureBlocks
      .filter((b): b is Record<string, unknown> => typeof b === 'object' && b !== null)
      .map((b) => ({
        label: sanitizeCmsMarkup(String(b.label ?? '')),
        title: sanitizeCmsMarkup(String(b.title ?? '')),
        cta: isValidLinkCta(b.cta) ? b.cta : { label: 'Voir', href: '/catalog' },
        image: isValidImageRef(b.image) ? b.image : { src: '/placeholder.jpg', alt: '' },
      }));
  }

  if (obj.story !== undefined) {
    if (!isValidStorySection(obj.story)) return null;
    result.story = {
      label: sanitizeCmsMarkup(obj.story.label),
      title: sanitizeCmsMarkup(obj.story.title),
      paragraphs: obj.story.paragraphs.map((p) => sanitizeCmsMarkup(p)),
      ...(obj.story.cta ? { cta: obj.story.cta } : {}),
      ...(obj.story.video ? { video: obj.story.video } : {}),
      ...(obj.story.values ? { values: obj.story.values } : {}),
    };
  }

  if (obj.process !== undefined && typeof obj.process === 'object' && obj.process !== null) {
    const pr = obj.process as Record<string, unknown>;
    result.process = {
      label: sanitizeCmsMarkup(String(pr.label ?? '')),
      title: sanitizeCmsMarkup(String(pr.title ?? '')),
      steps: Array.isArray(pr.steps)
        ? pr.steps.map((s: Record<string, unknown>) => ({
            number: String(s.number ?? ''),
            title: sanitizeCmsMarkup(String(s.title ?? '')),
            description: sanitizeCmsMarkup(String(s.description ?? '')),
          }))
        : [],
    };
  }

  if (obj.quote !== undefined && typeof obj.quote === 'object' && obj.quote !== null) {
    const q = obj.quote as Record<string, unknown>;
    result.quote = {
      quote: sanitizeCmsMarkup(String(q.quote ?? '')),
      author: sanitizeCmsMarkup(String(q.author ?? '')),
      ...(q.role ? { role: sanitizeCmsMarkup(String(q.role)) } : {}),
    };
  }

  if (obj.seo !== undefined && typeof obj.seo === 'object' && obj.seo !== null) {
    const s = obj.seo as Record<string, unknown>;
    result.seo = {
      title: sanitizeCmsMarkup(String(s.title ?? '')),
      description: sanitizeCmsMarkup(String(s.description ?? '')),
      ...(s.canonical ? { canonical: String(s.canonical) } : {}),
      ...(s.ogImage ? { ogImage: String(s.ogImage) } : {}),
      ...(typeof s.noIndex === 'boolean' ? { noIndex: s.noIndex } : {}),
    };
  }

  return result;
}
