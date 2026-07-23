import Image from 'next/image';
import { RollLink } from '@/components/shared/roll-link';
import { Reveal } from '@/features/landing/ui/reveal';

interface AboutHeroProps {
  data: {
    title: string;
    locationLabel: string;
    description: string;
    cta: { label: string; href: string };
    image: { url: string; alt: string };
  };
}

export function AboutHero({ data }: AboutHeroProps) {
  const { title, locationLabel, description, cta, image } = data;

  return (
    <section className="relative min-h-[520px] md:min-h-[600px] flex items-end overflow-hidden">
      <Image src={image.url} alt={image.alt} fill priority sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-foreground/45" />

      <Reveal className="relative z-[2] w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10 pt-[160px] pb-16">
        <div className="flex flex-col gap-16 md:gap-20">
          <h1 data-reveal className="font-heading text-[40px] md:text-[52px] lg:text-[60px] leading-[1.05] tracking-tight text-background max-w-[720px]">
            {title}
          </h1>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-background/80">
              {locationLabel}
            </p>
            <div className="flex flex-col md:flex-row md:items-end gap-8 md:gap-16 max-w-[520px]">
              <p data-reveal className="font-body text-base leading-[1.4] text-background/85">
                {description}
              </p>
              <div data-reveal className="shrink-0">
                <RollLink href={cta.href} label={cta.label} variant="glass" />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
