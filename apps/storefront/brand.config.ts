import { BrandConfig } from '@ecom-os/brand-config';

/**
 * ParaLoca brand tokens for this instance. Colors, radii and hero copy mirror
 * clients/paraloca/profile.ts. Contact details are intentionally omitted: they stay
 * UNAPPROVED in clients/paraloca/content-approval.md until the owner signs them off.
 * Logo files do not exist yet (owner asset): the storefront shows a text wordmark.
 */
export const brandConfig: BrandConfig = {
  name: 'ParaLoca',
  theme: 'paraloca',
  logos: {
    light: '/brands/paraloca/logo-light.svg',
    dark: '/brands/paraloca/logo-dark.svg',
  },
  colors: {
    primary: '#171817',
    secondary: '#595D5A',
    accent: '#276C61',
    background: '#FFFFFF',
    foreground: '#171817',
    muted: '#F6F6F4',
  },
  fonts: {
    sans: 'Inter Tight Variable',
    mono: 'monospace',
  },
  radii: {
    sm: '6px',
    md: '12px',
    lg: '18px',
  },
  hero: {
    headline: "Pour chaque jour, l'essentiel du soin.",
    subheadline:
      'Équipements médicaux de précision et matériel de maintien à domicile pour particuliers et professionnels de santé au Maroc.',
    ctaLabel: 'Découvrir les équipements',
    ctaHref: '/catalog',
    image: '/brands/paraloca/hero-care.jpg',
  },
  // Required by the schema but never rendered from this file. Deliberately fake until the
  // owner approves the real contact facts (see clients/paraloca/content-approval.md).
  contact: {
    email: 'unapproved@paraloca.invalid',
    phone: 'UNAPPROVED',
    address: 'UNAPPROVED',
  },
};
