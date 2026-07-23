import Image from 'next/image';
import { RollLink } from '@/components/shared/roll-link';
import { Reveal } from '@/features/landing/ui/reveal';
import { CatalogHeroClient } from './catalog-hero-client';

interface CatalogHeroProps {
  data: {
    title: string;
    description: string;
    cta: { label: string; href: string };
    image: { url: string; alt: string };
  };
}

export function CatalogHero({ data }: CatalogHeroProps) {
  const { title, description, cta, image } = data;

  return (
    <CatalogHeroClient>
      <section className="relative min-h-[420px] md:min-h-[480px] flex flex-col justify-between overflow-hidden">
        <Image
          data-hero-photo
          src={image.url}
          alt={image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-foreground/60 via-foreground/30 to-background" />

        <Reveal className="relative z-[2] w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10 pt-[130px] pb-10 flex-1 flex flex-col justify-between">
          <p data-reveal className="font-body text-sm leading-[1.4] text-background/85 max-w-[360px] self-end text-right">
            {description}
          </p>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h1 data-reveal className="font-heading text-[36px] md:text-[46px] lg:text-[52px] leading-[1.1] tracking-tight text-background">
              {title}
            </h1>
            <div data-reveal className="shrink-0">
              <RollLink href={cta.href} label={cta.label} variant="glass" />
            </div>
          </div>
        </Reveal>
      </section>
    </CatalogHeroClient>
  );
}
