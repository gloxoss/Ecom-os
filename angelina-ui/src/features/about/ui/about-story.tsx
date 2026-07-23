import Image from 'next/image';
import { RollLink } from '@/components/shared/roll-link';
import { Reveal } from '@/features/landing/ui/reveal';

interface AboutStoryProps {
  data: {
    label: string;
    title: string;
    images: { url: string; alt: string }[];
    paragraphs: { intro: string; outro: string };
    cta: { label: string; href: string };
  };
}

export function AboutStory({ data }: AboutStoryProps) {
  const { label, title, images, paragraphs, cta } = data;

  return (
    <section className="bg-background py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col items-center text-center gap-5 max-w-[720px] mx-auto mb-16 md:mb-20">
          <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
            {label}
          </p>
          <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground">
            {title}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div className="flex flex-col gap-6">
            <div data-reveal-parallax-zoom className="relative overflow-hidden rounded-2xl aspect-4/3">
              <Image src={images[0].url} alt={images[0].alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            </div>
            <p data-reveal className="font-body text-base leading-[1.4] text-foreground/70">
              {paragraphs.outro}
            </p>
            <div data-reveal>
              <RollLink href={cta.href} label={cta.label} variant="dark" />
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <p data-reveal className="font-body text-base leading-[1.4] text-foreground/70">
              {paragraphs.intro}
            </p>
            <div data-reveal-parallax-zoom className="relative overflow-hidden rounded-2xl aspect-4/3">
              <Image src={images[1].url} alt={images[1].alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
