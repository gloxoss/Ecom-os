import { getEngine } from '@/lib/engine';
import { getTranslations } from 'next-intl/server';
import { IfCapable } from '@/components/if-capable';

export async function LoyaltyWidget({ customerId }: { customerId: string }) {
  if (!customerId) return null;

  return (
    <IfCapable capability="loyaltyEnabled">
      <LoyaltyBalance customerId={customerId} />
    </IfCapable>
  );
}

async function LoyaltyBalance({ customerId }: { customerId: string }) {
  const engine = await getEngine();
  const balance = await engine.getLoyaltyBalance?.(customerId);
  const t = await getTranslations('account');

  if (!balance) return null;

  return (
    <div className="bg-foreground text-background p-6 rounded-lg mb-8 shadow-sm">
      <h2 className="text-xl font-bold mb-2">Loyalty & Rewards</h2>
      <div className="flex items-end gap-3">
        <span className="text-4xl font-bold">{balance.points}</span>
        <span className="text-background/80 mb-1">pts</span>
      </div>
      <p className="mt-4 text-sm text-background/80">
        You have ${(balance.value_minor / 100).toFixed(2)} in rewards value available.
      </p>
    </div>
  );
}
