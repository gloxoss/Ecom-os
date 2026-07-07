'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="max-w-lg mx-auto px-4 py-32 text-center">
      <p className="text-8xl font-black text-foreground/10 mb-6">500</p>
      <h1 className="text-2xl font-bold mb-3">Something went wrong</h1>
      <div className="flex gap-4 justify-center mt-6">
        <button
          onClick={reset}
          className="bg-foreground text-background px-5 py-3 rounded-md font-medium hover:opacity-90 transition"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-foreground/20 px-5 py-3 rounded-md font-medium hover:bg-muted transition"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
