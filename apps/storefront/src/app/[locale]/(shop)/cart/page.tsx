import { getEngine } from "@/lib/engine";
import { CartClient } from "@/features/cart/ui/cart-client";

export const metadata = {
  title: "Your Cart | Angelina",
  description: "Review your cart items.",
};

export default async function CartPage() {
  const engine = await getEngine();
  // Fetch a reasonable limit to cover all cart items
  const { items: products } = await engine.listProducts({ limit: 100 });

  return (
    <div className="min-h-screen bg-background pt-[140px] md:pt-[160px]">
      <CartClient products={products} />
    </div>
  );
}
