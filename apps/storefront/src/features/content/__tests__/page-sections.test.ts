import { describe, it, expect } from 'vitest';
import { resolvePageContent } from '../ui/page-sections';
import type { PageSectionsData } from '@ecom-os/engine';

const sampleFallbackData = {
  hero: {
    title: 'Fallback Hero Title',
    description: 'Fallback Description',
    image: { src: '/fallback-hero.jpg', alt: 'Fallback Alt' },
    categories: [{ id: 'all', label: 'All', href: '/catalog' }],
    cta: { label: 'Explore', href: '/catalog' },
  },
  collection: {
    label: 'Fallback Collection',
    title: 'Fallback Products',
    tabs: [{ id: '1', label: 'Tab 1' }],
    cta: { label: 'View All', href: '/catalog' },
  },
  featureBlocks: [
    {
      label: 'Feature 1',
      title: 'Desc 1',
      cta: { label: 'Go', href: '/go' },
      image: { src: '/fb.jpg', alt: 'FB' },
    },
  ],
  story: {
    label: 'Fallback Story',
    title: 'Our Heritage',
    paragraphs: ['P1', 'P2'],
    cta: { label: 'Read More', href: '/about' },
  },
  process: {
    label: 'Our Process',
    title: 'How we craft',
    steps: [{ number: '01', title: 'Step 1', description: 'Desc 1' }],
  },
  quote: {
    text: 'A great quote',
    author: 'Author',
    role: 'Founder',
  },
  brew: { guide: {} },
  reviews: { list: [] },
  location: { address: 'Paris' },
};

describe('Storefront CMS PageSections Resolution (ECO-403)', () => {
  it('returns exact fallback data when CMS sections are null (offline/unconfigured fallback)', () => {
    const resolved = resolvePageContent(null, sampleFallbackData);
    expect(resolved).toEqual(sampleFallbackData);
  });

  it('overrides hero content with dynamic CMS data', () => {
    const cmsSections: PageSectionsData = {
      hero: {
        title: 'Nouvelle Collection Printemps 2026',
        description: 'Édition limitée disponible dès aujourd’hui.',
        image: { src: '/assets/spring.webp', alt: 'Spring collection' },
        categories: [
          { id: 'nouveautes', label: 'Nouveautés', href: '/catalog?cat=new' },
        ],
        cta: { label: 'Commander maintenant', href: '/catalog' },
      },
    };

    const resolved = resolvePageContent(cmsSections, sampleFallbackData);
    expect(resolved.hero.title).toBe('Nouvelle Collection Printemps 2026');
    expect(resolved.hero.description).toBe('Édition limitée disponible dès aujourd’hui.');
    expect(resolved.hero.image.src).toBe('/assets/spring.webp');
    expect(resolved.hero.categories[0].label).toBe('Nouveautés');
    // Non-overridden sections retain fallback
    expect(resolved.collection.title).toBe(sampleFallbackData.collection.title);
  });

  it('sanitizes malicious markup in CMS content before returning', () => {
    const maliciousCms: PageSectionsData = {
      hero: {
        title: 'Safe Title<script>alert("hacked")</script>',
        description: 'Safe Description <img src=x onerror=alert(1)>',
        image: { src: '/hero.jpg', alt: 'Alt' },
        categories: [],
        cta: { label: 'Click', href: '/cat' },
      },
    };

    const resolved = resolvePageContent(maliciousCms, sampleFallbackData);
    expect(resolved.hero.title).toBe('Safe Title');
    expect(resolved.hero.title).not.toContain('<script');
    expect(resolved.hero.description).not.toContain('onerror');
  });

  it('merges dynamic feature blocks, story paragraphs, and process steps', () => {
    const cmsSections: PageSectionsData = {
      featureBlocks: [
        {
          label: 'Artisanat Local',
          title: 'Fabriqué à Paris selon les méthodes ancestrales.',
          cta: { label: 'En savoir plus', href: '/craft' },
          image: { src: '/craft.jpg', alt: 'Craft' },
        },
      ],
      story: {
        label: 'Maison Fondée en 1903',
        title: 'Plus d’un siècle de tradition.',
        paragraphs: ['Nouveau paragraphe géré depuis WordPress.'],
      },
      quote: {
        quote: 'Le meilleur chocolat chaud de Paris.',
        author: 'Guide Gourmand',
      },
    };

    const resolved = resolvePageContent(cmsSections, sampleFallbackData);
    expect(resolved.featureBlocks[0].title).toBe('Fabriqué à Paris selon les méthodes ancestrales.');
    expect(resolved.story.paragraphs[0]).toBe('Nouveau paragraphe géré depuis WordPress.');
    expect(resolved.quote.text).toBe('Le meilleur chocolat chaud de Paris.');
  });

  it('honestly falls back to defaults when CMS values are whitespace or empty strings', () => {
    const emptyCms: PageSectionsData = {
      hero: {
        title: '   ',
        description: '',
        image: { src: '', alt: '   ' },
        categories: [],
        cta: { label: '  ', href: '' },
      },
      collection: {
        label: ' ',
        title: '',
        tabs: [],
        cta: { label: '', href: '' },
      },
      story: {
        label: '  ',
        title: '',
        paragraphs: ['   ', ''],
        cta: { label: '', href: '' },
      },
    };

    const resolved = resolvePageContent(emptyCms, sampleFallbackData);
    expect(resolved.hero.title).toBe(sampleFallbackData.hero.title);
    expect(resolved.hero.description).toBe(sampleFallbackData.hero.description);
    expect(resolved.hero.image.src).toBe(sampleFallbackData.hero.image.src);
    expect(resolved.hero.image.alt).toBe(sampleFallbackData.hero.image.alt);
    expect(resolved.hero.categories).toEqual(sampleFallbackData.hero.categories);
    expect(resolved.collection.title).toBe(sampleFallbackData.collection.title);
    expect(resolved.collection.tabs).toEqual(sampleFallbackData.collection.tabs);
    expect(resolved.story.title).toBe(sampleFallbackData.story.title);
    expect(resolved.story.paragraphs).toEqual(sampleFallbackData.story.paragraphs);
  });
});

