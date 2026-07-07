import { getEngine } from '@/lib/engine';

export const revalidate = 60;

export default async function HomePage() {
  const engine = await getEngine();
  const result = await engine.listProducts({ limit: 20 });

  return (
    <main className="max-w-7xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Welcome</h1>
      <p className="text-secondary">Your store has {result.total} products. Customize this page.</p>
    </main>
  );
}
