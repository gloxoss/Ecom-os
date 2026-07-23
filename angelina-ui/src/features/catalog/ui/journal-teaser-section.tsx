import Image from 'next/image';
import { RollLink } from '@/components/shared/roll-link';
import { Reveal } from '@/features/landing/ui/reveal';

interface Article {
  date: string;
  title: string;
  excerpt: string;
  image: { url: string; alt: string };
}

interface JournalTeaserSectionProps {
  data: {
    label: string;
    title: string;
    titleAccent: string;
    cta: { label: string; href: string };
    articles: Article[];
  };
}

export function JournalTeaserSection({ data }: JournalTeaserSectionProps) {
  const { label, title, titleAccent, cta, articles } = data;
  const [featured, ...rest] = articles;

  return (
    <section className="bg-background py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 md:mb-16">
          <div className="flex flex-col gap-4 max-w-[440px]">
            <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
              {label}
            </p>
            <h2 data-reveal className="font-heading text-[28px] md:text-[36px] leading-[1.2] tracking-[-1px] text-foreground">
              {title}
              <br />
              {titleAccent}
            </h2>
          </div>
          <div data-reveal>
            <RollLink href={cta.href} label={cta.label} variant="dark" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Featured article — image with title overlaid */}
          <article data-reveal className="group relative overflow-hidden rounded-2xl min-h-[320px] lg:min-h-full cursor-default">
            <Image
              src={featured.image.url}
              alt={featured.image.alt}
              fill
              sizes="(max-width: 1023px) 100vw, 50vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
            />
            <div className="absolute inset-0 bg-linear-to-t from-foreground/80 via-foreground/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 flex flex-col gap-2">
              <p className="font-body text-xs uppercase tracking-[1.4px] text-background/70">{featured.date}</p>
              <h3 className="font-body text-xl md:text-2xl font-medium text-background leading-[1.3]">
                {featured.title}
              </h3>
              <p className="font-body text-sm text-background/80 leading-[1.4] max-w-[380px]">{featured.excerpt}</p>
            </div>
          </article>

          {/* Two smaller articles, stacked */}
          <div className="flex flex-col gap-6 md:gap-8">
            {rest.map((article) => (
              <article data-reveal key={article.title} className="group flex gap-5 cursor-default">
                <div className="relative overflow-hidden rounded-2xl w-[120px] h-[120px] md:w-[140px] md:h-[140px] shrink-0">
                  <Image
                    src={article.image.url}
                    alt={article.image.alt}
                    fill
                    sizes="140px"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                  />
                </div>
                <div className="flex flex-col gap-1.5 justify-center">
                  <p className="font-body text-xs uppercase tracking-[1.4px] text-foreground/50">{article.date}</p>
                  <h3 className="font-body text-base font-medium text-foreground leading-[1.3] transition-opacity duration-300 group-hover:opacity-70">
                    {article.title}
                  </h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
