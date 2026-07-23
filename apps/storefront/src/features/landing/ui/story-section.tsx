import Image from "next/image";
import { RollLink } from "@/components/shared/roll-link";
import { Reveal } from "./reveal";

interface StorySectionProps {
  data: {
    label: string;
    title: string;
    video: { mp4: string; webm: string; poster: string; alt: string };
    paragraphs: string[];
    cta: { label: string; href: string };
    values: Array<{ number: string; title: string }>;
  };
}

export function StorySection({ data }: StorySectionProps) {
  const { label, title, video, paragraphs, cta, values } = data;
  const hasVideo = Boolean(video.mp4 || video.webm);

  return (
    <section className="bg-background pb-25 md:pb-[150px]">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div className="flex flex-col gap-15">
          {/* Top: heading + video */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="flex flex-col gap-10">
              <p data-reveal className="text-[11px] uppercase tracking-[0.25em] font-body font-bold text-foreground">
                {label}
              </p>
              <h2 data-reveal className="font-heading text-3xl md:text-5xl text-foreground tracking-tight">
                {title}
              </h2>
            </div>
            <div data-reveal className="relative overflow-hidden rounded-2xl aspect-4/3">
              {hasVideo ? (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={video.poster}
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  {video.mp4 ? <source src={video.mp4} type="video/mp4" /> : null}
                  {video.webm ? <source src={video.webm} type="video/webm" /> : null}
                </video>
              ) : (
                <Image src={video.poster} alt={video.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
              )}
            </div>
          </div>

          {/* Divider draws left -> right (a-35) */}
          <div data-reveal-line className="h-px w-full bg-border" />

          {/* Bottom: paragraphs + values list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-5">
                {paragraphs.map((text) => (
                  <p data-reveal key={text} className="font-body text-base md:text-lg text-foreground/80 leading-relaxed">
                    {text}
                  </p>
                ))}
              </div>
              <div data-reveal>
                <RollLink href={cta.href} label={cta.label} variant="dark" />
              </div>
            </div>
            <div className="overflow-hidden">
              <div data-reveal-slide-list className="flex flex-col">
                {values.map((value) => (
                  <div
                    data-reveal-slide-item
                    key={value.number}
                    className="flex items-baseline gap-10 border-b border-border py-5 last:border-b-0"
                  >
                    <span className="text-[11px] font-body font-bold text-foreground/50">{value.number}</span>
                    <span className="font-heading text-2xl md:text-3xl text-foreground tracking-tight">
                      {value.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
