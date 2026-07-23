"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginClient() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, authenticate here.
    // For now, redirect to the dashboard.
    router.push("/account");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-5">
      <div className="w-full max-w-[480px] bg-background border border-border rounded-2xl p-8 sm:p-12 text-center">
        
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">Welcome Back</h1>
        <p className="font-body text-sm text-foreground/60 mb-8">
          Sign in to access your order history, saved addresses, and Angelina exclusives.
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="hello@example.com"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="font-body text-xs uppercase tracking-[1.4px] text-foreground/80 font-medium">Password</label>
              <Link href="#" className="font-body text-xs text-foreground/60 hover:text-foreground transition-colors">Forgot?</Link>
            </div>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              required
              className="w-full bg-background border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            className="mt-4 w-full bg-foreground text-background font-body text-xs font-medium uppercase tracking-[0.25em] py-5 rounded-full hover:bg-primary transition-colors"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 font-body text-sm text-foreground/60">
          New to Angelina?{" "}
          <Link href="#" className="text-foreground hover:text-primary transition-colors font-medium">
            Create an account
          </Link>
        </div>

      </div>
    </div>
  );
}
