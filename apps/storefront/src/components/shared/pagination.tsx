'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

type PaginationProps = {
  totalItems: number;
  pageSize: number;
  currentPage: number;
};

export function Pagination({ totalItems, pageSize, currentPage }: PaginationProps) {
  const t = useTranslations('pagination');
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav className="flex items-center justify-center gap-4 mt-8" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={createPageUrl(currentPage - 1)}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-foreground/20 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          {t('prev')}
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium text-secondary bg-muted border border-foreground/10 rounded-md cursor-not-allowed">
          {t('prev')}
        </span>
      )}

      <span className="text-sm text-foreground">
        {currentPage} / {totalPages}
      </span>

      {hasNext ? (
        <Link
          href={createPageUrl(currentPage + 1)}
          className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-foreground/20 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-foreground"
        >
          {t('next')}
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm font-medium text-secondary bg-muted border border-foreground/10 rounded-md cursor-not-allowed">
          {t('next')}
        </span>
      )}
    </nav>
  );
}
