import { notFound } from 'next/navigation';
import Link from 'next/link';


async function getPost(slug: string) {
  const WP_URL = process.env.WC_REST_URL?.replace('/wp-json/wc/v3', '');
  if (!WP_URL) return null;
  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts?slug=${slug}&_embed`);
    if (!res.ok) return null;
    const data = await res.json();
    return data[0] || null;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog" className="text-secondary hover:underline mb-8 inline-block">← Back to Blog</Link>
      <h1 className="text-4xl md:text-5xl font-bold mb-8" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
      <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content.rendered }} />
    </main>
  );
}
