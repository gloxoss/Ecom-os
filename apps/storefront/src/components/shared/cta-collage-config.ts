// Burst (scattered, mid-reveal) and settled (resting) positions per image,
// decoded from the original's a-112 scroll-scrubbed keyframes (24% / 70%).
// xPercent/yPercent are relative to each image's own size — see cta-collage-client.tsx.
export const BASE_CHOREOGRAPHY = [
  { burst: { xPercent: -50, yPercent: -110 }, settled: { xPercent: -5, yPercent: -15 } },
  { burst: { xPercent: -100, yPercent: -76 }, settled: { xPercent: -10, yPercent: -10 } },
  { burst: { xPercent: 80, yPercent: -94 }, settled: { xPercent: 5, yPercent: -6 } },
  { burst: { xPercent: -145, yPercent: 9 }, settled: { xPercent: -15, yPercent: -5 } },
  { burst: { xPercent: 155, yPercent: -39 }, settled: { xPercent: 10, yPercent: 0 } },
  { burst: { xPercent: -80, yPercent: 86 }, settled: { xPercent: -20, yPercent: 5 } },
  { burst: { xPercent: 130, yPercent: 48 }, settled: { xPercent: 15, yPercent: 7 } },
  { burst: { xPercent: 36, yPercent: 140 }, settled: { xPercent: 5, yPercent: 15 } },
];

export interface CtaChoreographyConfig {
  /** Ambient 25s orbit loop (a-113) — only present on some pages in the original. */
  withOrbit: boolean;
  orbitDuration: number;
  /** ScrollTrigger scrub smoothness — seconds for the playhead to catch up to scroll. */
  scrub: number;
  /** Title starts zoomed in at this scale, eases to 1 at titlePosition. */
  titleScaleStart: number;
  /** Timeline positions are fractions (0-1) of the pinned section's full scroll range. */
  titlePosition: number;
  fadeInPosition: number;
  fadeInDuration: number;
  settlePosition: number;
  settleDuration: number;
  exitPosition: number;
  exitDuration: number;
  /** Multiplies every image's burst/settled xPercent+yPercent — reshapes the whole collage at once. */
  burstSpread: number;
  settleSpread: number;
}

export const DEFAULT_CTA_CONFIG: CtaChoreographyConfig = {
  withOrbit: false,
  orbitDuration: 25,
  scrub: 1,
  titleScaleStart: 1.2,
  titlePosition: 0.15,
  fadeInPosition: 0.2,
  fadeInDuration: 0.06,
  settlePosition: 0.26,
  settleDuration: 0.44,
  exitPosition: 0.7,
  exitDuration: 0.1,
  burstSpread: 1,
  settleSpread: 1,
};

const scale = (v: { xPercent: number; yPercent: number }, factor: number) => ({
  xPercent: v.xPercent * factor,
  yPercent: v.yPercent * factor,
});

export function resolveChoreography(config: CtaChoreographyConfig) {
  return BASE_CHOREOGRAPHY.map((c) => ({
    burst: scale(c.burst, config.burstSpread),
    settled: scale(c.settled, config.settleSpread),
  }));
}
