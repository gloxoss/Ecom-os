import { BrandConfig } from '@ecom-os/brand-config';

export const brandConfig: BrandConfig = {
  name: 'Angelina Paris',
  theme: 'angelina',
  logos: {
    light: '/logo-angelina.svg',
    dark: '/logo-angelina-dark.svg',
  },
  colors: {
    primary: '#aa631a',
    secondary: '#c69951',
    accent: '#ffcebf',
    background: '#ffffff',
    foreground: '#3f100a',
    muted: '#d9a594',
  },
  fonts: {
    sans: 'Inter Tight Variable',
    mono: 'monospace',
  },
  radii: {
    sm: '12px',
    md: '16px',
    lg: '20px',
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
