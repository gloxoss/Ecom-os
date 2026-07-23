import Image from 'next/image';
import Link from 'next/link';
import { Sparkle } from 'lucide-react';
import { Reveal } from '@/features/landing/ui/reveal';

interface Collection {
  id: string;
  name: string;
  overview: string;
  tags: string[];
  image: { url: string; alt: string };
}

export function CatalogCollectionsSection({ collections }: { collections: Collection[] }) {
  return (
    <section id="collections" className="bg-input py-20 md:py-25">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col gap-10 md:gap-12">
          {collections.map((collection) => (
            <div key={collection.id} className="flex flex-col md:flex-row items-stretch gap-6 md:gap-8">
              <div
                data-reveal
                className="flex flex-col gap-8 rounded-2xl border border-border bg-background p-8 md:p-10 md:w-[46%] shrink-0"
              >
                <div className="flex flex-col gap-3">
                  <h3 className="font-heading text-[26px] md:text-[30px] leading-[1.2] tracking-[-0.5px] text-foreground">
                    {collection.name}
                  </h3>
                  <p className="font-body text-base leading-[1.4] text-foreground/70">
                    {collection.overview}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {collection.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full bg-input px-4 py-2.5 font-body text-sm text-foreground"
                    >
                      <Sparkle size={14} strokeWidth={1.75} className="text-primary shrink-0" />
                      {tag}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/catalog?category=${collection.id}#shop`}
                  className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground underline underline-offset-4 w-fit mt-auto"
                >
                  Shop {collection.name}
                </Link>
              </div>

              <div data-reveal className="relative flex-1 overflow-hidden rounded-2xl min-h-[280px] md:min-h-0">
                <div data-reveal-curtain className="absolute inset-x-0 bottom-0 z-[2] h-0 bg-input" />
                <div data-reveal-zoom className="absolute inset-0">
                  <Image
                    src={collection.image.url}
                    alt={collection.image.alt}
                    fill
                    sizes="(max-width: 767px) 100vw, 54vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
