import type { Product, Money } from "@ecom-os/engine";
import { RollLink } from "@/components/shared/roll-link";
import { Reveal } from "./reveal";
import { ProductTabsClient, type ProductTab } from "@/components/shared/product-tabs-client";

const fmt = (m: Money) => `${(m.amount_minor / 100).toFixed(2).replace(/\.00$/, "")}$`;

function toCard(p: Product) {
  return {
    slug: p.slug,
    name: p.name,
    notes: p.description,
    priceLabel: `${fmt(p.price)} /per ${p.variants?.[0]?.name ?? "bag"}`,
    image: p.images[0],
    hoverImage: p.images[1] ?? p.images[0],
  };
}

interface CollectionSectionProps {
  products: Product[];
  data: {
    label: string;
    title: string;
    tabs: Array<{ id: string; label: string }>;
    cta: { label: string; href: string };
  };
}

export function CollectionSection({ products, data }: CollectionSectionProps) {
  const { label, tabs, cta } = data;

  const tabData: ProductTab[] = tabs.map((tab) => ({
    id: tab.id,
    label: tab.label,
    cards: (tab.id === "all"
      ? products.slice(0, 4)
      : products.filter((p) => p.categories.includes(tab.id))
    ).map(toCard),
  }));

  return (
    <section className="bg-background py-25 md:py-[150px]">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <p data-reveal className="text-[11px] uppercase tracking-[0.25em] font-body font-bold text-foreground mb-10">
          {label}
        </p>
        <ProductTabsClient tabs={tabData} size="lg" />
        <div data-reveal className="flex justify-center lg:justify-start mt-20">
          <RollLink href={cta.href} label={cta.label} variant="dark" />
        </div>
      </Reveal>
    </section>
  );
}
