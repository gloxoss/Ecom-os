import React from 'react';
import type { BrandStory as BrandStoryData } from '../../../../../../clients/paraloca/brand-schema';

export interface BrandStoryProps {
  story: BrandStoryData;
  locale?: string;
  className?: string;
}

/**
 * Editorial brand story component for ParaLoca brand detail pages.
 * Displays brand mission, origin, warranty commitments, and technical spec downloads.
 */
export function BrandStory({
  story,
  locale = 'fr',
  className = '',
}: BrandStoryProps) {
  const isArabic = locale === 'ar';

  return (
    <section
      aria-labelledby="brand-story-heading"
      className={`rounded-2xl border border-border p-6 sm:p-8 ${
        story.isOwned
          ? 'bg-accent/5 border-accent/20'
          : 'bg-muted/30 border-border/70'
      } ${className}`}
      data-testid="brand-story-block"
      data-is-owned={story.isOwned}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <h2 id="brand-story-heading" className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {isArabic ? `قصة ${story.name}` : `À propos de ${story.name}`}
            </h2>
            {story.isOwned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent text-white">
                {isArabic ? 'علامة خاصة' : 'Marque Propre'}
              </span>
            )}
          </div>

          <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {story.storyMarkdown}
          </p>

          {story.warrantyPolicy && (
            <div className="pt-2 flex items-start gap-2 text-sm text-foreground font-medium">
              <span className="text-accent" aria-hidden="true">✓</span>
              <span>{story.warrantyPolicy}</span>
            </div>
          )}
        </div>

        {story.documents && story.documents.length > 0 && (
          <div className="w-full md:w-72 bg-card border border-border rounded-xl p-4 space-y-3 shrink-0 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              {isArabic ? 'الوثائق التقنية' : 'Documents Techniques'}
            </h3>
            <ul className="space-y-2 text-sm">
              {story.documents.map((doc, idx) => (
                <li key={idx} className="flex items-center justify-between text-muted-foreground hover:text-foreground">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:underline text-xs"
                    aria-label={`Télécharger ${doc.title} (${doc.type})`}
                  >
                    <span aria-hidden="true">📄</span>
                    <span className="line-clamp-1">{doc.title}</span>
                  </a>
                  <span className="text-[10px] font-mono uppercase bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                    {doc.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
