import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Reveal } from '@/features/landing/ui/reveal';
import { Accordion } from '@/components/shared/accordion';

interface AboutFaqProps {
  data: {
    description: string;
    viewAll: { label: string; href: string };
    image: { url: string; alt: string };
    title: string;
    items: { question: string; answer: string }[];
  };
}

export function AboutFaq({ data }: AboutFaqProps) {
  const { description, viewAll, image, title, items } = data;

  return (
    <section className="bg-background py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">
          <div className="flex flex-col gap-6">
            <div data-reveal className="relative overflow-hidden rounded-2xl aspect-4/5">
              <Image src={image.url} alt={image.alt} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />
            </div>
            <p data-reveal className="font-body text-sm leading-[1.4] text-foreground/60 max-w-[360px]">
              {description}
            </p>
            <Link
              data-reveal
              href={viewAll.href}
              className="group inline-flex items-center gap-2 font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground w-fit"
            >
              {viewAll.label}
              <ArrowUpRight size={16} strokeWidth={1.75} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Link>
          </div>

          <div className="flex flex-col gap-8">
            <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.25] tracking-[-1px] text-foreground max-w-[420px]">
              {title}
            </h2>
            <Accordion
              items={items.map((i) => ({ title: i.question, content: i.answer }))}
              animateRows
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
