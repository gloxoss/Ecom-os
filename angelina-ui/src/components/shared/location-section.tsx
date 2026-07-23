import Image from "next/image";
import { RollLink } from "@/components/shared/roll-link";
import { Reveal } from "@/features/landing/ui/reveal";

export interface LocationSectionData {
  label: string;
  title: string;
  cta: { label: string; href: string };
  video: { mp4: string; webm: string; poster: string; alt: string };
  address: { label: string; value: string; mapUrl: string; mapCta: string };
}

/** Video-background closing location strip — shared by home and about-us. */
export function LocationSection({ data }: { data: LocationSectionData }) {
  const { label, title, cta, video, address } = data;
  const hasVideo = Boolean(video.mp4 || video.webm);

  return (
    <section className="bg-background pb-[50px] md:pb-[70px] lg:pb-[90px] xl:pb-[130px]">
      <Reveal className="w-full max-w-[960px] xl:max-w-[1200px] mx-auto px-5 lg:px-10">
        <div data-reveal className="relative overflow-hidden rounded-2xl">
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
            <Image src={video.poster} alt={video.alt} fill sizes="100vw" className="object-cover" />
          )}
          <div className="absolute inset-0 bg-foreground/40" />

          <div className="relative z-[2] flex flex-col gap-[160px] lg:gap-[200px] xl:gap-[260px] p-5 md:p-10">
            {/* Top content — left-aligned like the original */}
            <div className="flex flex-col items-start gap-[30px] max-w-[600px]">
              <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-background">
                {label}
              </p>
              <h2 className="font-heading text-[32px] md:text-[40px] leading-[1.2] tracking-[-1px] text-background">
                {title}
              </h2>
              <RollLink href={cta.href} label={cta.label} variant="light" />
            </div>

            {/* Bottom: divider + address row */}
            <div className="flex flex-col gap-10">
              <div className="h-px w-full bg-background/30" />
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-[50px]">
                <div className="flex flex-col gap-5 lg:gap-[30px] max-w-[400px]">
                  <p className="font-body text-sm font-medium uppercase tracking-[1.4px] text-background">
                    {address.label}
                  </p>
                  <p className="font-heading text-[22px] md:text-[26px] leading-[1.1] tracking-[-1.3px] text-background">
                    {address.value}
                  </p>
                </div>
                <RollLink href={address.mapUrl} label={address.mapCta} variant="glass" external />
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
