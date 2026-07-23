import Image from "next/image";
import { Reveal } from "./reveal";

interface QuoteSectionProps {
  data: {
    label: string;
    text: string;
    author: { name: string; role: string; image: { src: string; alt: string } };
    image: { src: string; alt: string };
  };
}

export function QuoteSection({ data }: QuoteSectionProps) {
  const { label, text, author, image } = data;

  return (
    <section className="relative py-20">
      <div className="absolute inset-0 bg-primary" />

      <Reveal className="relative w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col md:flex-row justify-between items-stretch gap-10 md:gap-20 xl:gap-25">
          {/* Fixed-size portrait block, like the original left-image-wrapper */}
          <div
            data-reveal
            className="relative overflow-hidden rounded-2xl shrink-0 w-full h-[340px] md:w-[420px] md:h-[580px] xl:w-[540px] xl:h-[640px]"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 767px) 100vw, 540px"
              className="object-cover"
            />
            {/* Café-colored curtain wipes off the portrait (a-32 primary-bg variant) */}
            <div data-reveal-curtain className="absolute inset-x-0 bottom-0 h-0 bg-primary" />
          </div>

          <div className="flex-1 flex flex-col justify-center items-start gap-[30px]">
            <p data-reveal className="font-body text-sm font-medium uppercase tracking-[1.4px] text-primary-foreground">
              {label}
            </p>
            <blockquote
              data-reveal
              className="font-heading text-[32px] md:text-[40px] leading-[1.2] tracking-[-1px] text-primary-foreground"
            >
              {text}
            </blockquote>
            <div data-reveal className="flex items-center gap-5">
              <Image
                src={author.image.src}
                alt={author.image.alt}
                width={58}
                height={58}
                className="rounded-lg object-cover w-[58px] h-[58px]"
              />
              <div className="flex flex-col gap-[6px]">
                <p className="font-body text-base font-medium uppercase tracking-[1.6px] text-primary-foreground">
                  {author.name}
                </p>
                <p className="font-body text-base text-primary-foreground">{author.role}</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
