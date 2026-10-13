import { getActiveClientProfile } from '@/lib/client-profile';
import { isAddonActive } from '@/lib/addon-capabilities';
import { ParalocaHeaderBar } from './header-bar';

export function ParalocaHeader() {
  const profile = getActiveClientProfile();
  return <ParalocaHeaderBar brandName={profile.brand.name} showQuotes={isAddonActive('quotes')} />;
}
