"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/lib/ecom-types";

interface CheckoutClientProps {
  products: Product[];
}

export function CheckoutClient({ products }: CheckoutClientProps) {
  const { items, getCartTotal } = useCartStore();

  const cartItemsWithDetails = items.map((item) => {
    const productDetail = products.find((p) => p.id === item.productId);
    return {
      ...item,
      product: productDetail,
    };
  });

  const total = getCartTotal();
  const formattedTotal = `${(total / 100).toFixed(2).replace(/\.00$/, "")}$`;

  return (
    <div className="max-w-6xl mx-auto px-5 lg:px-10 py-16 md:py-24">
      <Link href="/cart" className="text-sm font-body text-foreground/60 hover:text-foreground transition-colors mb-8 inline-block">
        &larr; Back to Cart
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        {/* Checkout Form */}
        <div className="lg:col-span-7 flex flex-col gap-10">
          <h1 className="font-heading text-3xl md:text-4xl text-foreground">Checkout</h1>
          
          <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
            {/* Contact Information */}
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-xl text-foreground">Contact Information</h2>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Email address</label>
                <input
                  type="email"
                  id="email"
                  placeholder="hello@example.com"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Shipping Address */}
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-xl text-foreground pt-4 border-t border-border">Shipping Address</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="firstName" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="lastName" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="address" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Address</label>
                <input
                  type="text"
                  id="address"
                  className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor="city" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">City</label>
                  <input
                    type="text"
                    id="city"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor="zip" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Zip Code</label>
                  <input
                    type="text"
                    id="zip"
                    className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Payment (Mocked) */}
            <div className="flex flex-col gap-4">
              <h2 className="font-heading text-xl text-foreground pt-4 border-t border-border">Payment</h2>
              <div className="bg-input rounded-xl p-6 text-center border border-border">
                <p className="font-body text-sm text-foreground/60">This is a mock checkout. No payment is required.</p>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full bg-foreground text-background font-body text-xs font-medium uppercase tracking-[0.25em] py-5 rounded-full hover:bg-primary transition-colors"
            >
              Place Order
            </button>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5 relative">
          <div className="bg-input rounded-2xl p-6 sm:p-8 sticky top-12 border border-border">
            <h2 className="font-heading text-2xl text-foreground mb-6">Order Summary</h2>
            
            {/* Items */}
            <div className="flex flex-col gap-4 mb-6 max-h-[40vh] overflow-y-auto pr-2">
              {cartItemsWithDetails.map((item) => {
                const product = item.product;
                if (!product) return null;

                const priceFmt = `${((item.price.amount_minor * item.quantity) / 100).toFixed(2).replace(/\.00$/, "")}$`;

                return (
                  <div key={item.id} className="flex items-center gap-4 py-2">
                    <div className="w-16 h-16 bg-background rounded-lg overflow-hidden relative shrink-0">
                      <Image
                        src={product.images[0]?.url || ""}
                        alt={product.images[0]?.altText || product.name}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute -top-2 -right-2 w-5 h-5 bg-foreground text-background text-[10px] flex items-center justify-center rounded-full font-body font-medium z-10">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex flex-col flex-1">
                      <span className="font-heading text-base text-foreground">{product.name}</span>
                    </div>
                    <span className="font-body text-sm text-foreground font-medium">{priceFmt}</span>
                  </div>
                );
              })}
            </div>

            {/* Totals */}
            <div className="flex flex-col gap-3 font-body text-sm text-foreground border-t border-border pt-6 mb-6">
              <div className="flex justify-between">
                <span className="text-foreground/70">Subtotal</span>
                <span className="font-medium">{formattedTotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/70">Shipping</span>
                <span>Free</span>
              </div>
            </div>

            <div className="flex justify-between items-center font-heading text-2xl text-foreground">
              <span>Total</span>
              <span>{formattedTotal}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
