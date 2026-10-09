import Link from 'next/link';

type Post = { id: number; slug: string; title: { rendered: string }; excerpt: { rendered: string } };

async function getPosts(): Promise<Post[]> {
  const WP_URL = process.env.WC_REST_URL?.replace('/wp-json/wc/v3', '');
  if (!WP_URL) return [];
  try {
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts?_embed`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-secondary">No posts found.</p>
      ) : (
        <div className="grid gap-8">
          {posts.map(post => (
            <article key={post.id} className="border-b border-foreground/10 pb-8">
              <h2 className="text-2xl font-semibold mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:underline" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
              </h2>
              <div className="text-secondary mb-4" dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }} />
              <Link href={`/blog/${post.slug}`} className="text-sm font-medium uppercase tracking-wider">Read More →</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
