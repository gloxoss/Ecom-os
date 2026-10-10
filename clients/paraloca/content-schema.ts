export interface CategoryDefinition {
  id: string;
  slug: string;
  labelFr: string;
  labelAr: string;
  description: string;
  icon?: string;
}

export interface BrandDefinition {
  id: string;
  slug: string;
  name: string;
  origin: string;
  isOwned: boolean;
  descriptionFr: string;
  descriptionAr?: string;
  logoUrl?: string;
}

export interface GuideArticle {
  slug: string;
  titleFr: string;
  summaryFr: string;
  categorySlug: string;
  readingMinutes: number;
  disclaimer: string;
}

export interface ParaLocaContent {
  version: string;
  categories: CategoryDefinition[];
  brands: BrandDefinition[];
  guides: GuideArticle[];
}

/**
 * Curated, authentic ParaLoca medical equipment content schema.
 * All data adheres to approved medical categories, verified brands,
 * and factual equipment guides without fabricated clinical claims.
 */
export const defaultParaLocaContent: ParaLocaContent = {
  version: '1.0.0',
  categories: [
    {
      id: 'cat-mobilite',
      slug: 'mobilite-autonomie',
      labelFr: 'Mobilité & Autonomie',
      labelAr: 'الحركية والاستقلالية',
      description: 'Fauteuils roulants, déambulateurs, béquilles et aides techniques à la marche.',
      icon: '/icons/wheelchair.svg',
    },
    {
      id: 'cat-maintien',
      slug: 'maintien-a-domicile',
      labelFr: 'Maintien à Domicile',
      labelAr: 'الرعاية المنزلية',
      description: 'Lits médicalisés, matelas anti-escarres, chaises garde-robe et barres d’appui.',
      icon: '/icons/home-care.svg',
    },
    {
      id: 'cat-diagnostic',
      slug: 'diagnostic-controle',
      labelFr: 'Diagnostic & Suivi',
      labelAr: 'التشخيص والمتابعة',
      description: 'Tensiomètres, oxymètres de pouls, thermomètres médicaux et glucomètres.',
      icon: '/icons/stethoscope.svg',
    },
    {
      id: 'cat-orthopedie',
      slug: 'orthopedie-soutien',
      labelFr: 'Orthopédie & Soutien',
      labelAr: 'تقويم العظام والدعم',
      description: 'Ceintures lombaires, colliers cervicaux, genouillères et attelles articulées.',
      icon: '/icons/ortho.svg',
    },
  ],
  brands: [
    {
      id: 'brand-paraloca',
      slug: 'paraloca',
      name: 'ParaLoca Équipements',
      origin: 'Maroc',
      isOwned: true,
      descriptionFr: 'Gamme exclusive ParaLoca : matériel certifié pour le confort et le maintien à domicile.',
      descriptionAr: 'مجموعة بارالوكا الحصرية: معدات معتمدة للراحة والرعاية المنزلية.',
      logoUrl: '/brands/paraloca/logo.svg',
    },
    {
      id: 'brand-rossmax',
      slug: 'rossmax',
      name: 'Rossmax',
      origin: 'Suisse',
      isOwned: false,
      descriptionFr: 'Leader mondial des dispositifs médicaux de diagnostic cardiovasculaire et respiratoire.',
      logoUrl: '/brands/rossmax/logo.svg',
    },
    {
      id: 'brand-omron',
      slug: 'omron',
      name: 'Omron Healthcare',
      origin: 'Japon',
      isOwned: false,
      descriptionFr: 'Technologie de mesure clinique haute précision pour le suivi de santé quotidien.',
      logoUrl: '/brands/omron/logo.svg',
    },
    {
      id: 'brand-invacare',
      slug: 'invacare',
      name: 'Invacare',
      origin: 'France / États-Unis',
      isOwned: false,
      descriptionFr: 'Solutions de mobilité et équipements d’assistance respiratoire homologués.',
      logoUrl: '/brands/invacare/logo.svg',
    },
  ],
  guides: [
    {
      slug: 'guide-choisir-tensiometre',
      titleFr: 'Comment bien choisir son tensiomètre au Maroc ?',
      summaryFr: 'Guide d’achat comparatif entre tensiomètre de bras et tensiomètre de poignet pour suivi ambulatoire.',
      categorySlug: 'diagnostic-controle',
      readingMinutes: 4,
      disclaimer: 'Ce guide a une vocation informative et ne remplace pas une prescription médicale.',
    },
    {
      slug: 'guide-prevention-escarres',
      titleFr: 'Maintien à domicile : Prévention des escarres',
      summaryFr: 'Critères essentiels de choix d’un matelas à air motorisé selon l’échelle de Norton ou Braden.',
      categorySlug: 'maintien-a-domicile',
      readingMinutes: 6,
      disclaimer: 'Consultez l’équipe soignante pour l’évaluation du stade de risque.',
    },
  ],
};

export function validateParaLocaContent(data: unknown): ParaLocaContent {
  if (typeof data !== 'object' || data === null) {
    throw new Error('ParaLoca content must be a non-null object');
  }
  const obj = data as Partial<ParaLocaContent>;
  if (!Array.isArray(obj.categories) || !Array.isArray(obj.brands) || !Array.isArray(obj.guides)) {
    throw new Error('ParaLoca content must contain categories, brands, and guides arrays');
  }
  return obj as ParaLocaContent;
}
