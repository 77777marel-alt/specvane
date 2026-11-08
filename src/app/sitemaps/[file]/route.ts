import { entriesFor, listFiles, urlsetXml } from '@/lib/sitemap'

export async function generateStaticParams() {
  return (await listFiles()).map((file) => ({ file }))
}

export async function GET(_req: Request, ctx: RouteContext<'/sitemaps/[file]'>) {
  const { file } = await ctx.params
  const entries = await entriesFor(file)
  if (!entries) return new Response('Not found', { status: 404 })
  return new Response(urlsetXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
