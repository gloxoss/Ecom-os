import { getEngine } from "@/lib/engine";
import { CheckoutClient } from "@/features/checkout/ui/checkout-client";
import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Checkout | Angelina",
  description: "Complete your order.",
};

export default async function CheckoutPage() {
  const engine = await getEngine();
  // Fetch a reasonable limit to cover checkout items
  const { items: products } = await engine.listProducts({ limit: 100 });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header for Checkout */}
      <header className="w-full py-8 px-6 flex justify-center border-b border-border bg-background">
        <Link href="/" aria-label="Angelina Home">
          <Image
            src="https://cdn.prod.website-files.com/69700209399c1d34b8f11637/6970030ebdc1913fbc4ab4d7_Layer_1%20(4).svg"
            alt="Angelina Logo"
            width={120}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
      </header>

      <main className="flex-1">
        <CheckoutClient products={products} />
      </main>
    </div>
  );
}
