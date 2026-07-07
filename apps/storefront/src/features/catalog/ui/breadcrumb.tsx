import Link from 'next/link';

// A crumb is one item in the breadcrumb trail.
// label  — the text shown to the user
// href   — optional link; if missing, the crumb is plain text (current page)
type Crumb = { label: string; href?: string };

// Renders a breadcrumb navigation bar from an array of crumbs.
// Example: Home / Shoes / Sneakers
// The last crumb typically has no href (it's the current page).
export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex gap-2 text-sm text-secondary mb-8">
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span>/</span>}
          {crumb.href
            ? <Link href={crumb.href} className="hover:text-foreground transition">{crumb.label}</Link>
            : <span className="text-foreground">{crumb.label}</span>
          }
        </span>
      ))}
    </nav>
  );
}
