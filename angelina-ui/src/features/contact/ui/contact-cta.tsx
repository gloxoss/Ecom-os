import { CtaCollage, type CtaCollageData } from '@/components/shared/cta-collage';

export function ContactCta({ data }: { data: CtaCollageData }) {
  return <CtaCollage data={data} />;
}
