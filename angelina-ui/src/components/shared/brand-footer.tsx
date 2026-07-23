"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";

export function BrandFooter() {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribed(true);
  };

  return (
    <footer className="w-full bg-[var(--color-bg)] text-[var(--color-fg)] border-t border-[var(--color-border)] py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Top Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 mb-16 lg:mb-24">
          
          {/* Navigation */}
          <div className="flex flex-col gap-6 lg:col-span-3">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-[var(--color-fg-muted)]">
              Navigation
            </h3>
            <div className="flex flex-col gap-4">
              <Link href="/" className="group inline-flex overflow-hidden relative text-2xl lg:text-3xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Home
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Home
                </span>
              </Link>
              <Link href="/catalog" className="group inline-flex overflow-hidden relative text-2xl lg:text-3xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Coffee
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Coffee
                </span>
              </Link>
              <Link href="/about-us" className="group inline-flex overflow-hidden relative text-2xl lg:text-3xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  About
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  About
                </span>
              </Link>
              <Link href="/contact-us" className="group inline-flex overflow-hidden relative text-2xl lg:text-3xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Locations
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Locations
                </span>
              </Link>
            </div>
          </div>

          {/* Center Column: About & Subscribe */}
          <div className="flex flex-col gap-12 lg:col-span-6 lg:items-center lg:text-center">
            {/* About us */}
            <div className="flex flex-col gap-6 max-w-md">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-[var(--color-fg-muted)]">
                About us
              </h3>
              <p className="text-base md:text-lg leading-relaxed text-[var(--color-fg-muted)]">
                Angelina Coffee was created with a simple focus: making good coffee
                that feels easy to enjoy every day. We believe coffee should be
                honest, well-made, and part of your routine, not something
                complicated or overdesigned.
              </p>
            </div>

            {/* Subscribe */}
            <div className="flex flex-col gap-6 w-full max-w-md">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-[var(--color-fg-muted)]">
                Subscribe to our newsletter
              </h3>
              {!isSubscribed ? (
                <form className="flex flex-col gap-4" onSubmit={handleSubscribe}>
                  <input
                    type="email"
                    placeholder="Email address"
                    required
                    className="w-full bg-transparent border-b border-[var(--color-border)] py-3 px-0 focus:outline-none focus:border-[var(--color-fg)] transition-colors text-base"
                  />
                  <button
                    type="submit"
                    className="group relative w-full inline-flex items-center justify-center overflow-hidden rounded-full bg-[var(--color-fg)] px-8 py-3.5 text-base font-medium text-[var(--color-bg)] transition-transform hover:scale-105 active:scale-95"
                  >
                    <span className="absolute inset-0 bg-[var(--color-brand-orange)] transition-transform duration-500 ease-out translate-y-[100%] group-hover:translate-y-0" />
                    <span className="relative flex items-center gap-2">
                      Subscribe
                    </span>
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3 justify-center text-[var(--color-fg)] p-4 border border-[var(--color-border)] rounded-xl">
                  {/* Using an inline SVG for the coffee bean / checkmark or Lucide icon */}
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span className="font-medium">Thank you! Your submission has been received!</span>
                </div>
              )}
            </div>
          </div>

          {/* Follow Us */}
          <div className="flex flex-col gap-6 lg:col-span-3 lg:items-end lg:text-right">
            <h3 className="text-sm font-semibold tracking-wider uppercase text-[var(--color-fg-muted)]">
              Follow us
            </h3>
            <div className="flex flex-col gap-4">
              <a href="#" target="_blank" rel="noopener noreferrer" className="group inline-flex overflow-hidden relative text-xl lg:text-2xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Instagram
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Instagram
                </span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="group inline-flex overflow-hidden relative text-xl lg:text-2xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Twitter/X
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  Twitter/X
                </span>
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" className="group inline-flex overflow-hidden relative text-xl lg:text-2xl font-medium tracking-tight">
                <span className="group-hover:-translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  LinkedIn
                </span>
                <span className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  LinkedIn
                </span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Copyrights */}
        <div className="flex flex-col gap-4 md:flex-row justify-between items-center pt-8 border-t border-[var(--color-border)] text-sm text-[var(--color-fg-muted)]">
          <div>
            © Angelina. All Rights Reserved. <Link href="#" className="underline hover:text-[var(--color-fg)] ml-2">Licensing</Link>
          </div>
          <div>
            <Link href="#" className="underline hover:text-[var(--color-fg)]">Webflow Templates</Link> by <a href="#" className="underline hover:text-[var(--color-fg)]">wCopilot</a>
          </div>
          <div>
            Powered by <Link href="#" className="underline hover:text-[var(--color-fg)]">Webflow</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
