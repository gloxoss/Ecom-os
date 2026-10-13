import Link from 'next/link';
import { getActiveClientProfile } from '@/lib/client-profile';
import { isAddonActive } from '@/lib/addon-capabilities';

// Contact details, legal entity and certifications are deliberately not shown: they stay
// UNAPPROVED in clients/paraloca/content-approval.md until the owner signs them off.
export function ParalocaFooter() {
  const profile = getActiveClientProfile();
  const notice = profile.industry?.regulatedProductNotice;
  const showQuotes = isAddonActive('quotes');

  return (
    <footer className="mt-16 border-t border-border bg-muted" data-testid="paraloca-footer">
      <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-tight">{profile.brand.name}</p>
          {notice ? <p className="mt-3 max-w-sm text-sm text-foreground/70">{notice}</p> : null}
        </div>
        <nav aria-label="Navigation du pied de page" className="flex flex-col gap-2 text-sm">
          <Link href="/catalog" className="hover:text-accent">Catalogue</Link>
          <Link href="/contact-us" className="hover:text-accent">Contact</Link>
          {showQuotes ? (
            <Link href="/devis" className="hover:text-accent">Espace professionnels de santé</Link>
          ) : null}
        </nav>
        <p className="text-sm text-foreground/60">Paiement à la livraison. Livraison au Maroc.</p>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} {profile.brand.name}
      </div>
    </footer>
  );
}
