import Image from "next/image";
import { RollLink } from "@/components/shared/roll-link";
import { Reveal } from "./reveal";

interface FeatureBlock {
  label: string;
  title: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
}

interface FeatureBlocksSectionProps {
  data: FeatureBlock[];
}

export function FeatureBlocksSection({ data }: FeatureBlocksSectionProps) {
  return (
    <section className="bg-background pb-25 md:pb-[150px]">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.map((block) => (
            <div
              key={block.label}
              className="relative overflow-hidden rounded-2xl min-h-[480px] md:min-h-[560px] flex items-center justify-center p-10"
            >
              <Image
                data-reveal-zoom
                src={block.image.src}
                alt={block.image.alt}
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-foreground/40" />
              {/* White curtain wipes off the image (a-32); starts h-0, JS runs it 100% -> 0 */}
              <div data-reveal-curtain className="absolute inset-x-0 bottom-0 h-0 bg-background" />
              <div data-reveal className="relative z-[2] flex flex-col items-center text-center gap-5 max-w-[400px]">
                <p className="text-[11px] uppercase tracking-[0.25em] font-body font-bold text-background">
                  {block.label}
                </p>
                <h2 className="font-heading text-3xl md:text-4xl text-background tracking-tight">
                  {block.title}
                </h2>
                <div className="mt-5">
                  <RollLink href={block.cta.href} label={block.cta.label} variant="glass" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
