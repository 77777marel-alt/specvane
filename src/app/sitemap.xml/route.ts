import { connection } from 'next/server'
import { indexXml, listFiles } from '@/lib/sitemap'

export const maxDuration = 300

export async function GET() {
  await connection()
  const xml = indexXml(await listFiles())
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400' } })
}
