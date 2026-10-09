export async function POST(_request: Request) {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}
