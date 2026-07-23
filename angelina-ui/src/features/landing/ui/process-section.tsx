import Image from "next/image";
import { Reveal } from "./reveal";

interface ProcessSectionProps {
  data: {
    label: string;
    title: string;
    description: string;
    image: { src: string; alt: string };
    steps: Array<{ number: string; title: string; text: string }>;
  };
}

export function ProcessSection({ data }: ProcessSectionProps) {
  const { label, title, description, image, steps } = data;

  return (
    <section id="section-process" className="relative overflow-hidden">
      <Image data-reveal-kenburns src={image.src} alt={image.alt} fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0 bg-foreground/30" />

      <Reveal className="relative z-[2] w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10 pt-20 pb-10">
        <div className="flex flex-col gap-20 md:gap-[120px] lg:gap-[200px] xl:gap-[260px]">
          {/* Top: label | heading + paragraph (3-col grid like the original) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4 items-start">
            <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-background">
              {label}
            </p>
            <div className="md:col-span-2 flex flex-col gap-[30px]">
              <h2 data-reveal className="font-heading text-[32px] md:text-[40px] leading-[1.2] tracking-[-1px] text-background">
                {title}
              </h2>
              <p data-reveal className="font-body text-lg xl:text-xl leading-[1.4] text-background">
                {description}
              </p>
            </div>
          </div>

          {/* Steps: circle outlines draw in on scroll (a-37, as SVG stroke draw) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 xl:gap-[30px]">
            {steps.map((step) => (
              <div data-reveal key={step.number} className="flex flex-col gap-10 max-w-[400px]">
                <div className="relative flex items-center justify-center w-[42px] h-[42px] shrink-0">
                  <svg viewBox="0 0 42 42" className="absolute inset-0 w-full h-full -rotate-90 text-background" aria-hidden>
                    <circle
                      data-reveal-draw
                      cx="21" cy="21" r="20.5"
                      pathLength={1}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="1"
                    />
                  </svg>
                  <span className="font-body text-sm leading-none tracking-[1.6px] text-background">
                    {step.number}
                  </span>
                </div>
                <div className="flex flex-col gap-[10px]">
                  <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-background">
                    {step.title}
                  </p>
                  <p className="font-body text-base leading-[1.4] text-background max-w-[480px]">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
