import type { BrandConfig } from '@ecom-os/brand-config';

export const brandConfig: BrandConfig = {
  name: 'test-project',
  colors: {
    primary: '#1a1a1a',
    secondary: '#6b7280',
    background: '#ffffff',
    foreground: '#1a1a1a',
    muted: '#f9fafb',
    border: '#e5e7eb',
  },
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'ui-monospace, monospace',
  },
  radii: { sm: '0.25rem', md: '0.375rem', lg: '0.5rem' },
  hero: {
    headline: 'Welcome to test-project',
    subheadline: 'Discover our collection.',
    ctaLabel: 'Shop Now',
    ctaHref: '/catalog',
  },
};
