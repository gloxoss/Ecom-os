export interface BrandStory {
  slug: string;
  name: string;
  isOwned: boolean;
  origin: string;
  storyMarkdown: string;
  warrantyPolicy?: string;
  documents?: Array<{
    title: string;
    url: string;
    type: 'pdf' | 'spec_sheet' | 'certificate';
  }>;
}

/**
 * Curated brand stories for ParaLoca catalog presentation.
 * Invariant: Brand classification and narrative are metadata projections
 * that do not alter product pricing, inventory, or cart behavior.
 */
export const paralocaBrandStories: Record<string, BrandStory> = {
  paraloca: {
    slug: 'paraloca',
    name: 'ParaLoca Équipements',
    isOwned: true,
    origin: 'Maroc',
    storyMarkdown:
      'ParaLoca conçoit et sélectionne des équipements médicaux fiables et ergonomiques spécialement adaptés aux réalités du maintien à domicile au Maroc. Chaque dispositif est vérifié pour assurer sécurité, robustesse et longévité.',
    warrantyPolicy: 'Garantie constructeur 24 mois avec service après-vente local à Casablanca.',
    documents: [
      {
        title: 'Guide d’utilisation & entretien matériel',
        url: '/docs/paraloca-guide-maintien.pdf',
        type: 'pdf',
      },
      {
        title: 'Fiche technique homologation',
        url: '/docs/paraloca-spec-fauteuil.pdf',
        type: 'spec_sheet',
      },
    ],
  },
  rossmax: {
    slug: 'rossmax',
    name: 'Rossmax Healthcare',
    isOwned: false,
    origin: 'Suisse',
    storyMarkdown:
      'Fabricant helvétique de référence en technologie de diagnostic cardiovasculaire et de monitorage clinique de précision.',
    warrantyPolicy: 'Garantie internationale standard constructeur 36 mois.',
  },
  omron: {
    slug: 'omron',
    name: 'Omron Healthcare',
    isOwned: false,
    origin: 'Japon',
    storyMarkdown:
      'Technologie japonaise pionnière en capteurs biométriques et tensiomètres cliniquement validés.',
    warrantyPolicy: 'Garantie internationale standard constructeur 36 mois.',
  },
};

export function isOwnedBrand(slug: string): boolean {
  return Boolean(paralocaBrandStories[slug]?.isOwned);
}

export function getBrandStory(slug: string): BrandStory | null {
  return paralocaBrandStories[slug] || null;
}

export function validateBrandStoryMetadata(input: unknown): BrandStory {
  if (typeof input !== 'object' || input === null) {
    throw new Error('Brand story metadata must be a non-null object');
  }
  const story = input as Partial<BrandStory>;
  if (!story.slug || !story.name || typeof story.isOwned !== 'boolean') {
    throw new Error('Brand story metadata missing required fields (slug, name, isOwned)');
  }
  return story as BrandStory;
}
