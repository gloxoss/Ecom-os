import { redirect } from 'next/navigation';
import { getEngine } from '@/lib/engine';
import { getSessionToken } from '@/features/account/server/auth-actions';
import { createAddress, updateAddress, deleteAddress } from '@/features/account/server/address-actions';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function AddressesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ add?: string; edit?: string }>;
}) {
  const token = await getSessionToken();
  if (!token) redirect('/account/login');

  const engine = await getEngine();
  const customer = await engine.getCustomer(token);
  if (!customer) redirect('/account/login');
  
  const { locale } = await params;
  const t = await getTranslations('addresses');
  const resolvedParams = await searchParams;

  const isAdd = !!resolvedParams.add;
  const editId = resolvedParams.edit;

  const addresses = await engine.listAddresses(customer.id);
  const editingAddress = editId ? addresses.find(a => a.id === editId) : null;

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/${locale}/account`} className="text-secondary hover:text-foreground text-sm">
          {t('back')}
        </Link>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {(isAdd || editingAddress) ? (
        <div className="border border-foreground/10 rounded-md p-6 max-w-xl">
          <h2 className="text-xl font-medium mb-4">{isAdd ? t('add') : t('edit')}</h2>
          <form action={isAdd ? createAddress : updateAddress} className="space-y-4">
            {editingAddress && <input type="hidden" name="addressId" value={editingAddress.id} />}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" name="firstName" defaultValue={editingAddress?.firstName} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input type="text" name="lastName" defaultValue={editingAddress?.lastName} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('street')}</label>
              <input type="text" name="street" defaultValue={editingAddress?.street} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('city')}</label>
                <input type="text" name="city" defaultValue={editingAddress?.city} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('postalCode')}</label>
                <input type="text" name="postalCode" defaultValue={editingAddress?.postalCode} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('country')}</label>
              <input type="text" name="country" defaultValue={editingAddress?.country} required className="w-full px-3 py-2 border border-foreground/20 rounded-md" />
            </div>
            
            <div className="pt-4 border-t border-foreground/10 flex gap-4">
              <button type="submit" className="bg-foreground text-background px-4 py-2 rounded-md font-medium">
                {t('save')}
              </button>
              <Link href={`/${locale}/account/addresses`} className="px-4 py-2 border border-foreground/20 rounded-md font-medium hover:bg-muted">
                {t('cancel')}
              </Link>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <Link href={`/${locale}/account/addresses?add=1`} className="bg-foreground text-background px-4 py-2 rounded-md font-medium inline-block">
              + {t('add')}
            </Link>
          </div>

          {addresses.length === 0 ? (
            <div className="border border-foreground/10 rounded-md p-12 text-center text-secondary">
              {t('empty')}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div key={addr.id} className="border border-foreground/10 rounded-md p-4 relative">
                  <p className="font-medium">{addr.firstName} {addr.lastName}</p>
                  <p className="text-secondary mt-1">{addr.street}</p>
                  <p className="text-secondary">{addr.city}, {addr.postalCode}</p>
                  <p className="text-secondary">{addr.country}</p>
                  
                  <div className="mt-4 pt-4 border-t border-foreground/10 flex items-center justify-between">
                    <Link href={`/${locale}/account/addresses?edit=${addr.id}`} className="text-sm font-medium hover:underline">
                      {t('edit')}
                    </Link>
                    <form action={deleteAddress}>
                      <input type="hidden" name="addressId" value={addr.id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:underline">
                        {t('delete')}
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
