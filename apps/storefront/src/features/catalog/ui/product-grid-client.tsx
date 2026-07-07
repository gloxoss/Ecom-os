'use client';

import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { Product } from '@ecom-os/engine';
import { ProductCard } from './product-card';

gsap.registerPlugin(ScrollTrigger);

type Props = {
  products: Product[];
  emptyText?: string;
};

export function ProductGridAnimated({ products, emptyText = 'No products found.' }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!container.current) return;

    // Targets every card by the "product-card-item" class and staggers them in on scroll
    gsap.from(container.current.querySelectorAll('.product-card-item'), {
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: container.current,
        start: 'top 85%', // fire when the grid top reaches 85% down the viewport
        once: true,        // animate once — don't replay on scroll back up
      },
    });
  }, { scope: container });

  if (!products.length) {
    return <div className="text-center text-secondary py-20">{emptyText}</div>;
  }

  return (
    <div ref={container} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
      {products.map(product => (
        // "product-card-item" class is the GSAP animation target — don't remove it
        <div key={product.id} className="product-card-item">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}
