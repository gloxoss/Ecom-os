import { describe, it, expect } from 'vitest';
import {
  sanitizeCmsMarkup,
  parseAndValidatePageSections,
  isValidHeroContent,
  isValidStorySection,
  isValidImageRef,
  isValidLinkCta,
  type PageSectionsData,
} from '../content';
import { FakeEngine } from '../fake-engine';

describe('Ecom-Engine CMS Content (ECO-403)', () => {
  describe('HTML markup sanitizer (sanitizeCmsMarkup)', () => {
    it('strips script tags and executable JavaScript', () => {
      const malicious = '<p>Welcome!</p><script>alert("xss")</script><script src="evil.js"></script>';
      const sanitized = sanitizeCmsMarkup(malicious);
      expect(sanitized).toBe('<p>Welcome!</p>');
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('alert');
    });

    it('strips javascript: pseudoprotocol URIs', () => {
      const malicious = '<a href="javascript:void(0)" onclick="alert(1)">Click me</a>';
      const sanitized = sanitizeCmsMarkup(malicious);
      expect(sanitized).not.toContain('javascript:');
      expect(sanitized).not.toContain('onclick');
    });

    it('strips inline event handlers (onerror, onload, onmouseover)', () => {
      const malicious = '<img src="valid.png" onerror="alert(1)" onload="alert(2)" />';
      const sanitized = sanitizeCmsMarkup(malicious);
      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('onload');
    });

    it('strips iframe, embed, and object tags', () => {
      const malicious = '<div><iframe src="https://evil.com"></iframe><embed src="evil.swf" /><object data="evil"></object></div>';
      const sanitized = sanitizeCmsMarkup(malicious);
      expect(sanitized).not.toContain('<iframe');
      expect(sanitized).not.toContain('<embed');
      expect(sanitized).not.toContain('<object');
    });

    it('preserves clean markup and plain text', () => {
      const clean = '<p><strong>Qualité artisanale</strong> garantie par nos maîtres chocolatiers.</p>';
      expect(sanitizeCmsMarkup(clean)).toBe(clean);
    });

    it('returns empty string for falsy or non-string inputs', () => {
      expect(sanitizeCmsMarkup('')).toBe('');
      // @ts-expect-error test invalid input type
      expect(sanitizeCmsMarkup(null)).toBe('');
    });
  });

  describe('Validation predicates', () => {
    it('validates image refs and link CTAs', () => {
      expect(isValidImageRef({ src: '/img.png', alt: 'Test' })).toBe(true);
      expect(isValidImageRef({ src: '', alt: 'Test' })).toBe(false);
      expect(isValidImageRef(null)).toBe(false);

      expect(isValidLinkCta({ label: 'Buy', href: '/catalog' })).toBe(true);
      expect(isValidLinkCta({ label: '', href: '/catalog' })).toBe(false);
    });

    it('validates a complete Hero section', () => {
      const validHero = {
        title: 'Maison Angelina',
        description: 'Chocolat chaud et pâtisseries fines depuis 1903.',
        image: {
          src: '/assets/hero.webp',
          alt: 'Chocolat chaud Angelina',
        },
        categories: [
          { id: 'patisseries', label: 'Pâtisseries', href: '/menu' },
        ],
        cta: {
          label: 'Découvrir',
          href: '/catalog',
        },
      };

      expect(isValidHeroContent(validHero)).toBe(true);
      expect(isValidHeroContent({ title: '' })).toBe(false);
    });

    it('validates a complete Story section', () => {
      const validStory = {
        label: 'Notre Histoire',
        title: 'Un siècle de raffinement parisien',
        paragraphs: [
          'Fondée en 1903 par Anton Rumpelmayer...',
          'Lieu de rencontre des artistes et écrivains.',
        ],
        cta: {
          label: 'En savoir plus',
          href: '/about',
        },
      };

      expect(isValidStorySection(validStory)).toBe(true);
      expect(isValidStorySection({ title: 'Story' })).toBe(false);
    });
  });

  describe('Page sections parser (parseAndValidatePageSections)', () => {
    it('parses and sanitizes valid PageSectionsData', () => {
      const raw = {
        hero: {
          title: 'Titre CMS<script>alert(1)</script>',
          description: 'Description CMS',
          image: { src: '/img.jpg', alt: 'Alt text' },
          categories: [{ id: '1', label: 'Cat 1', href: '/cat' }],
          cta: { label: 'Action', href: '/catalog' },
        },
      };

      const result = parseAndValidatePageSections(raw);
      expect(result).not.toBeNull();
      expect(result?.hero?.title).toBe('Titre CMS');
      expect(result?.hero?.title).not.toContain('<script');
    });

    it('returns null gracefully on malformed or non-object payload', () => {
      expect(parseAndValidatePageSections(null)).toBeNull();
      expect(parseAndValidatePageSections('invalid string')).toBeNull();
      expect(parseAndValidatePageSections({ hero: { title: 12345 } })).toBeNull();
    });
  });

  describe('FakeEngine CMS methods', () => {
    it('returns default content from FakeEngine.getContent', async () => {
      const engine = new FakeEngine();
      const content = await engine.getContent('banners');
      expect(content).not.toBeNull();
      expect(content?.slot).toBe('banners');
    });

    it('returns structured page sections from FakeEngine.getPageSections', async () => {
      const engine = new FakeEngine();
      const sections = await engine.getPageSections('home');
      expect(sections).not.toBeNull();
      expect(sections?.hero?.title).toBe('Bienvenue chez Angelina');
      expect(sections?.collection?.label).toBe('Nos Produits');
    });
  });
});
