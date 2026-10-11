"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";
import { RollLink } from "@/components/shared/roll-link";
import type { Product } from "@ecom-os/engine";

interface CartClientProps {
  products: Product[];
}

export function CartClient({ products }: CartClientProps) {
  const { items, updateQty, removeItem, getCartTotal } = useCartStore();

  const cartItemsWithDetails = items.map((item) => {
    const productDetail = products.find((p) => p.id === item.id);
    return {
      ...item,
      product: productDetail,
    };
  });

  const total = getCartTotal();
  const formattedTotal = `${(total / 100).toFixed(2).replace(/\.00$/, "")}$`;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-6 px-4">
        <h1 className="font-heading text-4xl md:text-5xl text-foreground">Your Cart</h1>
        <p className="font-body text-foreground/60 max-w-md">
          Your cart is currently empty. Explore our collection of premium coffees and accessories.
        </p>
        <RollLink href="/catalog" label="CONTINUE SHOPPING" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-16 md:py-24">
      <h1 className="font-heading text-4xl md:text-5xl text-foreground mb-12">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {cartItemsWithDetails.map((item) => {
            const product = item.product;
            if (!product) return null;

            const priceFmt = `${(item.price.amount_minor / 100).toFixed(2).replace(/\.00$/, "")}$`;
            const itemTotalFmt = `${((item.price.amount_minor * item.quantity) / 100).toFixed(2).replace(/\.00$/, "")}$`;

            return (
              <div key={item.lineKey} className="flex gap-6 pb-8 border-b border-border relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-input rounded-xl overflow-hidden relative shrink-0">
                  <Image
                    src={product.images[0]?.url || ""}
                    alt={product.images[0]?.altText || product.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col flex-1 justify-between py-1">
                  <div className="flex justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <Link href={`/product/${product.slug}`} className="font-heading text-xl md:text-2xl hover:text-primary transition-colors text-foreground">
                        {product.name}
                      </Link>
                      {item.variationName && (
                        <p className="font-body text-sm text-foreground/50">{item.variationName}</p>
                      )}
                      <p className="font-body text-sm text-foreground/60">{priceFmt}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.lineKey)}
                      className="text-foreground/40 hover:text-foreground transition-colors self-start p-2 -m-2"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex items-center border border-border rounded-full bg-background overflow-hidden">
                      <button
                        onClick={() => updateQty(item.lineKey, item.quantity - 1)}
                        className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.lineKey, item.quantity + 1)}
                        className="px-3 py-2 text-foreground/60 hover:bg-input hover:text-foreground transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-heading text-lg text-foreground">{itemTotalFmt}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-4">
          <div className="bg-input rounded-2xl p-6 sm:p-8 sticky top-24">
            <h2 className="font-heading text-2xl text-foreground mb-6">Order Summary</h2>
            
            <div className="flex flex-col gap-4 font-body text-sm text-foreground border-b border-border pb-6 mb-6">
              <div className="flex justify-between">
                <span className="text-foreground/70">Subtotal</span>
                <span className="font-medium">{formattedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-heading text-xl text-foreground mb-8">
              <span>Total</span>
              <span>{formattedTotal}</span>
            </div>

            <div className="w-full flex justify-center">
              <RollLink href="/checkout" label="PROCEED TO CHECKOUT" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
