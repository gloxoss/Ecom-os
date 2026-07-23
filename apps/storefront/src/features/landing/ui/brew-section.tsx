import Image from "next/image";
import { RollLink } from "@/components/shared/roll-link";
import { Reveal } from "./reveal";

interface BrewSectionProps {
  data: {
    label: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
    features: Array<{ icon: string; title: string; text: string }>;
    images: Array<{ src: string; alt: string }>;
  };
}

export function BrewSection({ data }: BrewSectionProps) {
  const { label, title, description, cta, features, images } = data;

  return (
    <section className="bg-input py-30 overflow-hidden">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col-reverse md:flex-row items-stretch gap-[50px] md:gap-5">
          {/* Left: copy + features */}
          <div className="flex flex-col md:max-w-[460px] lg:max-w-[580px]">
            <div className="flex flex-col items-start gap-[30px]">
              <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
                {label}
              </p>
              <div className="flex flex-col gap-5">
                <h2 data-reveal className="font-heading text-[32px] md:text-[40px] leading-[1.2] tracking-[-1px] text-foreground">
                  {title}
                </h2>
                <p data-reveal className="font-body text-lg xl:text-xl leading-[1.4] text-foreground/80 max-w-[470px]">
                  {description}
                </p>
              </div>
              <div data-reveal>
                <RollLink href={cta.href} label={cta.label} variant="dark" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] mt-[60px]">
              {features.map((feature) => (
                <div data-reveal key={feature.title} className="flex flex-row lg:flex-col gap-5">
                  <Image src={feature.icon} alt="" width={24} height={24} className="shrink-0" />
                  <div className="flex flex-col gap-[6px] max-w-[300px]">
                    <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-foreground">
                      {feature.title}
                    </p>
                    <p className="font-body text-base leading-[1.4] text-foreground/60">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: two cups slide in from the right (slideInRight) */}
          <div className="flex-1 flex justify-center md:justify-end items-end">
            <Image
              data-reveal-right
              src={images[0].src}
              alt={images[0].alt}
              width={630}
              height={760}
              className="rounded-2xl w-[160px] min-[480px]:w-[230px] md:w-[260px] lg:w-[315px] h-auto"
            />
            <Image
              data-reveal-right
              src={images[1].src}
              alt={images[1].alt}
              width={580}
              height={620}
              className="rounded-2xl w-[140px] min-[480px]:w-[180px] md:w-[220px] lg:w-[290px] h-auto"
            />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
