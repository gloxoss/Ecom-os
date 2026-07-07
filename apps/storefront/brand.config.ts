import { BrandConfig } from '@ecom-os/brand-config';

export const brandConfig: BrandConfig = {
  name: 'EPIOSO Store',
  logos: {
    light: '/logo-light.svg',
    dark: '/logo-dark.svg',
  },
  colors: {
    primary: '#000000',
    secondary: '#666666',
    accent: '#3b82f6',
    background: '#ffffff',
    foreground: '#111111',
    muted: '#f3f4f6',
  },
  fonts: {
    sans: 'Inter',
    mono: 'monospace',
  },
  radii: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  hero: {
    headline: 'Next-Generation Commerce',
    subheadline: 'Discover our premium collection of curated products designed for modern living.',
    ctaLabel: 'Shop Collection',
    ctaHref: '/catalog',
    image: '/hero-banner.jpg',
  },
  contact: {
    email: 'support@epioso.com',
    phone: '+1 (555) 123-4567',
    address: '123 Commerce St, Suite 100, New York, NY 10001',
  },
  social: {
    instagram: 'https://instagram.com/epioso',
    twitter: 'https://twitter.com/epioso',
  },
};
