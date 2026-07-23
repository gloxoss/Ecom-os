'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

export interface AccordionItem {
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenIndex?: number | null;
  /** Reveal-on-scroll each row (about-us's FAQ, slideInBottom) vs. render plain (product page). */
  animateRows?: boolean;
}

/** CSS-only expand/collapse (grid-template-rows transition) — no GSAP needed for an interaction this simple. */
export function Accordion({ items, defaultOpenIndex = 0, animateRows = false }: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex);

  return (
    <div className="flex flex-col divide-y divide-border border-t border-border">
      {items.map((item, index) => {
        const isOpen = index === openIndex;
        return (
          <div key={item.title} {...(animateRows ? { 'data-reveal-bottom': true } : {})}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-5 text-left cursor-pointer"
            >
              <span className="font-body text-sm md:text-base text-foreground">{item.title}</span>
              <Plus
                size={18}
                strokeWidth={1.75}
                className={`shrink-0 text-foreground transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
              />
            </button>
            <div
              className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="pb-5 font-body text-sm leading-[1.5] text-foreground/60 max-w-[520px]">
                  {item.content}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
