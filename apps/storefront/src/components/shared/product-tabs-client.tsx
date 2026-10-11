"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface ProductCard {
  slug: string;
  name: string;
  notes: string;
  priceLabel: string;
  image: { url: string; altText: string };
  hoverImage: { url: string; altText: string };
}

export interface ProductTab {
  id: string;
  label: string;
  cards: ProductCard[];
}

const TAB_TEXT_SIZE = {
  lg: "text-3xl md:text-[42px] lg:text-5xl",
  md: "text-xl md:text-2xl lg:text-3xl",
} as const;

interface ProductTabsClientProps {
  tabs: ProductTab[];
  /** lg = full-bleed hero-scale words (home collection); md = compact tab row (menu catalog). */
  size?: keyof typeof TAB_TEXT_SIZE;
  emptyLabel?: string;
  /** Thin rule under the tab row, as in the menu catalog's source markup. */
  withDivider?: boolean;
  /** Tab selected on mount — e.g. a /catalog/[slug] page pre-selecting its own category. Falls back to tabs[0]. */
  initialActiveId?: string;
  /** Fires when the user clicks a different tab — lets a page sync the selection into the URL. Not called on mount. */
  onActiveChange?: (id: string) => void;
}

/**
 * Shared product-tab + card grid, driving the home "Crafted collection"
 * section, the /menu catalog, and /catalog/[slug] category pages. Motion:
 * tab words cascade in (a-171), then the card grid rises late (a-48); cards
 * re-stagger on tab change.
 */
export function ProductTabsClient({ tabs, size = "lg", emptyLabel = "No products found in this category.", withDivider = false, initialActiveId, onActiveChange }: ProductTabsClientProps) {
  const [activeId, setActiveId] = useState(initialActiveId ?? tabs[0]?.id);

  const selectTab = (id: string) => {
    setActiveId(id);
    onActiveChange?.(id);
  };
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const didRenderCardsRef = useRef(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const root = rootRef.current;
        if (!root) return;

        const words = gsap.utils.toArray<HTMLElement>("[data-tab-word]", root);
        const cards = gsap.utils.toArray<HTMLElement>("[data-card]", root);

        gsap.set(words, { y: 20, opacity: 0, filter: "blur(5px)" });
        gsap.set(cards, { y: 20, opacity: 0, filter: "blur(3px)" });

        const tl = gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 85%", once: true },
        });

        tl.to(words, {
          y: 0, opacity: 1, filter: "blur(0px)",
          duration: 0.3, stagger: 0.1, delay: 0.3, ease: "power1.out",
        });

        tl.to(cards, {
          y: 0, opacity: 1, filter: "blur(0px)",
          duration: 1, stagger: 0.08, ease: "power3.inOut",
        }, 1);
      });

      return () => mm.revert();
    },
    { scope: rootRef }
  );

  // Cards re-stagger on tab change (skip the initial mount — the scroll timeline above owns it)
  useGSAP(
    () => {
      if (!didRenderCardsRef.current) {
        didRenderCardsRef.current = true;
        return;
      }

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-card]",
          { opacity: 0, y: 20, filter: "blur(3px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.5, stagger: 0.08, ease: "power2.out" }
        );
      });

      return () => mm.revert();
    },
    { scope: gridRef, dependencies: [activeId] }
  );

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];

  return (
    <div ref={rootRef}>
      <div
        className={`flex flex-wrap items-baseline gap-x-[30px] gap-y-[5px] pb-6 mb-12 md:mb-15 ${
          withDivider ? "border-b border-border" : ""
        }`}
        role="tablist"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            data-tab-word
            onClick={() => selectTab(tab.id)}
            aria-selected={tab.id === activeId}
            className={`inline-flex items-center min-h-[44px] font-heading font-light ${TAB_TEXT_SIZE[size]} tracking-tight transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md ${
              tab.id === activeId ? "text-foreground" : "text-foreground/40 hover:text-foreground"
            }`}
          >
            {tab.label}
            {i < tabs.length - 1 ? "," : ""}
          </button>
        ))}
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 md:gap-x-[30px] md:gap-y-20"
      >
        {active.cards.map((card) => (
          <Link key={card.slug} href={`/product/${card.slug}`} data-card className="group flex flex-col gap-5">
            <div className="relative flex items-center justify-center overflow-hidden rounded-2xl h-[300px] min-[480px]:h-[320px] md:h-[390px] lg:h-[320px] xl:h-[390px]">
              <div className="absolute inset-0 bg-input" />
              <Image
                src={card.image.url}
                alt={card.image.altText}
                fill
                sizes="(max-width: 479px) 100vw, (max-width: 991px) 50vw, 25vw"
                className="object-cover z-[1] transition-transform duration-500 ease-out group-hover:scale-[1.08]"
              />
              <div className="absolute bottom-5 right-5 z-[2] w-11 h-11 rounded-full overflow-hidden border border-border shadow-[0_2px_10px_0_rgba(0,0,0,0.11)]">
                <Image
                  src={card.hoverImage.url}
                  alt={card.hoverImage.altText}
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="flex flex-col gap-[15px]">
              <div className="flex flex-col gap-[10px]">
                <h3 className="font-body text-xs font-medium uppercase tracking-[1.6px] text-foreground transition-opacity duration-500 group-hover:opacity-70">
                  {card.name}
                </h3>
                <p className="font-body text-xs text-foreground/60 normal-case tracking-normal">
                  {card.notes}
                </p>
              </div>
              <div className="flex items-baseline gap-[10px] font-body text-xs text-foreground normal-case tracking-normal">
                <span className="text-foreground/50">Price</span>
                <span>{card.priceLabel}</span>
              </div>
            </div>
          </Link>
        ))}
        {active.cards.length === 0 && (
          <p className="col-span-full py-12 text-center font-body text-foreground/50">{emptyLabel}</p>
        )}
      </div>
    </div>
  );
}
