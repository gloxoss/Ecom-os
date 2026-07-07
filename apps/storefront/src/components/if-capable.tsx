import { getCapabilities } from '@/lib/capabilities';
import { StoreCapabilities } from '@ecom-os/engine';

interface Props {
  capability: keyof StoreCapabilities;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export async function IfCapable({ capability, children, fallback = null }: Props) {
  const caps = await getCapabilities();
  const isCapable = caps[capability] === true;

  if (!isCapable) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
