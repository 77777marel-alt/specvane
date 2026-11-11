import { connection } from 'next/server'
import { entriesFor, urlsetXml } from '@/lib/sitemap'

// Карты сайта считаются по запросу (не при сборке): с ростом каталога сборка не укладывалась в 60 с на файл.
// Результат кешируется функциями 'use cache' и CDN на час.
export const maxDuration = 300

export async function GET(_req: Request, ctx: RouteContext<'/sitemaps/[file]'>) {
  await connection()
  const { file } = await ctx.params
  const entries = await entriesFor(file)
  if (!entries) return new Response('Not found', { status: 404 })
  return new Response(urlsetXml(entries), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } })
}
