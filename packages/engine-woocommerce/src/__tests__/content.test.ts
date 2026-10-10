import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  resolveWordPressCmsBaseUrl,
  fetchCmsContent,
  fetchPageSections,
} from '../content';
import { WooCommerceEngine } from '../client';

describe('WooCommerceEngine CMS Content (ECO-403)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('resolveWordPressCmsBaseUrl', () => {
    it('resolves origin from WORDPRESS_URL', () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com/subpath';
      expect(resolveWordPressCmsBaseUrl()).toBe('https://cms.example.com');
    });

    it('falls back to WC_REST_URL origin if WORDPRESS_URL is not set', () => {
      delete process.env.WORDPRESS_URL;
      process.env.WC_REST_URL = 'https://woo.example.com/wp-json/wc/v3';
      expect(resolveWordPressCmsBaseUrl()).toBe('https://woo.example.com');
    });

    it('returns null if neither is configured', () => {
      delete process.env.WORDPRESS_URL;
      delete process.env.WP_URL;
      delete process.env.WC_REST_URL;
      expect(resolveWordPressCmsBaseUrl()).toBeNull();
    });
  });

  describe('fetchCmsContent', () => {
    it('returns null gracefully if no base URL is resolved', async () => {
      delete process.env.WORDPRESS_URL;
      delete process.env.WP_URL;
      delete process.env.WC_REST_URL;

      const result = await fetchCmsContent('home');
      expect(result).toBeNull();
    });

    it('fetches slot from WordPress REST API and returns structured data', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      const mockPayload = {
        slot: 'home',
        data: {
          hero: {
            title: 'Maison Angelina',
            description: 'Haute Pâtisserie Parisienne',
            image: { src: '/img.jpg', alt: 'Alt' },
            categories: [{ id: '1', label: 'Cat', href: '/c' }],
            cta: { label: 'Voir', href: '/catalog' },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      } as Response);

      const result = await fetchCmsContent('home');
      expect(result).toEqual(mockPayload.data);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://cms.example.com/wp-json/epioso/v1/content/home',
        expect.objectContaining({
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        })
      );
    });

    it('handles 404 or network errors gracefully without crashing', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const result = await fetchCmsContent('non_existent_slot');
      expect(result).toBeNull();
    });

    it('handles fetch reject/timeout gracefully', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await fetchCmsContent('home');
      expect(result).toBeNull();
    });
  });

  describe('fetchPageSections', () => {
    it('validates and returns clean PageSectionsData from CMS response', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      const mockPayload = {
        slot: 'home',
        data: {
          hero: {
            title: 'Chocolat Chaud L’Africain',
            description: 'Recette historique depuis 1903',
            image: { src: '/assets/hot-chocolate.jpg', alt: 'Chocolat chaud' },
            categories: [{ id: 'chocolat', label: 'Chocolats', href: '/catalog' }],
            cta: { label: 'Commander', href: '/catalog' },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      } as Response);

      const sections = await fetchPageSections('home');
      expect(sections).not.toBeNull();
      expect(sections?.hero?.title).toBe('Chocolat Chaud L’Africain');
    });

    it('returns null if CMS payload fails schema validation', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      const corruptPayload = {
        slot: 'home',
        data: {
          hero: {
            title: 99999, // invalid type
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => corruptPayload,
      } as Response);

      const sections = await fetchPageSections('home');
      expect(sections).toBeNull();
    });
  });

  describe('WooCommerceEngine delegation', () => {
    it('delegates getContent and getPageSections to content functions', async () => {
      process.env.WORDPRESS_URL = 'https://cms.example.com';

      const mockPayload = {
        data: {
          hero: {
            title: 'Titre',
            description: 'Desc',
            image: { src: '/img.jpg', alt: 'alt' },
            categories: [],
            cta: { label: 'Go', href: '/catalog' },
          },
        },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockPayload,
      } as Response);

      const engine = new WooCommerceEngine();
      const sections = await engine.getPageSections('home');
      expect(sections?.hero?.title).toBe('Titre');
    });
  });
});
