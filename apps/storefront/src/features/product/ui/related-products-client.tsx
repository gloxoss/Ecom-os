'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductCard } from '@/components/shared/product-tabs-client';

const ARROW = '/assets/beano/aHR0cHM6_6973e7102ccfa0826cb1870d_Frame (1).svg';

export function RelatedProductsClient({ cards }: { cards: ProductCard[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-card]') as HTMLElement | null;
    const distance = (card?.offsetWidth ?? 300) + 32;
    track.scrollBy({ left: distance * direction, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card) => (
          <Link
            key={card.slug}
            href={`/product/${card.slug}`}
            data-card
            className="group flex flex-col gap-4 shrink-0 w-[260px] snap-start"
          >
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl h-[280px]">
              <div className="absolute inset-0 bg-input" />
              <Image
                src={card.image.url}
                alt={card.image.altText}
                fill
                sizes="260px"
                className="object-cover z-[1] transition-transform duration-500 ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute bottom-4 right-4 z-[2] w-10 h-10 rounded-full overflow-hidden border border-border shadow-[0_2px_10px_0_rgba(0,0,0,0.11)]">
                <Image src={card.hoverImage.url} alt={card.hoverImage.altText} fill sizes="40px" className="object-cover" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-body text-xs font-medium uppercase tracking-[1.6px] text-foreground transition-opacity duration-500 group-hover:opacity-70">
                {card.name}
              </h3>
              <p className="font-body text-xs text-foreground/60">{card.notes}</p>
              <p className="font-body text-xs text-foreground mt-1">{card.priceLabel}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Arrows — icon rolls through on hover (a-38…a-41 pattern) */}
      <div className="absolute -top-16 right-0 flex gap-[6px]">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          aria-label="Previous products"
          className="group flex items-center justify-center w-[38px] h-[38px] rounded-full bg-background border border-border cursor-pointer transition-colors duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative block w-[18px] h-[18px] overflow-hidden">
            <Image src={ARROW} alt="" width={18} height={18} className="rotate-180 invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:-translate-x-full" />
            <Image src={ARROW} alt="" width={18} height={18} aria-hidden className="absolute inset-0 translate-x-full rotate-180 invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-0" />
          </span>
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          aria-label="Next products"
          className="group flex items-center justify-center w-[38px] h-[38px] rounded-full bg-background border border-border cursor-pointer transition-colors duration-300 hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="relative block w-[18px] h-[18px] overflow-hidden">
            <Image src={ARROW} alt="" width={18} height={18} className="invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-full" />
            <Image src={ARROW} alt="" width={18} height={18} aria-hidden className="absolute inset-0 -translate-x-full invert transition-transform duration-[400ms] ease-[cubic-bezier(0.86,0,0.07,1)] group-hover:translate-x-0" />
          </span>
        </button>
      </div>
    </div>
  );
}
