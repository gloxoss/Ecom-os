import Image from 'next/image';
import { Reveal } from '@/features/landing/ui/reveal';

interface AboutJourneyProps {
  data: {
    label: string;
    title: string;
    titleAccent: string;
    description: string;
    image: { url: string; alt: string };
    features: { title: string; text: string }[];
  };
}

export function AboutJourney({ data }: AboutJourneyProps) {
  const { label, title, titleAccent, description, image, features } = data;

  return (
    <section className="bg-primary py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 mb-10 md:mb-12">
          <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-primary-foreground shrink-0">
            {label}
          </p>
          <div className="flex flex-col gap-5 md:max-w-[520px]">
            <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.2] tracking-[-1px] text-primary-foreground">
              {title}
              <br />
              {titleAccent}
            </h2>
            <p data-reveal className="font-body text-base leading-[1.4] text-primary-foreground/80">
              {description}
            </p>
          </div>
        </div>

        <div data-reveal className="relative overflow-hidden rounded-2xl h-[360px] md:h-[460px]">
          <div data-reveal-parallax-zoom className="absolute inset-0">
            <Image src={image.url} alt={image.alt} fill sizes="100vw" className="object-cover" />
          </div>
          <div className="absolute inset-0 bg-foreground/35" />

          <div className="absolute inset-x-0 bottom-0 grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 p-6 md:p-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex flex-col gap-1">
                <p className="font-body text-xs font-medium uppercase tracking-[1.4px] text-background">
                  {feature.title}
                </p>
                <p className="font-body text-xs leading-[1.4] text-background/75">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
