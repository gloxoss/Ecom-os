'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: '', label: 'default' },
  { value: 'price_asc', label: 'price_asc' },
  { value: 'price_desc', label: 'price_desc' },
  { value: 'newest', label: 'newest' },
];
type Props = { currentSort?: string };

// Dropdown that appends ?sort= to the URL on change — no submit button needed.
export function SortSelect({ currentSort = '' }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove the param entirely when reverting to default
    value ? params.set('sort', value) : params.delete('sort');
    params.delete('page'); // reset to page 1 on sort change
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <select
      value={currentSort}
      onChange={e => handleChange(e.target.value)}
      className="text-sm border border-foreground/20 rounded-md px-3 py-2 bg-background"
      aria-label="Sort products"
    >
      {SORT_OPTIONS.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
