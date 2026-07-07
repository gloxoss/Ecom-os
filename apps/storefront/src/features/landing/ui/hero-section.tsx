import { brandConfig } from '../../../../brand.config';
import { HeroClient } from './hero-client';

export function HeroSection() {
  return (
    <section>
      <HeroClient 
        title={brandConfig.hero.headline} 
        subtitle={brandConfig.hero.subheadline} 
        ctaLabel={brandConfig.hero.ctaLabel}
        ctaHref={brandConfig.hero.ctaHref}
      />
    </section>
  );
}
