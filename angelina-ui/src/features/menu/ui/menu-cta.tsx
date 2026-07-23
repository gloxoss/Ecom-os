import { CtaCollage, type CtaCollageData } from '@/components/shared/cta-collage';

export function MenuCta({ data }: { data: CtaCollageData }) {
  return <CtaCollage data={data} withOrbit />;
}
