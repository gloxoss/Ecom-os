import { RollLink } from '@/components/shared/roll-link';
import { Reveal } from '@/features/landing/ui/reveal';
import { AboutCollectionClient } from './about-collection-client';

interface Tab {
  id: string;
  label: string;
  title: string;
  description: string;
  image: { url: string; alt: string };
}

interface AboutCollectionProps {
  data: {
    label: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
    tabs: Tab[];
  };
}

export function AboutCollection({ data }: AboutCollectionProps) {
  const { label, title, description, cta, tabs } = data;

  return (
    <section className="bg-background py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col gap-5 max-w-[520px] mb-12 md:mb-16">
          <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
            {label}
          </p>
          <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground">
            {title}
          </h2>
          <p data-reveal className="font-body text-base leading-[1.4] text-foreground/70">
            {description}
          </p>
          <div data-reveal>
            <RollLink href={cta.href} label={cta.label} variant="dark" />
          </div>
        </div>

        <AboutCollectionClient tabs={tabs} />
      </Reveal>
    </section>
  );
}
