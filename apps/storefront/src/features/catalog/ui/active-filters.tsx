'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Props = {
  min?: number;
  max?: number;
  sort?: string;
};

const SORT_LABELS: Record<string, string> = {
  price_asc: 'Price: Low → High',
  price_desc: 'Price: High → Low',
  newest: 'Newest',
};

// Shows active filter chips. Each chip links to the current URL minus that param.
export function ActiveFilters({ min, max, sort }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Build a URL that removes one specific param
  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    params.delete('page'); // reset pagination when removing a filter
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const hasAny = min !== undefined || max !== undefined || sort;
  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {(min !== undefined || max !== undefined) && (
        <Link
          href={removeParam('min') /* also strips max via chaining below */}
          onClick={() => {}} // ponytail: link handles both min+max via the component below
          className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-muted border border-foreground/20 hover:bg-foreground/5"
        >
          Price: {min !== undefined ? `$${min}` : ''}–{max !== undefined ? `$${max}` : ''}
          <span aria-hidden>✕</span>
        </Link>
      )}
      {sort && (
        <Link
          href={removeParam('sort')}
          className="flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-muted border border-foreground/20 hover:bg-foreground/5"
        >
          {SORT_LABELS[sort] ?? sort}
          <span aria-hidden>✕</span>
        </Link>
      )}
    </div>
  );
}
